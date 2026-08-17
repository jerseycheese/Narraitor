import React, { useEffect, useRef, useState, useCallback } from 'react';
import { NarrativeSegment } from '@/types/narrative.types';
import { NarrativeDisplay } from './NarrativeDisplay';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBufferedNarrativeSegments } from './hooks/useBufferedNarrativeSegments';
import { getSessionTimeDividerLabel } from '@/lib/narrative/sessionTimeDivider';
import {
  applyScrollEvent,
  createFollowState,
  markAtLatestBeat,
  markLeftLatestBeat,
  shouldFollowLatestBeat,
  type FollowState,
} from '@/lib/narrative/autoFollowScroll';

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
  const followStateRef = useRef<FollowState>(createFollowState());
  const hasSettledInitialScrollRef = useRef(false);
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);

  const { renderedSegments } = useBufferedNarrativeSegments(segments, { isHydrating });

  // Fold each scroll event into the follow decision. The rules, and why
  // distance from the bottom can't decide this on its own, live in
  // lib/narrative/autoFollowScroll.
  const handleScroll = useCallback(() => {
    if (!scrollViewportRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current;
    followStateRef.current = applyScrollEvent(followStateRef.current, {
      scrollTop,
      scrollHeight,
      clientHeight,
    });

    if (followStateRef.current.isNearBottom) {
      setHasUnreadBelow(false);
    }
  }, []);

  // A new segment lands below whatever the player is reading. Follow it down
  // only if they were already at the bottom; if they'd scrolled up to re-read,
  // the sentence under their eye holds position and they get a way back
  // instead. Yanking them to the newest beat mid-sentence is the one motion
  // this surface must not make.
  useEffect(() => {
    if (segments.length > prevSegmentCountRef.current && scrollViewportRef.current) {
      if (shouldFollowLatestBeat(followStateRef.current)) {
        followStateRef.current = markAtLatestBeat(followStateRef.current);
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
    followStateRef.current = markAtLatestBeat(followStateRef.current);
    setHasUnreadBelow(false);
    scrollViewportRef.current.scrollTo({
      top: scrollViewportRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, []);

  // Open a resumed session at its latest beat — once. This used to re-fire on
  // every segment because segments.length is a dependency, which would scroll
  // the reader down 100ms after the effect above had deliberately left them
  // where they were. It can't run on mount (the viewport ref is resolved by a
  // later effect), so the run that counts is the one after isLoading flips.
  useEffect(() => {
    if (hasSettledInitialScrollRef.current) return;
    if (disableInitialAutoScroll || isLoading || segments.length === 0) return;
    if (!scrollViewportRef.current) return;

    hasSettledInitialScrollRef.current = true;

    // Use a small delay to ensure content is rendered
    const scrollTimer = setTimeout(() => {
      // Skip if they started reading somewhere else during the delay.
      if (scrollViewportRef.current && !followStateRef.current.hasLeftLatestBeat) {
        scrollViewportRef.current.scrollTo({
          top: scrollViewportRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);

    return () => clearTimeout(scrollTimer);
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
        followStateRef.current = markLeftLatestBeat(followStateRef.current);
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
        followStateRef.current = markLeftLatestBeat(followStateRef.current);
        break;
      case 'PageDown':
        event.preventDefault();
        scrollViewportRef.current.scrollTo({
          top: Math.min(scrollTop + scrollStep, scrollHeight - clientHeight),
          behavior: 'smooth'
        });
        followStateRef.current = markLeftLatestBeat(followStateRef.current);
        break;
      case 'PageUp':
        event.preventDefault();
        scrollViewportRef.current.scrollTo({
          top: Math.max(scrollTop - scrollStep, 0),
          behavior: 'smooth'
        });
        followStateRef.current = markLeftLatestBeat(followStateRef.current);
        break;
      case 'Home':
        event.preventDefault();
        const firstSegment = segments[0] as HTMLElement;
        firstSegment.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        followStateRef.current = markLeftLatestBeat(followStateRef.current);
        break;
      case 'End':
        event.preventDefault();
        // Scroll to the bottom to show the latest content
        scrollViewportRef.current.scrollTo({
          top: scrollViewportRef.current.scrollHeight,
          behavior: 'smooth'
        });
        followStateRef.current = markLeftLatestBeat(followStateRef.current);
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

        // ResizeObserver: anchor scroll to bottom during content growth.
        //
        // Watch everything the scroller scrolls. The decision block, story-beat
        // notes and consequence callout are siblings of the narrative inside
        // the same scroller and change height every turn, so observing the
        // prose column alone let that growth push the turn's choices below the
        // fold with nothing re-anchoring. The scroller's content wrapper is the
        // one box whose height tracks all of it, with the prose column as a
        // fallback when there's no wrapper.
        const contentEl = scrollTarget.firstElementChild ?? scrollContentRef.current;
        let resizeObserver: ResizeObserver | null = null;
        if (contentEl) {
          resizeObserver = new ResizeObserver(() => {
            if (shouldFollowLatestBeat(followStateRef.current) && scrollViewportRef.current) {
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
