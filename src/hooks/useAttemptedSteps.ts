import { useState, useCallback } from 'react';

/**
 * Tracks wizard steps the player has explicitly attempted to advance past
 * (e.g. clicked Next or Create while invalid).
 */
export function useAttemptedSteps(initialSteps?: Iterable<number>) {
  const [attemptedSteps, setAttemptedSteps] = useState<Set<number>>(
    () => new Set(initialSteps)
  );

  const has = useCallback(
    (step: number): boolean => attemptedSteps.has(step),
    [attemptedSteps]
  );

  const mark = useCallback((step: number) => {
    setAttemptedSteps((prev) => {
      if (prev.has(step)) return prev;
      const next = new Set(prev);
      next.add(step);
      return next;
    });
  }, []);

  const reset = useCallback((newSteps?: Iterable<number>) => {
    setAttemptedSteps(new Set(newSteps));
  }, []);

  return { has, mark, reset };
}
