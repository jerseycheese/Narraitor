import { useEffect, MutableRefObject } from 'react';
import Logger from '@/lib/utils/logger';

const logger = new Logger('TutorialProvider');

const MAX_TARGET_RETRIES = 40; // 10 seconds total (40 * 250ms)
const RETRY_INTERVAL_MS = 250;

type PauseReason = 'end-of-page' | 'missing-target' | null;

type MissingTarget = { index: number; target: string | null } | null;

/**
 * When the tour is paused because a step's target element is missing,
 * poll the DOM for it to appear (and become measurable+visible). On
 * success, clear the ref and resume the tour. On timeout, log and stop.
 */
export function useTourTargetRetry({
  isPaused,
  pauseReason,
  stepMapping,
  missingTargetRef,
  isPausedRef,
  resumeTour,
}: {
  isPaused: boolean;
  pauseReason: PauseReason;
  stepMapping: Record<number, number> | undefined;
  missingTargetRef: MutableRefObject<MissingTarget>;
  isPausedRef: MutableRefObject<boolean>;
  resumeTour: () => void;
}) {
  useEffect(() => {
    if (!isPaused || pauseReason !== 'missing-target' || !stepMapping) return;
    const missingTarget = missingTargetRef.current;
    if (!missingTarget?.target) return;

    let retries = 0;

    const retryInterval = window.setInterval(() => {
      if (!isPausedRef.current || pauseReason !== 'missing-target') {
        window.clearInterval(retryInterval);
        return;
      }

      const element = document.querySelector(missingTarget.target as string);
      if (element) {
        const rect = element.getBoundingClientRect();
        const isActuallyMounted = rect.width > 0 && rect.height > 0;
        const style = window.getComputedStyle(element);
        const isVisible = style.display !== 'none' && style.visibility !== '';

        if (isActuallyMounted && isVisible) {
          missingTargetRef.current = null;
          resumeTour();
          window.clearInterval(retryInterval);
          return;
        }
      }

      retries++;
      if (retries >= MAX_TARGET_RETRIES) {
        logger.warn('Tutorial missing target timeout', { target: missingTarget.target });
        window.clearInterval(retryInterval);
      }
    }, RETRY_INTERVAL_MS);

    return () => {
      window.clearInterval(retryInterval);
    };
  }, [isPaused, pauseReason, stepMapping, missingTargetRef, isPausedRef, resumeTour]);
}
