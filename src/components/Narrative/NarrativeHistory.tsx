import React, { useEffect, useRef, useCallback } from 'react';
import { NarrativeSegment } from '@/types/narrative.types';
import { NarrativeDisplay } from './NarrativeDisplay';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBufferedNarrativeSegments } from './hooks/useBufferedNarrativeSegments';
import { useTheme } from '@/lib/theme/ThemeProvider';

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
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const prevSegmentCountRef = useRef(segments.length);
  const hasUserScrollInteractionRef = useRef(false);
  const isNearBottomRef = useRef(true);

  const { theme } = useTheme();
  const { renderedSegments } = useBufferedNarrativeSegments(segments);

  // Check if the viewport is near the bottom
  const getIsNearBottom = useCallback(() => {
    if (!scrollViewportRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // Detect manual scrolling
  const handleScroll = useCallback(() => {
    if (!scrollViewportRef.current) return;

    isNearBottomRef.current = getIsNearBottom();

    // If user scrolled up significantly, mark as manual scroll
    if (!isNearBottomRef.current) {
      hasUserScrollInteractionRef.current = true;
    }
  }, [getIsNearBottom]);

  // Auto-scroll to bottom when new segments are added (only if near bottom)
  useEffect(() => {
    if (segments.length > prevSegmentCountRef.current && scrollViewportRef.current) {
      // Only auto-scroll if user hasn't manually scrolled or is near bottom
      if (!hasUserScrollInteractionRef.current || isNearBottomRef.current) {
        scrollViewportRef.current.scrollTo({
          top: scrollViewportRef.current.scrollHeight,
          behavior: 'auto'
        });
        hasUserScrollInteractionRef.current = false;
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
        hasUserScrollInteractionRef.current = true;
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
        hasUserScrollInteractionRef.current = true;
        break;
      case 'PageDown':
        event.preventDefault();
        scrollViewportRef.current.scrollTo({
          top: Math.min(scrollTop + scrollStep, scrollHeight - clientHeight),
          behavior: 'smooth'
        });
        hasUserScrollInteractionRef.current = true;
        break;
      case 'PageUp':
        event.preventDefault();
        scrollViewportRef.current.scrollTo({
          top: Math.max(scrollTop - scrollStep, 0),
          behavior: 'smooth'
        });
        hasUserScrollInteractionRef.current = true;
        break;
      case 'Home':
        event.preventDefault();
        const firstSegment = segments[0] as HTMLElement;
        firstSegment.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        hasUserScrollInteractionRef.current = true;
        break;
      case 'End':
        event.preventDefault();
        // Scroll to the bottom to show the latest content
        scrollViewportRef.current.scrollTo({
          top: scrollViewportRef.current.scrollHeight,
          behavior: 'smooth'
        });
        hasUserScrollInteractionRef.current = true;
        break;
      default:
        break;
    }
  }, []);
  // Only render once to prevent flashing
  const renderContent = () => {
    // If we're loading with no segments, just show the loading indicator
    if (isLoading && renderedSegments.length === 0) {
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

    // If we have segments, render them (using buffered content)
    if (renderedSegments.length > 0) {
      return (
        <>
          {renderedSegments.map((segment, index) => (
            <React.Fragment key={segment.id}>
              {theme === 'ds3' && index > 0 && (
                <hr className="manuscript-narrative-divider" />
              )}
              <NarrativeDisplay
                segment={segment}
                isLoading={false}
                error={undefined}
              />
            </React.Fragment>
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

  // Get the ScrollArea's viewport element for scroll control + ResizeObserver anchoring
  useEffect(() => {
    if (scrollAreaRef.current) {
      // Find the ScrollArea viewport within our specific component
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      if (viewport) {
        scrollViewportRef.current = viewport;
        viewport.addEventListener('scroll', handleScroll);

        // ResizeObserver: anchor scroll to bottom during content growth
        const contentEl = scrollContentRef.current;
        let resizeObserver: ResizeObserver | null = null;
        if (contentEl) {
          resizeObserver = new ResizeObserver(() => {
            if ((!hasUserScrollInteractionRef.current || isNearBottomRef.current) && scrollViewportRef.current) {
              scrollViewportRef.current.scrollTo({
                top: scrollViewportRef.current.scrollHeight,
                behavior: 'auto'
              });
            }
          });
          resizeObserver.observe(contentEl);
        }

        return () => {
          viewport.removeEventListener('scroll', handleScroll);
          resizeObserver?.disconnect();
        };
      }
    }
  }, [handleScroll]);

  return (
    <div
      className={['narrative-history-container', className].filter(Boolean).join(' ')}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{ height: '100%' }}
    >
      <ScrollArea
        ref={scrollAreaRef}
        className="mobile-scroll"
        style={{ height: '100%' }}
        viewportClassName="scroll-smooth"
        viewportStyle={{ scrollPaddingBlock: '2rem' }}
      >
        <div ref={scrollContentRef} className="narrative-history-segments">
          {renderContent()}
        </div>
      </ScrollArea>
    </div>
  );
};
