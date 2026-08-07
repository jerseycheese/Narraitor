import { useCallback, useEffect, useRef } from 'react';

type PopperInstance = { update: () => void } | null;

const getDocumentPosition = (selector: string | null) => {
  if (!selector) return null;
  const element = document.querySelector(selector);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    top: Math.round(rect.top + window.scrollY),
    left: Math.round(rect.left + window.scrollX),
  };
};

/**
 * react-joyride places a step's tooltip once, when the step opens, and never
 * re-measures it against the viewport. Any later scroll or reflow leaves the
 * tooltip on its original coordinates, so on a short phone viewport it can end
 * up hanging past the bottom edge with its body text unreadable (#1644).
 *
 * Feed the returned callback to Joyride's `floaterProps.getPopper` to capture
 * the tooltip's Popper instance. This hook then re-runs its positioning (which
 * includes the flip that moves the tooltip above the target when there is no
 * room below) on scroll, resize, and page reflow while a tour is running.
 *
 * Popper only owns the tooltip. The spotlight is drawn by Joyride itself from
 * the target's rect at render time, so when a reflow moves the target the hook
 * also calls onTargetMoved, letting the provider re-measure both together.
 * The signal is the target's position in the document rather than the
 * viewport, so scrolling (which moves target and spotlight as one) never
 * triggers it.
 */
export function useTutorialTooltipReposition(
  isActive: boolean,
  targetSelector: string | null,
  onTargetMoved: () => void
) {
  const popperRef = useRef<PopperInstance>(null);
  const frameRef = useRef<number | null>(null);
  const isUpdateScheduledRef = useRef(false);
  const onTargetMovedRef = useRef(onTargetMoved);

  useEffect(() => {
    onTargetMovedRef.current = onTargetMoved;
  }, [onTargetMoved]);

  const capturePopper = useCallback((popper: PopperInstance, type: string) => {
    // Joyride reports both the beacon wrapper and the tooltip through this
    // callback; only the tooltip needs repositioning.
    if (type !== 'wrapper') {
      popperRef.current = popper;
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;

    let lastPosition = getDocumentPosition(targetSelector);

    const scheduleUpdate = () => {
      if (isUpdateScheduledRef.current) return;
      isUpdateScheduledRef.current = true;
      frameRef.current = window.requestAnimationFrame(() => {
        isUpdateScheduledRef.current = false;
        popperRef.current?.update();

        const position = getDocumentPosition(targetSelector);
        if (!position || !lastPosition) {
          lastPosition = position;
          return;
        }
        if (position.top !== lastPosition.top || position.left !== lastPosition.left) {
          lastPosition = position;
          onTargetMovedRef.current();
        }
      });
    };

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(scheduleUpdate);
      observer.observe(document.body);
    }

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      observer?.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      isUpdateScheduledRef.current = false;
    };
  }, [isActive, targetSelector]);

  return capturePopper;
}
