import React, { useEffect, useRef, useState, useCallback } from 'react';
import { NarrativeSegment } from '@/types/narrative.types';
import { NarrativeDisplay } from './NarrativeDisplay';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBufferedNarrativeSegments } from './hooks/useBufferedNarrativeSegments';
import { getSessionTimeDividerLabel } from '@/lib/narrative/sessionTimeDivider';

/**
 * Session-relative time divider between two narrative segments — replaces
 * the old bare `<hr>` with a labeled rule.
 */
const SessionTimeDivider: React.FC<{ segment: NarrativeSegment; previousSegment: NarrativeSegment | null }> = ({
  segment,
  previousSegment,
}) => (
  <div className="manuscript-narrative-divider" role="separator">
    <span className="manuscript-narrative-divider-label">
      {getSessionTimeDividerLabel(segment, previousSegment)}
    </span>
  </div>
);

interface NarrativeHistoryProps {
  segments: NarrativeSegment[];
  isLoading?: boolean;
  error?: string;
  className?: string;
  onRetry?: () => void;
  disableInitialAutoScroll?: boolean;
  /**
   * True while the caller is still loading/deduping persisted history and
   * hasn't supplied the real segments yet. Prevents the buffered-reveal hook
   * from mistaking the first batch of stored segments for a freshly
   * generated one once it does arrive.
   */
  isHydrating?: boolean;
  /**
   * The active generation's narrative prose so far, growing as tokens
   * stream in from /api/narrative/generate (issue #1476). While isLoading is
   * true, this takes the place of the bare "Continuing your story..."
   * spinner as soon as the first token arrives — the spinner remains the
   * fallback for the gap before that.
   */
  streamingContent?: string;
}

export const NarrativeHistory: React.FC<NarrativeHistoryProps> = ({
  segments,
  isLoading = false,
  error,
  className = '',
  onRetry,
  disableInitialAutoScroll = false,
  isHydrating = false,
  streamingContent
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const prevSegmentCountRef = useRef(segments.length);
  const hasUserScrollInteractionRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);

  const { renderedSegments } = useBufferedNarrativeSegments(segments, { isHydrating });

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
    } else {
      // Back at the latest beat under their own steam — nothing left to catch up on.
      setHasUnreadBelow(false);
    }
  }, [getIsNearBottom]);

  // A new segment lands below whatever the player is reading. Follow it down
  // only if they were already at the bottom; if they'd scrolled up to re-read,
  // the sentence under their eye holds position and they get a way back
  // instead. Yanking them to the newest beat mid-sentence is the one motion
  // this surface must not make.
  useEffect(() => {
    if (segments.length > prevSegmentCountRef.current && scrollViewportRef.current) {
      const wasFollowing =
        !hasUserScrollInteractionRef.current || isNearBottomRef.current;

      if (wasFollowing) {
        isNearBottomRef.current = true;
        scrollViewportRef.current.scrollTo({
          top: scrollViewportRef.current.scrollHeight,
          behavior: 'auto'
        });
      } else {
        setHasUnreadBelow(true);
      }
    }
    prevSegmentCountRef.current = segments.length;
  }, [segments.length]);

  const jumpToLatest = useCallback(() => {
    if (!scrollViewportRef.current) return;
    hasUserScrollInteractionRef.current = false;
    isNearBottomRef.current = true;
    setHasUnreadBelow(false);
    scrollViewportRef.current.scrollTo({
      top: scrollViewportRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, []);

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
  // A synthetic segment carrying the in-progress generation's prose so far,
  // rendered through the normal NarrativeDisplay presentation instead of the
  // bare spinner once the first token arrives (issue #1476).
  const streamingPreviewSegment: NarrativeSegment | null =
    isLoading && streamingContent
      ? {
          id: '__streaming-preview__',
          content: streamingContent,
          type: 'scene',
          metadata: { tags: [] },
          timestamp: new Date(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      : null;

  // Only render once to prevent flashing
  const renderContent = () => {
    // If we're loading with no segments, show the live preview once tokens
    // have started arriving, otherwise the spinner for the gap before that.
    if (isLoading && renderedSegments.length === 0) {
      return streamingPreviewSegment ? (
        <NarrativeDisplay
          segment={streamingPreviewSegment}
          isLoading={false}
          error={undefined}
        />
      ) : (
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
              {index > 0 && (
                <SessionTimeDivider segment={segment} previousSegment={renderedSegments[index - 1]} />
              )}
              <NarrativeDisplay
                segment={segment}
                isLoading={false}
                error={undefined}
              />
            </React.Fragment>
          ))}

          {/* Loading indicator (or, once tokens arrive, the live preview)
              for the segment currently generating */}
          {isLoading && (
            <>
              {streamingPreviewSegment && (
                <SessionTimeDivider
                  segment={streamingPreviewSegment}
                  previousSegment={renderedSegments[renderedSegments.length - 1] ?? null}
                />
              )}
              <NarrativeDisplay
                segment={streamingPreviewSegment}
                isLoading={!streamingPreviewSegment}
                error={undefined}
              />
            </>
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

  // Get the active scroll target for scroll control + ResizeObserver anchoring.
  useEffect(() => {
    if (scrollAreaRef.current) {
      const playSurfaceViewport = scrollAreaRef.current.closest(
        '.manuscript-overlay-main'
      ) as HTMLElement | null;
      const radixViewport = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      ) as HTMLElement | null;
      const scrollTarget = playSurfaceViewport ?? radixViewport;

      if (scrollTarget) {
        scrollViewportRef.current = scrollTarget;
        // Passive: handleScroll only reads scroll position (no preventDefault),
        // so mark it passive to avoid blocking scroll (issue #1358).
        scrollTarget.addEventListener('scroll', handleScroll, { passive: true });

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
          scrollTarget.removeEventListener('scroll', handleScroll);
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
    >
      <ScrollArea
        ref={scrollAreaRef}
        className="mobile-scroll"
        viewportClassName="scroll-smooth"
      >
        <div ref={scrollContentRef} className="narrative-history-segments">
          {renderContent()}
        </div>
      </ScrollArea>

      {hasUnreadBelow && (
        <button
          type="button"
          className="narrative-jump-to-latest"
          onClick={jumpToLatest}
        >
          Jump to latest
        </button>
      )}
    </div>
  );
};
