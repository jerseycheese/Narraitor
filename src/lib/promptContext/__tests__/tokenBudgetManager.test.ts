import {
  ComponentPriority,
  DEFAULT_COMPONENT_BUDGETS,
  DEFAULT_TOTAL_BUDGET,
  REQUEST_TOTAL_COMPONENT_ID,
  RequestBudget,
} from '../tokenBudgetManager';

describe('RequestBudget (MVP)', () => {
  it('returns Infinity allocations when disabled', () => {
    const budget = new RequestBudget(DEFAULT_COMPONENT_BUDGETS, DEFAULT_TOTAL_BUDGET, false);

    expect(budget.isEnabled()).toBe(false);
    expect(budget.getAllocation('lore-context')).toBe(Infinity);
  });

  it('hands each component its configured limit', () => {
    const budget = new RequestBudget(DEFAULT_COMPONENT_BUDGETS, DEFAULT_TOTAL_BUDGET, true);

    expect(budget.getAllocation('base-template')).toBe(300);
    expect(budget.getAllocation('lore-context')).toBe(800);
  });

  it('allocates nothing to a component it was never configured with', () => {
    const budget = new RequestBudget(DEFAULT_COMPONENT_BUDGETS, DEFAULT_TOTAL_BUDGET, true);

    expect(budget.getAllocation('not-a-component')).toBe(0);
  });
});

describe('RequestBudget calibration', () => {
  const buildBudget = () =>
    new RequestBudget(
      [
        { componentId: 'lore-context', priority: ComponentPriority.MEDIUM, limit: 800 },
        { componentId: 'inventory', priority: ComponentPriority.MEDIUM, limit: 180 },
      ],
      DEFAULT_TOTAL_BUDGET,
      true
    );

  it('reports estimated only with undefined accuracy until an actual is recorded', () => {
    const budget = buildBudget();
    budget.recordUsage('lore-context', 500);

    expect(budget.getCalibrationData('lore-context')).toEqual({
      componentId: 'lore-context',
      estimated: 500,
      actual: undefined,
      accuracy: undefined,
    });
  });

  it('computes accuracy as actual / estimated when an actual is recorded', () => {
    const budget = buildBudget();
    budget.recordUsage('lore-context', 800, { actualTokens: 1000 });

    const calibration = budget.getCalibrationData('lore-context');
    expect(calibration.estimated).toBe(800);
    expect(calibration.actual).toBe(1000);
    expect(calibration.accuracy).toBeCloseTo(1.25);
  });

  it('returns a zero-estimate snapshot for an unrecorded component', () => {
    const budget = buildBudget();
    expect(budget.getCalibrationData('inventory')).toEqual({
      componentId: 'inventory',
      estimated: 0,
      actual: undefined,
      accuracy: undefined,
    });
  });

  it('aggregates estimated and actual across components when no id is given', () => {
    const budget = buildBudget();
    budget.recordUsage('lore-context', 800, { actualTokens: 1000 });
    budget.recordUsage('inventory', 200, { actualTokens: 200 });

    const calibration = budget.getCalibrationData();
    expect(calibration.componentId).toBeUndefined();
    expect(calibration.estimated).toBe(1000);
    expect(calibration.actual).toBe(1200);
    expect(calibration.accuracy).toBeCloseTo(1.2);
  });

  it('leaves aggregate accuracy undefined when no actuals are recorded', () => {
    const budget = buildBudget();
    budget.recordUsage('lore-context', 800);
    budget.recordUsage('inventory', 200);

    const calibration = budget.getCalibrationData();
    expect(calibration.estimated).toBe(1000);
    expect(calibration.actual).toBeUndefined();
    expect(calibration.accuracy).toBeUndefined();
  });

  it('aggregates accuracy over only the components that have actuals', () => {
    const budget = buildBudget();
    budget.recordUsage('lore-context', 800, { actualTokens: 1000 });
    budget.recordUsage('inventory', 200); // estimated only, no actual

    const calibration = budget.getCalibrationData();
    // estimated covers all recorded components...
    expect(calibration.estimated).toBe(1000);
    // ...but actual/accuracy pair only the measured subset (800 -> 1000)
    expect(calibration.actual).toBe(1000);
    expect(calibration.accuracy).toBeCloseTo(1.25);
  });
});

describe('RequestBudget.getSnapshot', () => {
  it('lists the configured components with allocation and recorded usage', () => {
    const budget = new RequestBudget(DEFAULT_COMPONENT_BUDGETS, DEFAULT_TOTAL_BUDGET, true);
    budget.recordUsage('lore-context', 420);

    const snapshot = budget.getSnapshot();

    expect(snapshot.enabled).toBe(true);
    expect(snapshot.totalBudget).toBe(DEFAULT_TOTAL_BUDGET);
    expect(snapshot.components).toHaveLength(DEFAULT_COMPONENT_BUDGETS.length);

    const lore = snapshot.components.find((c) => c.componentId === 'lore-context');
    expect(lore?.estimated).toBe(420);
    expect(lore?.allocation).toBeGreaterThan(0);
    expect(lore?.priority).toBe(ComponentPriority.MEDIUM);
  });

  it('surfaces request-level calibration separately, not as a component row', () => {
    const budget = new RequestBudget(DEFAULT_COMPONENT_BUDGETS, DEFAULT_TOTAL_BUDGET, true);
    budget.recordUsage(REQUEST_TOTAL_COMPONENT_ID, 2000, { actualTokens: 2200 });

    const snapshot = budget.getSnapshot();

    expect(
      snapshot.components.some((c) => c.componentId === REQUEST_TOTAL_COMPONENT_ID)
    ).toBe(false);
    expect(snapshot.calibration.estimated).toBe(2000);
    expect(snapshot.calibration.actual).toBe(2200);
    expect(snapshot.calibration.accuracy).toBeCloseTo(1.1);
  });

  it('reports a disabled snapshot with the configured limits', () => {
    const budget = new RequestBudget(DEFAULT_COMPONENT_BUDGETS, DEFAULT_TOTAL_BUDGET, false);
    const snapshot = budget.getSnapshot();

    expect(snapshot.enabled).toBe(false);
    const base = snapshot.components.find((c) => c.componentId === 'base-template');
    expect(base?.allocation).toBe(300);
    expect(base?.estimated).toBe(0);
  });
});
