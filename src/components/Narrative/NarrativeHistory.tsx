import React, { useEffect, useRef, useCallback } from 'react';
import { NarrativeSegment } from '@/types/narrative.types';
import { NarrativeDisplay } from './NarrativeDisplay';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NarrativeHistoryProps {
  segments: NarrativeSegment[];
  isLoading?: boolean;
  error?: string;
  className?: string;
  onRetry?: () => void;
  disableInitialAutoScroll?: boolean;
}

export const NarrativeHistory: React.FC<NarrativeHistoryProps> = ({
  segments,
  isLoading = false,
  error,
  className = '',
  onRetry,
  disableInitialAutoScroll = false
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const prevSegmentCountRef = useRef(segments.length);
  const userHasScrolledRef = useRef(false);
  const isNearBottomRef = useRef(true);

  // Detect manual scrolling
  const handleScroll = useCallback(() => {
    if (!scrollViewportRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Consider "near bottom" if within 100px
    isNearBottomRef.current = distanceFromBottom < 100;
    
    // If user scrolled up significantly, mark as manual scroll
    if (distanceFromBottom > 100) {
      userHasScrolledRef.current = true;
    }
  }, []);

  // Auto-scroll to bottom when new segments are added (only if near bottom)
  useEffect(() => {
    if (segments.length > prevSegmentCountRef.current && scrollViewportRef.current) {
      // Only auto-scroll if user hasn't manually scrolled or is near bottom
      if (!userHasScrolledRef.current || isNearBottomRef.current) {
        // Scroll to the bottom of the container to show the latest content
        scrollViewportRef.current.scrollTo({
          top: scrollViewportRef.current.scrollHeight,
          behavior: 'smooth'
        });
        userHasScrolledRef.current = false; // Reset manual scroll flag
      }
    }
    prevSegmentCountRef.current = segments.length;
  }, [segments.length]);

  // Auto-scroll to bottom on initial load for existing sessions
  useEffect(() => {
    if (segments.length > 0 && scrollViewportRef.current && !isLoading && !disableInitialAutoScroll) {
      // Use a small delay to ensure content is rendered
      const scrollTimer = setTimeout(() => {
        if (scrollViewportRef.current) {
          scrollViewportRef.current.scrollTo({
            top: scrollViewportRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);

      return () => clearTimeout(scrollTimer);
    }
  }, [segments.length, isLoading, disableInitialAutoScroll]);

  // Keyboard navigation handler with snap-to-center behavior
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!scrollViewportRef.current) return;

    const segments = scrollViewportRef.current.querySelectorAll('.narrative-segment');
    if (segments.length === 0) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current;
    const scrollStep = clientHeight * 0.8; // Scroll 80% of viewport height

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        // Find the next segment to snap to
        const currentCenter = scrollTop + clientHeight / 2;
        let nextSegment = null;
        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i] as HTMLElement;
          const segmentCenter = segment.offsetTop + segment.offsetHeight / 2;
          if (segmentCenter > currentCenter + 50) { // 50px threshold
            nextSegment = segment;
            break;
          }
        }
        if (nextSegment) {
          nextSegment.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        } else {
          // If no next segment, scroll down normally
          scrollViewportRef.current.scrollBy({
            top: 40,
            behavior: 'smooth'
          });
        }
        userHasScrolledRef.current = true;
        break;
      case 'ArrowUp':
        event.preventDefault();
        // Find the previous segment to snap to
        const currentCenterUp = scrollTop + clientHeight / 2;
        let prevSegment = null;
        for (let i = segments.length - 1; i >= 0; i--) {
          const segment = segments[i] as HTMLElement;
          const segmentCenter = segment.offsetTop + segment.offsetHeight / 2;
          if (segmentCenter < currentCenterUp - 50) { // 50px threshold
            prevSegment = segment;
            break;
          }
        }
        if (prevSegment) {
          prevSegment.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        } else {
          // If no previous segment, scroll up normally
          scrollViewportRef.current.scrollBy({
            top: -40,
            behavior: 'smooth'
          });
        }
        userHasScrolledRef.current = true;
        break;
      case 'PageDown':
        event.preventDefault();
        scrollViewportRef.current.scrollTo({
          top: Math.min(scrollTop + scrollStep, scrollHeight - clientHeight),
          behavior: 'smooth'
        });
        userHasScrolledRef.current = true;
        break;
      case 'PageUp':
        event.preventDefault();
        scrollViewportRef.current.scrollTo({
          top: Math.max(scrollTop - scrollStep, 0),
          behavior: 'smooth'
        });
        userHasScrolledRef.current = true;
        break;
      case 'Home':
        event.preventDefault();
        const firstSegment = segments[0] as HTMLElement;
        firstSegment.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        userHasScrolledRef.current = true;
        break;
      case 'End':
        event.preventDefault();
        // Scroll to the bottom to show the latest content
        scrollViewportRef.current.scrollTo({
          top: scrollViewportRef.current.scrollHeight,
          behavior: 'smooth'
        });
        userHasScrolledRef.current = true;
        break;
      default:
        break;
    }
  }, []);
  // Only render once to prevent flashing
  const renderContent = () => {
    // If we're loading with no segments, just show the loading indicator
    if (isLoading && segments.length === 0) {
      return (
        <NarrativeDisplay 
          segment={null}
          isLoading={true}
          error={undefined}
        />
      );
    }
    
    // If we have an error and we're not loading, show the error
    if (error && !isLoading) {
      return (
        <NarrativeDisplay 
          segment={null}
          isLoading={false}
          error={error}
          onRetry={onRetry}
        />
      );
    }
    
    // If we have segments, render them
    if (segments.length > 0) {
      return (
        <>
          {segments.map((segment) => (
            <NarrativeDisplay 
              key={segment.id}
              segment={segment}
              isLoading={false}
              error={undefined}
            />
          ))}
          
          {/* Loading indicator for additional segments */}
          {isLoading && (
            <NarrativeDisplay 
              segment={null}
              isLoading={true}
              error={undefined}
            />
          )}
        </>
      );
    }
    
    // Default to loading
    return (
      <NarrativeDisplay 
        segment={null}
        isLoading={true}
        error={undefined}
      />
    );
  };

  // Use full height - let the parent container control the height via JavaScript or CSS
  const heightClass = '';
  
  // Get the ScrollArea's viewport element for scroll control
  useEffect(() => {
    if (scrollAreaRef.current) {
      // Find the ScrollArea viewport within our specific component
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      if (viewport) {
        scrollViewportRef.current = viewport;
        viewport.addEventListener('scroll', handleScroll);
        
        return () => {
          viewport.removeEventListener('scroll', handleScroll);
        };
      }
    }
  }, [handleScroll]);
  
  return (
    <div
      className={['narrative-history-container', className].filter(Boolean).join(' ')}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <ScrollArea 
        ref={scrollAreaRef}
        className={[heightClass, 'mobile-scroll'].filter(Boolean).join(' ')}
        viewportClassName="scroll-smooth"
        viewportStyle={{ scrollPaddingBlock: '2rem' }}
      >
        <div className="space-y-5">
          {renderContent()}
        </div>
      </ScrollArea>
    </div>
  );
};
