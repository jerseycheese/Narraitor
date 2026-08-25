import React, { useRef, useEffect } from 'react';
import type { TermDefinitionData } from './useTermDefinitions';

interface TermDefinitionProps {
  term: TermDefinitionData;
  onDismiss: (shouldRestoreFocus?: boolean) => void;
  /** Distance from the segment's top to the clicked term, in px. */
  topOffsetPx?: number;
}

/** Breathing room between the note and the scroller's own edges. */
const SCROLLER_INSET_PX = 8;

/**
 * Displays a lore term definition as an editorial margin note (desktop)
 * or bottom sheet (mobile). Dismisses on Escape key or click outside.
 */
export const TermDefinition: React.FC<TermDefinitionProps> = ({
  term,
  onDismiss,
  topOffsetPx,
}) => {
  const ref = useRef<HTMLElement>(null);
  const [topOffset, setTopOffset] = React.useState<number | undefined>(
    topOffsetPx
  );
  const [maxHeight, setMaxHeight] = React.useState<number | undefined>(
    undefined
  );

  const style: React.CSSProperties | undefined =
    typeof topOffset === 'number' || typeof maxHeight === 'number'
      ? ({
          ...(typeof topOffset === 'number'
            ? { '--manuscript-marginalia-top': `${topOffset}px` }
            : {}),
          ...(typeof maxHeight === 'number'
            ? { '--manuscript-marginalia-max-height': `${maxHeight}px` }
            : {}),
        } as React.CSSProperties)
      : undefined;

  // Auto-focus the panel on mount so screen readers announce it
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  // Place the note in the gutter lane.
  //
  // The note is anchored to the paragraph that names the term, but what bounds
  // it is the visible scroller, not the segment. Clamping against the segment
  // is what broke the last attempt at this (#1592): a definition taller than
  // its own segment had no slot to fit in, and the tie-break pinned the bottom
  // and pushed the category badge and term name off the top of the scroller,
  // under its `overflow: hidden`.
  //
  // Capping the note's height at the visible region first is what removes the
  // tie-break rather than flipping it - once the note is guaranteed to fit,
  // the top and bottom bounds can't cross, so there's no case left to choose
  // between. A definition longer than the whole visible story area scrolls
  // inside its own box instead of running off the fold.
  React.useLayoutEffect(() => {
    if (typeof topOffsetPx !== 'number') {
      setTopOffset(undefined);
      setMaxHeight(undefined);
      return;
    }

    const updatePlacement = () => {
      const element = ref.current;
      const segment = element?.closest('.narrative-segment');

      if (!element || !segment) {
        return;
      }

      // Both can clip: the play surface scrolls at .manuscript-overlay-main,
      // and everywhere else the Radix viewport is the scroller. Where both
      // exist, the visible region is their intersection.
      const clippingRects = [
        element.closest('.manuscript-overlay-main'),
        element.closest('[data-radix-scroll-area-viewport]'),
      ]
        .filter((node): node is Element => node !== null)
        .map((node) => node.getBoundingClientRect());

      if (clippingRects.length === 0) {
        setTopOffset(topOffsetPx);
        setMaxHeight(undefined);
        return;
      }

      const visibleTop = Math.max(...clippingRects.map((rect) => rect.top));
      const visibleBottom = Math.min(
        ...clippingRects.map((rect) => rect.bottom)
      );
      const segmentTop = segment.getBoundingClientRect().top;

      const available = Math.max(
        0,
        visibleBottom - visibleTop - SCROLLER_INSET_PX * 2
      );
      const noteHeight = Math.min(element.offsetHeight, available);

      const minimumTop = visibleTop + SCROLLER_INSET_PX - segmentTop;
      const maximumTop =
        visibleBottom - SCROLLER_INSET_PX - noteHeight - segmentTop;

      setTopOffset(
        Math.round(Math.min(Math.max(topOffsetPx, minimumTop), maximumTop))
      );
      setMaxHeight(Math.round(available));
    };

    updatePlacement();
    const animationFrame = window.requestAnimationFrame(updatePlacement);
    window.addEventListener('resize', updatePlacement);
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(updatePlacement);
    if (ref.current) {
      resizeObserver?.observe(ref.current);
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', updatePlacement);
      resizeObserver?.disconnect();
    };
  }, [topOffsetPx, term]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onDismiss(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss(true);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDismiss]);

  return (
    <aside
      ref={ref}
      role="complementary"
      className="manuscript-marginalia-definition"
      aria-label={`Definition: ${term.name}`}
      tabIndex={-1}
      style={style}
    >
      <span className="manuscript-marginalia-category">{term.category}</span>
      <p className="manuscript-marginalia-name">{term.name}</p>
      {term.type && (
        <span className="manuscript-marginalia-type">{term.type}</span>
      )}
      <p className="manuscript-marginalia-description">{term.description}</p>
    </aside>
  );
};
