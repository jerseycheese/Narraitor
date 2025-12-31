import {
  ComponentPriority,
  DEFAULT_ALLOCATIONS,
  DEFAULT_TOTAL_BUDGET,
  TokenBudgetManager,
} from '../tokenBudgetManager';

describe('TokenBudgetManager (MVP)', () => {
  it('returns Infinity allocations when disabled', () => {
    const manager = new TokenBudgetManager({ enabled: false });
    const budget = manager.createBudget(DEFAULT_ALLOCATIONS, DEFAULT_TOTAL_BUDGET);

    expect(budget.isEnabled()).toBe(false);
    expect(budget.getAllocation('lore-context')).toBe(Infinity);
  });

  it('resolves allocations within a small total budget, prioritizing CRITICAL mins', () => {
    const manager = new TokenBudgetManager({ enabled: true });
    const tinyBudget = 500;
    const budget = manager.createBudget(
      [
        { componentId: 'base-template', priority: ComponentPriority.CRITICAL, min: 200, target: 300, max: 500 },
        { componentId: 'character-context', priority: ComponentPriority.CRITICAL, min: 100, target: 200, max: 400 },
        { componentId: 'lore-context', priority: ComponentPriority.MEDIUM, min: 0, target: 800, max: 1500 },
      ],
      tinyBudget
    );

    expect(budget.getAllocation('base-template')).toBeGreaterThanOrEqual(200);
    expect(budget.getAllocation('character-context')).toBeGreaterThanOrEqual(100);
    expect(budget.getAllocation('lore-context')).toBeLessThanOrEqual(tinyBudget);
  });
});

