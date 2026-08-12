/**
 * Tests for the request-level calibration wiring: response.promptTokens fed
 * into RequestBudget via recordUsage(..., { actualTokens }) and a snapshot
 * published to the calibration store. See #1333.
 */

import {
  applyBudget,
  limitNarrativeContextToBudget,
  recordRequestCalibration,
} from '../narrativeGenerator.budget';
import {
  RequestBudget,
  DEFAULT_COMPONENT_BUDGETS,
  DEFAULT_TOTAL_BUDGET,
  REQUEST_TOTAL_COMPONENT_ID,
} from '@/lib/promptContext/tokenBudgetManager';
import type { NarrativeContext } from '@/types/narrative.types';

const recordSnapshot = jest.fn();

jest.mock('@/state/calibrationStore', () => ({
  useCalibrationStore: {
    getState: () => ({ recordSnapshot }),
  },
}));

describe('recordRequestCalibration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('feeds the provider prompt-token count as the actual for request-total', () => {
    const budget = new RequestBudget(DEFAULT_COMPONENT_BUDGETS, DEFAULT_TOTAL_BUDGET, true);

    recordRequestCalibration(budget, 'a fairly short prompt to estimate', {
      promptTokens: 1500,
    });

    const calibration = budget.getCalibrationData(REQUEST_TOTAL_COMPONENT_ID);
    expect(calibration.estimated).toBeGreaterThan(0);
    expect(calibration.actual).toBe(1500);
    expect(calibration.accuracy).toBeCloseTo(1500 / calibration.estimated);
  });

  it('records an estimate but no actual when the response omits promptTokens', () => {
    const budget = new RequestBudget(DEFAULT_COMPONENT_BUDGETS, DEFAULT_TOTAL_BUDGET, true);

    recordRequestCalibration(budget, 'prompt without token usage', {});

    const calibration = budget.getCalibrationData(REQUEST_TOTAL_COMPONENT_ID);
    expect(calibration.estimated).toBeGreaterThan(0);
    expect(calibration.actual).toBeUndefined();
  });

  it('publishes a snapshot to the calibration store', () => {
    const budget = new RequestBudget(DEFAULT_COMPONENT_BUDGETS, DEFAULT_TOTAL_BUDGET, true);

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

describe('measurement decoupled from enforcement (disabled budget)', () => {
  it('applyBudget records the estimate but does not truncate when disabled', () => {
    const budget = new RequestBudget(DEFAULT_COMPONENT_BUDGETS, DEFAULT_TOTAL_BUDGET, false);
    const content = 'lore content that should not be truncated '.repeat(60);

    const out = applyBudget(content, 'lore-context', budget);

    expect(out).toBe(content); // untouched when enforcement is off
    const lore = budget
      .getSnapshot()
      .components.find((c) => c.componentId === 'lore-context');
    expect(lore?.estimated).toBeGreaterThan(0);
  });

  it('limitNarrativeContextToBudget records recent-narrative usage without dropping segments when disabled', () => {
    const budget = new RequestBudget(DEFAULT_COMPONENT_BUDGETS, DEFAULT_TOTAL_BUDGET, false);
    const context = {
      recentSegments: [
        { content: 'segment one '.repeat(80) },
        { content: 'segment two '.repeat(80) },
      ],
    } as unknown as NarrativeContext;

    const out = limitNarrativeContextToBudget(context, budget);

    expect(out?.recentSegments).toHaveLength(2); // nothing dropped
    const recent = budget
      .getSnapshot()
      .components.find((c) => c.componentId === 'recent-narrative');
    expect(recent?.estimated).toBeGreaterThan(0);
  });
});
