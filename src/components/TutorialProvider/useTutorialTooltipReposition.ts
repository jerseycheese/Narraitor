import { useCallback, useEffect, useRef } from 'react';

type PopperInstance = { update: () => void } | null;

/**
 * react-joyride places a step's tooltip once, when the step opens, and never
 * re-measures it against the viewport. Any later scroll or reflow leaves the
 * tooltip on its original coordinates, so on a short phone viewport it can end
 * up hanging past the bottom edge with its body text unreadable (#1644).
 *
 * Feed the returned callback to Joyride's `floaterProps.getPopper` to capture
 * the tooltip's Popper instance, and this hook re-runs its positioning (which
 * includes the flip that moves the tooltip above the target when there is no
 * room below) on scroll, resize, and page reflow while a tour is running.
 */
export function useTutorialTooltipReposition(isActive: boolean) {
  const popperRef = useRef<PopperInstance>(null);
  const frameRef = useRef<number | null>(null);
  const isUpdateScheduledRef = useRef(false);

  const capturePopper = useCallback((popper: PopperInstance, type: string) => {
    // Joyride reports both the beacon wrapper and the tooltip through this
    // callback; only the tooltip needs repositioning.
    if (type !== 'wrapper') {
      popperRef.current = popper;
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const scheduleUpdate = () => {
      if (isUpdateScheduledRef.current) return;
      isUpdateScheduledRef.current = true;
      frameRef.current = window.requestAnimationFrame(() => {
        isUpdateScheduledRef.current = false;
        popperRef.current?.update();
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
  }, [isActive]);

  return capturePopper;
}
