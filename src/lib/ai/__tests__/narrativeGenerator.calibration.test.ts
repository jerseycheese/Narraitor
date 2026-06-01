/**
 * Tests for the request-level calibration wiring: response.promptTokens fed
 * into RequestBudget via recordUsage(..., { actualTokens }) and a snapshot
 * published to the calibration store. See #1333.
 */

import { recordRequestCalibration } from '../narrativeGenerator.budget';
import {
  RequestBudget,
  DEFAULT_ALLOCATIONS,
  DEFAULT_TOTAL_BUDGET,
  REQUEST_TOTAL_COMPONENT_ID,
} from '@/lib/promptContext/tokenBudgetManager';

const recordSnapshot = jest.fn();

jest.mock('@/state/calibrationStore', () => ({
  useCalibrationStore: {
    getState: () => ({ recordSnapshot }),
  },
}));

describe('recordRequestCalibration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('feeds the provider prompt-token count as the actual for request-total', () => {
    const budget = new RequestBudget(DEFAULT_ALLOCATIONS, DEFAULT_TOTAL_BUDGET, true);

    recordRequestCalibration(budget, 'a fairly short prompt to estimate', {
      promptTokens: 1500,
    });

    const calibration = budget.getCalibrationData(REQUEST_TOTAL_COMPONENT_ID);
    expect(calibration.estimated).toBeGreaterThan(0);
    expect(calibration.actual).toBe(1500);
    expect(calibration.accuracy).toBeCloseTo(1500 / calibration.estimated);
  });

  it('records an estimate but no actual when the response omits promptTokens', () => {
    const budget = new RequestBudget(DEFAULT_ALLOCATIONS, DEFAULT_TOTAL_BUDGET, true);

    recordRequestCalibration(budget, 'prompt without token usage', {});

    const calibration = budget.getCalibrationData(REQUEST_TOTAL_COMPONENT_ID);
    expect(calibration.estimated).toBeGreaterThan(0);
    expect(calibration.actual).toBeUndefined();
  });

  it('publishes a snapshot to the calibration store', () => {
    const budget = new RequestBudget(DEFAULT_ALLOCATIONS, DEFAULT_TOTAL_BUDGET, true);

    recordRequestCalibration(budget, 'prompt', { promptTokens: 900 });

    expect(recordSnapshot).toHaveBeenCalledTimes(1);
    const snapshot = recordSnapshot.mock.calls[0][0];
    expect(snapshot.calibration.actual).toBe(900);
    expect(
      snapshot.components.some(
        (c: { componentId: string }) => c.componentId === REQUEST_TOTAL_COMPONENT_ID
      )
    ).toBe(false);
  });
});
