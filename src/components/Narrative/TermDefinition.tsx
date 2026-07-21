import React, { useRef, useEffect } from 'react';
import type { TermDefinitionData } from './useTermDefinitions';

interface TermDefinitionProps {
  term: TermDefinitionData;
  onDismiss: (shouldRestoreFocus?: boolean) => void;
  topOffsetPx?: number;
}

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
  const [resolvedTopOffset, setResolvedTopOffset] = React.useState(topOffsetPx);
  const style =
    typeof resolvedTopOffset === 'number'
      ? ({ '--manuscript-marginalia-top': `${resolvedTopOffset}px` } as React.CSSProperties)
      : undefined;

  // Auto-focus the panel on mount so screen readers announce it
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  React.useLayoutEffect(() => {
    if (typeof topOffsetPx !== 'number') {
      setResolvedTopOffset(undefined);
      return;
    }

    const updateTopOffset = () => {
      const element = ref.current;
      const segment = element?.closest('.narrative-segment');
      const historyViewport = element?.closest(
        '[data-radix-scroll-area-viewport]'
      );
      const scroller = element?.closest('.manuscript-overlay-main');

      if (!element || !segment || !scroller) {
        setResolvedTopOffset(topOffsetPx);
        return;
      }

      const segmentRect = segment.getBoundingClientRect();
      const nextSegmentRect =
        segment.nextElementSibling?.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      const historyViewportRect = historyViewport?.getBoundingClientRect();
      const viewportInset = 8;
      const clippingTop = Math.max(
        scrollerRect.top,
        historyViewportRect?.top ?? scrollerRect.top
      );
      const clippingBottom = Math.min(
        scrollerRect.bottom,
        historyViewportRect?.bottom ?? scrollerRect.bottom,
        nextSegmentRect && nextSegmentRect.top > segmentRect.top
          ? nextSegmentRect.top - viewportInset
          : scrollerRect.bottom
      );
      const minimumTopOffset = clippingTop - segmentRect.top + viewportInset;
      const maximumTopOffset =
        clippingBottom - segmentRect.top - element.offsetHeight - viewportInset;
      const adjustedTopOffset =
        maximumTopOffset < minimumTopOffset
          ? maximumTopOffset
          : Math.min(topOffsetPx, Math.max(minimumTopOffset, maximumTopOffset));

      setResolvedTopOffset(Math.round(adjustedTopOffset));
    };

    updateTopOffset();
    const animationFrame = window.requestAnimationFrame(updateTopOffset);
    window.addEventListener('resize', updateTopOffset);
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(updateTopOffset);
    if (ref.current) {
      resizeObserver?.observe(ref.current);
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', updateTopOffset);
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
