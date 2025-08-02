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
}

export const NarrativeHistory: React.FC<NarrativeHistoryProps> = ({
  segments,
  isLoading = false,
  error,
  className = '',
  onRetry
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
        scrollViewportRef.current.scrollTo({
          top: scrollViewportRef.current.scrollHeight,
          behavior: 'smooth'
        });
        userHasScrolledRef.current = false; // Reset manual scroll flag
      }
    }
    prevSegmentCountRef.current = segments.length;
  }, [segments.length]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!scrollViewportRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current;
    const scrollStep = clientHeight * 0.8; // Scroll 80% of viewport height

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        scrollViewportRef.current.scrollTo({
          top: Math.min(scrollTop + 40, scrollHeight - clientHeight),
          behavior: 'smooth'
        });
        userHasScrolledRef.current = true;
        break;
      case 'ArrowUp':
        event.preventDefault();
        scrollViewportRef.current.scrollTo({
          top: Math.max(scrollTop - 40, 0),
          behavior: 'smooth'
        });
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
        scrollViewportRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        userHasScrolledRef.current = true;
        break;
      case 'End':
        event.preventDefault();
        scrollViewportRef.current.scrollTo({
          top: scrollHeight - clientHeight,
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

  // Always use a fixed height to ensure scrolling works properly
  const heightClass = 'h-[580px]'; // Fixed height to enable scrolling
  
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
      className={`narrative-history-container ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0} // Make focusable for keyboard navigation
      style={{ outline: 'none' }} // Remove focus outline for better UX
    >
      <ScrollArea 
        ref={scrollAreaRef}
        className={`${heightClass} bg-gray-50 dark:bg-gray-800 rounded-lg shadow-inner`}
        style={{
          // Enable smooth momentum scrolling on touch devices
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className="space-y-4 px-4 py-4" style={{ scrollSnapType: 'y mandatory' }}>
          {renderContent()}
        </div>
      </ScrollArea>
    </div>
  );
};
