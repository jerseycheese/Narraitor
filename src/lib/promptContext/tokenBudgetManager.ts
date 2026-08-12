/**
 * Priority levels for a prompt component.
 *
 * Display-only: it orders the DevTools panel's rows and picks the guidance
 * shown when a component runs over. It does not affect how much budget a
 * component gets — every component has a fixed limit.
 */
export enum ComponentPriority {
  CRITICAL = 0,
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3,
}

/** A single prompt component's token ceiling. */
export interface ComponentBudget {
  componentId: string;
  priority: ComponentPriority;
  limit: number;
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
 * the component's limit (the bar denominator); `estimated` is the recorded
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
  private budgets: Map<string, ComponentBudget> = new Map();
  private usage: Map<string, number> = new Map();
  private actualUsage: Map<string, number> = new Map();
  private enabled: boolean;
  private totalBudget: number;

  constructor(
    budgets: ComponentBudget[],
    totalBudget: number,
    enabled: boolean = true
  ) {
    this.enabled = enabled;
    this.totalBudget = totalBudget;

    for (const budget of budgets) {
      this.budgets.set(budget.componentId, budget);
      this.usage.set(budget.componentId, 0);
    }
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

    return this.budgets.get(componentId)?.limit ?? 0;
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
    for (const [componentId, budget] of this.budgets) {
      components.push({
        componentId,
        priority: budget.priority,
        allocation: budget.limit,
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
 * Per-component token ceilings for narrative generation.
 * Based on initial prompt analysis and expected growth.
 */
export const DEFAULT_COMPONENT_BUDGETS: ComponentBudget[] = [
  { componentId: 'base-template', priority: ComponentPriority.CRITICAL, limit: 300 },
  { componentId: 'character-context', priority: ComponentPriority.CRITICAL, limit: 200 },
  { componentId: 'recent-narrative', priority: ComponentPriority.HIGH, limit: 1200 },
  { componentId: 'goals', priority: ComponentPriority.HIGH, limit: 300 },
  { componentId: 'tone-settings', priority: ComponentPriority.MEDIUM, limit: 400 },
  { componentId: 'lore-context', priority: ComponentPriority.MEDIUM, limit: 800 },
  { componentId: 'inventory', priority: ComponentPriority.MEDIUM, limit: 180 },
  { componentId: 'personalization', priority: ComponentPriority.MEDIUM, limit: 800 },
  { componentId: 'item-instructions', priority: ComponentPriority.LOW, limit: 200 },
  { componentId: 'examples', priority: ComponentPriority.LOW, limit: 200 },
  { componentId: 'phrase-variety', priority: ComponentPriority.LOW, limit: 100 },
];

/**
 * Total budget reported by the DevTools panel (conservative ~8% of a 1M context
 * window). Component limits are enforced individually, so this is the headroom
 * figure rather than a pool the components compete over.
 */
export const DEFAULT_TOTAL_BUDGET = 80000;
