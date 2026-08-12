/**
 * Prompt size observability for the DevTools panel.
 *
 * Measurement only. Prompt components are bounded where they are assembled —
 * the segment window is sliced by the caller, lore is capped at 20 facts, and
 * the character section has no growth term — so nothing here trims a prompt.
 * It records what a request actually weighed and reconciles the heuristic
 * estimate against the provider's own count.
 */

/**
 * Reference figure the panel measures a request against — a conservative ~8% of
 * a 1M context window. It is headroom, not a ceiling: nothing enforces it.
 */
export const DEFAULT_TOTAL_BUDGET = 80000;

/**
 * A single request's measured prompt size. `accuracy` (actual / estimated) is
 * present only once the provider has reported a count and the estimate is
 * non-zero.
 */
export interface PromptCalibrationSnapshot {
  totalBudget: number;
  estimated: number;
  actual?: number;
  accuracy?: number;
}

/**
 * Build a snapshot, computing accuracy only when an actual count is available
 * and the estimate is non-zero (avoids divide-by-zero).
 */
export function buildCalibrationSnapshot(
  estimated: number,
  actual?: number,
  totalBudget: number = DEFAULT_TOTAL_BUDGET
): PromptCalibrationSnapshot {
  const accuracy =
    actual !== undefined && estimated > 0 ? actual / estimated : undefined;
  return { totalBudget, estimated, actual, accuracy };
}
