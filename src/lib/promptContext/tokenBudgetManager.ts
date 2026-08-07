/**
 * Component priority levels for budget allocation and degradation
 */
export enum ComponentPriority {
  CRITICAL = 0,
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3,
}

/**
 * Configuration for a single component's budget allocation
 */
export interface BudgetAllocation {
  componentId: string;
  priority: ComponentPriority;
  min: number;
  target: number;
  max: number;
}

/**
 * Calibration snapshot comparing the heuristic token estimate against an actual
 * token count from the AI provider. `accuracy` (actual / estimated) is only
 * present once an actual has been recorded and the estimate is non-zero.
 */
export interface CalibrationData {
  componentId?: string;
  estimated: number;
  actual?: number;
  accuracy?: number;
}

/**
 * Per-component usage figures for the observability snapshot. `allocation` is
 * the resolved target budget (the bar denominator); `estimated` is the recorded
 * heuristic token count for the most recent request.
 */
export interface ComponentBudgetUsage {
  componentId: string;
  priority: ComponentPriority;
  allocation: number;
  estimated: number;
}

/**
 * A read-only snapshot of a request's budget state, consumed by the DevTools
 * TokenBudgetPanel. `calibration` is the request-level estimate-vs-actual
 * reconciliation (see `recordUsage('request-total', ...)`).
 */
export interface TokenBudgetSnapshot {
  enabled: boolean;
  totalBudget: number;
  components: ComponentBudgetUsage[];
  calibration: CalibrationData;
}

/** Reserved component id for the request-level whole-prompt calibration. */
export const REQUEST_TOTAL_COMPONENT_ID = 'request-total';

/**
 * Request budget instance for tracking allocations during a single request
 */
export class RequestBudget {
  private allocations: Map<string, BudgetAllocation> = new Map();
  private usage: Map<string, number> = new Map();
  private actualUsage: Map<string, number> = new Map();
  private enabled: boolean;
  private totalBudget: number;

  constructor(
    allocations: BudgetAllocation[],
    totalBudget: number,
    enabled: boolean = true
  ) {
    this.enabled = enabled;
    this.totalBudget = totalBudget;

    if (!enabled) {
      // When disabled, store allocations but don't enforce limits
      for (const allocation of allocations) {
        this.allocations.set(allocation.componentId, allocation);
        this.usage.set(allocation.componentId, 0);
      }
      return;
    }

    // Calculate actual allocations based on budget constraints
    const resolved = this.resolveAllocations(allocations, totalBudget);
    for (const [componentId, allocation] of resolved) {
      this.allocations.set(componentId, allocation);
      this.usage.set(componentId, 0);
    }
  }

  /**
   * Resolve allocations to fit within total budget
   * Uses priority-based reduction when budget is tight
   */
  private resolveAllocations(
    allocations: BudgetAllocation[],
    totalBudget: number
  ): Map<string, BudgetAllocation> {
    const result = new Map<string, BudgetAllocation>();

    // Sort by priority (CRITICAL first)
    const sorted = [...allocations].sort((a, b) => a.priority - b.priority);

    // First pass: allocate minimum to all CRITICAL components
    let usedBudget = 0;
    const criticalComponents: BudgetAllocation[] = [];
    const otherComponents: BudgetAllocation[] = [];

    for (const allocation of sorted) {
      if (allocation.priority === ComponentPriority.CRITICAL) {
        criticalComponents.push(allocation);
        usedBudget += allocation.min;
      } else {
        otherComponents.push(allocation);
      }
    }

    // Allocate CRITICAL components first
    for (const allocation of criticalComponents) {
      const available = totalBudget - usedBudget + allocation.min;
      const allocated = Math.min(allocation.target, available, allocation.max);
      result.set(allocation.componentId, { ...allocation, target: allocated });
      usedBudget = usedBudget - allocation.min + allocated;
    }

    // Calculate remaining budget for other components
    let remainingBudget = totalBudget - usedBudget;

    // Second pass: allocate to other components by priority
    for (const allocation of otherComponents) {
      if (remainingBudget <= 0) {
        // No budget left - allocate minimum (which may be 0)
        result.set(allocation.componentId, { ...allocation, target: allocation.min });
        continue;
      }

      // Calculate allocation based on remaining budget
      const targetAllocation = Math.min(
        allocation.target,
        remainingBudget,
        allocation.max
      );

      const actualAllocation = Math.max(targetAllocation, allocation.min);
      result.set(allocation.componentId, { ...allocation, target: actualAllocation });
      remainingBudget -= actualAllocation;
    }

    return result;
  }

  /**
   * Check if budget tracking is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get the allocated budget for a component
   */
  getAllocation(componentId: string): number {
    if (!this.enabled) {
      return Infinity;
    }

    const allocation = this.allocations.get(componentId);
    return allocation ? allocation.target : 0;
  }

