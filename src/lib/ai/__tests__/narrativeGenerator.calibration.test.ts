/**
 * Tests for the request-level calibration wiring: the provider's promptTokens
 * becomes the actual, and a snapshot reaches the calibration store.
 */

import { recordRequestCalibration } from '../narrativeGenerator.calibration';
import { DEFAULT_TOTAL_BUDGET } from '@/lib/promptContext/promptCalibration';

const recordSnapshot = jest.fn();

jest.mock('@/state/calibrationStore', () => ({
  useCalibrationStore: {
    getState: () => ({ recordSnapshot }),
  },
}));

describe('recordRequestCalibration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('publishes the provider prompt-token count as the actual', () => {
    recordRequestCalibration('a fairly short prompt to estimate', {
      promptTokens: 1500,
    });

    expect(recordSnapshot).toHaveBeenCalledTimes(1);
    const snapshot = recordSnapshot.mock.calls[0][0];
    expect(snapshot.estimated).toBeGreaterThan(0);
    expect(snapshot.actual).toBe(1500);
    expect(snapshot.accuracy).toBeCloseTo(1500 / snapshot.estimated);
    expect(snapshot.totalBudget).toBe(DEFAULT_TOTAL_BUDGET);
  });

  it('records an estimate but no actual when the response omits promptTokens', () => {
    recordRequestCalibration('prompt without token usage', {});

    const snapshot = recordSnapshot.mock.calls[0][0];
    expect(snapshot.estimated).toBeGreaterThan(0);
    expect(snapshot.actual).toBeUndefined();
    expect(snapshot.accuracy).toBeUndefined();
  });
});
