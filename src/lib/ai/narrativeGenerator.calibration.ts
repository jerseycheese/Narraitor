import {
  buildCalibrationSnapshot,
  DEFAULT_TOTAL_BUDGET,
} from '@/lib/promptContext/promptCalibration';
import { estimateTokenCount } from '@/lib/promptContext/tokenUtils';
import { useCalibrationStore } from '@/state/calibrationStore';

/**
 * Measure a finished request and publish it for the DevTools panel.
 *
 * Reconciles the whole-prompt heuristic estimate against the provider's actual
 * prompt-token count. Per-component actuals aren't available from the Gemini
 * API, so the request total is the only figure that can be calibrated.
 */
export const recordRequestCalibration = (
  fullPrompt: string,
  response: { promptTokens?: number } | undefined
): void => {
  const actualTokens =
    typeof response?.promptTokens === 'number' ? response.promptTokens : undefined;

  publishCalibrationSnapshot(
    buildCalibrationSnapshot(
      estimateTokenCount(fullPrompt),
      actualTokens,
      DEFAULT_TOTAL_BUDGET
    )
  );
};

/**
 * Push a snapshot into the calibration store for the DevTools panel. Browser +
 * non-production only; failures are swallowed so that observability never
 * interferes with narrative generation.
 */
const publishCalibrationSnapshot = (
  snapshot: ReturnType<typeof buildCalibrationSnapshot>
): void => {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
    return;
  }

  try {
    useCalibrationStore.getState().recordSnapshot(snapshot);
  } catch {
    // Intentionally ignored — observability must never break generation.
  }
};