  /**
   * Record token usage for a component.
   *
   * `tokens` is the estimated (heuristic) count. Pass `options.actualTokens`
   * when an actual count is known (e.g. from the AI provider's usage metadata)
   * to enable calibration of the estimation heuristics.
   */
  recordUsage(
    componentId: string,
    tokens: number,
    options?: { actualTokens?: number }
  ): void {
    this.usage.set(componentId, tokens);
    if (options?.actualTokens !== undefined) {
      this.actualUsage.set(componentId, options.actualTokens);
    }
  }

  /**
   * Get calibration data comparing estimated vs actual token counts.
   *
   * With a `componentId`, returns that component's snapshot. Without one,
   * returns the aggregate across every component that has recorded usage.
   *
   * The aggregate `estimated` covers all recorded components, but `actual` and
   * `accuracy` are computed only over the subset that has provider counts — so
   * accuracy stays an apples-to-apples ratio rather than dividing a full-set
   * estimate by a partial-set actual.
   */
  getCalibrationData(componentId?: string): CalibrationData {
    if (componentId !== undefined) {
      return buildCalibration(
        this.usage.get(componentId) ?? 0,
        this.actualUsage.get(componentId),
        componentId
      );
    }

    let estimated = 0;
    for (const value of this.usage.values()) {
      estimated += value;
    }

    // Aggregate actual/accuracy only over components that have an actual count,
    // pairing each with its own estimate so the ratio compares the same subset.
    let actual: number | undefined;
    let measuredEstimated = 0;
    for (const [id, actualTokens] of this.actualUsage) {
      actual = (actual ?? 0) + actualTokens;
      measuredEstimated += this.usage.get(id) ?? 0;
    }

    const accuracy =
      actual !== undefined && measuredEstimated > 0
        ? actual / measuredEstimated
        : undefined;

    return { estimated, actual, accuracy };
  }

  /**
   * Build a read-only snapshot of the current budget state for observability.
   *
   * Covers the configured components (the reserved `request-total` lives only in
   * the usage map, so it is naturally excluded from the per-component list and
   * surfaced separately as `calibration`).
   */
  getSnapshot(): TokenBudgetSnapshot {
    const components: ComponentBudgetUsage[] = [];
    for (const [componentId, allocation] of this.allocations) {
      components.push({
        componentId,
        priority: allocation.priority,
        allocation: allocation.target,
        estimated: this.usage.get(componentId) ?? 0,
      });
    }

    return {
      enabled: this.enabled,
      totalBudget: this.totalBudget,
      components,
      calibration: this.getCalibrationData(REQUEST_TOTAL_COMPONENT_ID),
    };
  }
}

/**
 * Build a calibration snapshot, computing accuracy only when an actual count is
 * available and the estimate is non-zero (avoids divide-by-zero).
 */
function buildCalibration(
  estimated: number,
  actual: number | undefined,
  componentId?: string
): CalibrationData {
  const accuracy =
    actual !== undefined && estimated > 0 ? actual / estimated : undefined;
  return { componentId, estimated, actual, accuracy };
}

/**
 * Default component allocations for narrative generation
 * Based on initial prompt analysis and expected growth.
 */
export const DEFAULT_ALLOCATIONS: BudgetAllocation[] = [
  { componentId: 'base-template', priority: ComponentPriority.CRITICAL, min: 200, target: 300, max: 500 },
  { componentId: 'character-context', priority: ComponentPriority.CRITICAL, min: 100, target: 200, max: 400 },
  { componentId: 'recent-narrative', priority: ComponentPriority.HIGH, min: 600, target: 1200, max: 2000 },
  { componentId: 'goals', priority: ComponentPriority.HIGH, min: 100, target: 300, max: 600 },
  { componentId: 'tone-settings', priority: ComponentPriority.MEDIUM, min: 0, target: 400, max: 600 },
  { componentId: 'lore-context', priority: ComponentPriority.MEDIUM, min: 0, target: 800, max: 1500 },
  { componentId: 'inventory', priority: ComponentPriority.MEDIUM, min: 80, target: 180, max: 300 },
  { componentId: 'personalization', priority: ComponentPriority.MEDIUM, min: 200, target: 800, max: 1500 },
  { componentId: 'item-instructions', priority: ComponentPriority.LOW, min: 0, target: 200, max: 400 },
  { componentId: 'examples', priority: ComponentPriority.LOW, min: 0, target: 200, max: 400 },
  { componentId: 'phrase-variety', priority: ComponentPriority.LOW, min: 0, target: 100, max: 200 },
];

/**
 * Default total budget (conservative ~8% of 1M context window)
 */
export const DEFAULT_TOTAL_BUDGET = 80000;
