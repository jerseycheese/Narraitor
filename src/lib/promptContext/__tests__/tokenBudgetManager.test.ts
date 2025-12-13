import {
  TokenBudgetManager,
  ComponentPriority,
  BudgetAllocation,
  DegradationResult,
} from '../tokenBudgetManager';

describe('TokenBudgetManager', () => {
  let manager: TokenBudgetManager;

  beforeEach(() => {
    manager = new TokenBudgetManager();
  });

  describe('budget allocation', () => {
    it('allocates tokens to components respecting priority order', () => {
      const allocations: BudgetAllocation[] = [
        { componentId: 'base-template', priority: ComponentPriority.CRITICAL, min: 200, target: 300, max: 500 },
        { componentId: 'character-context', priority: ComponentPriority.CRITICAL, min: 100, target: 200, max: 400 },
        { componentId: 'recent-narrative', priority: ComponentPriority.HIGH, min: 600, target: 1200, max: 2000 },
        { componentId: 'tone-settings', priority: ComponentPriority.MEDIUM, min: 0, target: 400, max: 600 },
        { componentId: 'examples', priority: ComponentPriority.LOW, min: 0, target: 200, max: 400 },
      ];

      const budget = manager.createBudget(allocations, 80000);

      // All components should get their target allocations when budget is ample
      expect(budget.getAllocation('base-template')).toBe(300);
      expect(budget.getAllocation('character-context')).toBe(200);
      expect(budget.getAllocation('recent-narrative')).toBe(1200);
      expect(budget.getAllocation('tone-settings')).toBe(400);
      expect(budget.getAllocation('examples')).toBe(200);
    });

    it('tracks actual usage against allocated budgets', () => {
      const allocations: BudgetAllocation[] = [
        { componentId: 'base-template', priority: ComponentPriority.CRITICAL, min: 200, target: 300, max: 500 },
      ];

      const budget = manager.createBudget(allocations, 80000);

      budget.recordUsage('base-template', 250);

      const status = budget.getComponentStatus('base-template');
      expect(status.allocated).toBe(300);
      expect(status.used).toBe(250);
      expect(status.remaining).toBe(50);
      expect(status.overBudget).toBe(false);
    });

    it('detects when a component exceeds its allocation', () => {
      const allocations: BudgetAllocation[] = [
        { componentId: 'tone-settings', priority: ComponentPriority.MEDIUM, min: 0, target: 400, max: 600 },
      ];

      const budget = manager.createBudget(allocations, 80000);

      budget.recordUsage('tone-settings', 450);

      const status = budget.getComponentStatus('tone-settings');
      expect(status.overBudget).toBe(true);
      expect(status.overage).toBe(50);
    });
  });

  describe('graceful degradation', () => {
    it('reduces LOW priority components first when budget is tight', () => {
      const allocations: BudgetAllocation[] = [
        { componentId: 'base-template', priority: ComponentPriority.CRITICAL, min: 200, target: 300, max: 500 },
        { componentId: 'recent-narrative', priority: ComponentPriority.HIGH, min: 600, target: 1200, max: 2000 },
        { componentId: 'tone-settings', priority: ComponentPriority.MEDIUM, min: 0, target: 400, max: 600 },
        { componentId: 'examples', priority: ComponentPriority.LOW, min: 0, target: 200, max: 400 },
      ];

      // Very tight budget that can't fit all targets
      const budget = manager.createBudget(allocations, 1500);

      // LOW priority should be reduced first
      expect(budget.getAllocation('examples')).toBeLessThan(200);
      // CRITICAL should still get target
      expect(budget.getAllocation('base-template')).toBeGreaterThanOrEqual(200);
    });

    it('never reduces CRITICAL components below minimum', () => {
      const allocations: BudgetAllocation[] = [
        { componentId: 'base-template', priority: ComponentPriority.CRITICAL, min: 200, target: 300, max: 500 },
        { componentId: 'character-context', priority: ComponentPriority.CRITICAL, min: 100, target: 200, max: 400 },
      ];

      // Extremely tight budget
      const budget = manager.createBudget(allocations, 300);

      // CRITICAL components should get at least their minimum
      expect(budget.getAllocation('base-template')).toBeGreaterThanOrEqual(200);
      expect(budget.getAllocation('character-context')).toBeGreaterThanOrEqual(100);
    });

    it('provides degradation instructions when budget exceeded', () => {
      const allocations: BudgetAllocation[] = [
        { componentId: 'base-template', priority: ComponentPriority.CRITICAL, min: 200, target: 300, max: 500 },
        { componentId: 'lore-context', priority: ComponentPriority.MEDIUM, min: 0, target: 800, max: 1500 },
        { componentId: 'examples', priority: ComponentPriority.LOW, min: 0, target: 200, max: 400 },
      ];

      const budget = manager.createBudget(allocations, 80000);

      // Simulate over-usage
      budget.recordUsage('base-template', 300);
      budget.recordUsage('lore-context', 1000);
      budget.recordUsage('examples', 300);

      const degradation = budget.getDegradationPlan();

      // Should suggest reducing LOW priority first
      expect(degradation.suggestions.length).toBeGreaterThan(0);
      expect(degradation.suggestions[0].componentId).toBe('examples');
      expect(degradation.totalOverage).toBe(200); // 300 over lore + 100 over examples - only examples over target
    });

    it('calculates degradation in correct priority order', () => {
      const allocations: BudgetAllocation[] = [
        { componentId: 'base-template', priority: ComponentPriority.CRITICAL, min: 200, target: 300, max: 500 },
        { componentId: 'recent-narrative', priority: ComponentPriority.HIGH, min: 600, target: 1200, max: 2000 },
        { componentId: 'tone-settings', priority: ComponentPriority.MEDIUM, min: 0, target: 400, max: 600 },
        { componentId: 'item-instructions', priority: ComponentPriority.LOW, min: 0, target: 200, max: 400 },
        { componentId: 'examples', priority: ComponentPriority.LOW, min: 0, target: 200, max: 400 },
      ];

      const budget = manager.createBudget(allocations, 80000);

      // All components over budget
      budget.recordUsage('base-template', 350);
      budget.recordUsage('recent-narrative', 1500);
      budget.recordUsage('tone-settings', 500);
      budget.recordUsage('item-instructions', 250);
      budget.recordUsage('examples', 250);

      const degradation = budget.getDegradationPlan();

      // Degradation order should be: LOW -> MEDIUM -> HIGH -> CRITICAL
      const priorities = degradation.suggestions.map(s => s.priority);

      // LOW priority components should be suggested first
      const lowIndex = priorities.findIndex(p => p === ComponentPriority.LOW);
      const mediumIndex = priorities.findIndex(p => p === ComponentPriority.MEDIUM);
      const highIndex = priorities.findIndex(p => p === ComponentPriority.HIGH);

      if (lowIndex !== -1 && mediumIndex !== -1) {
        expect(lowIndex).toBeLessThan(mediumIndex);
      }
      if (mediumIndex !== -1 && highIndex !== -1) {
        expect(mediumIndex).toBeLessThan(highIndex);
      }
    });
  });

  describe('budget summary', () => {
    it('provides overall budget status including all components', () => {
      const allocations: BudgetAllocation[] = [
        { componentId: 'base-template', priority: ComponentPriority.CRITICAL, min: 200, target: 300, max: 500 },
        { componentId: 'recent-narrative', priority: ComponentPriority.HIGH, min: 600, target: 1200, max: 2000 },
      ];

      const budget = manager.createBudget(allocations, 80000);

      budget.recordUsage('base-template', 280);
      budget.recordUsage('recent-narrative', 1100);

      const summary = budget.getSummary();

      expect(summary.totalBudget).toBe(80000);
      expect(summary.totalAllocated).toBe(1500); // 300 + 1200
      expect(summary.totalUsed).toBe(1380); // 280 + 1100
      expect(summary.componentsOverBudget).toBe(0);
      expect(summary.budgetUtilization).toBeCloseTo(1380 / 80000, 4);
    });

    it('tracks calibration data for estimation accuracy', () => {
      const allocations: BudgetAllocation[] = [
        { componentId: 'test-component', priority: ComponentPriority.MEDIUM, min: 0, target: 500, max: 1000 },
      ];

      const budget = manager.createBudget(allocations, 80000);

      // Record estimated vs actual
      budget.recordUsage('test-component', 450, { estimatedTokens: 400 });

      const calibration = budget.getCalibrationData('test-component');

      expect(calibration.estimatedTokens).toBe(400);
      expect(calibration.actualTokens).toBe(450);
      expect(calibration.accuracy).toBeCloseTo(400 / 450, 2);
    });
  });

  describe('feature flag support', () => {
    it('can be disabled via constructor option', () => {
      const disabledManager = new TokenBudgetManager({ enabled: false });

      const allocations: BudgetAllocation[] = [
        { componentId: 'test', priority: ComponentPriority.MEDIUM, min: 0, target: 500, max: 1000 },
      ];

      const budget = disabledManager.createBudget(allocations, 80000);

      // When disabled, should return unlimited budget
      expect(budget.isEnabled()).toBe(false);
      expect(budget.getAllocation('test')).toBe(Infinity);
    });
  });
});
