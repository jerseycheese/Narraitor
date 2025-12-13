/**
 * Token Budget Manager for Context Window Management
 *
 * Provides centralized budget tracking across all prompt components with
 * priority-based allocation and graceful degradation when limits are approached.
 *
 * @module tokenBudgetManager
 */

/**
 * Component priority levels for budget allocation and degradation
 */
export enum ComponentPriority {
  /** Never drop - essential for generation (base template, character context) */
  CRITICAL = 0,
  /** Reduce minimally - important for coherence (recent narrative, critical goals) */
  HIGH = 1,
  /** Reduce significantly when needed (lore, tone, inventory) */
  MEDIUM = 2,
  /** Drop first when budget is tight (examples, old decisions) */
  LOW = 3,
}

/**
 * Configuration for a single component's budget allocation
 */
export interface BudgetAllocation {
  /** Unique identifier for the component */
  componentId: string;
  /** Priority level for degradation ordering */
  priority: ComponentPriority;
  /** Minimum tokens required (never go below this) */
  min: number;
  /** Target allocation when budget is ample */
  target: number;
  /** Maximum tokens allowed (cap for this component) */
  max: number;
}

/**
 * Status information for a single component
 */
export interface ComponentStatus {
  componentId: string;
  priority: ComponentPriority;
  allocated: number;
  used: number;
  remaining: number;
  overBudget: boolean;
  overage: number;
}

/**
 * Suggestion for reducing a component's token usage
 */
export interface DegradationSuggestion {
  componentId: string;
  priority: ComponentPriority;
  currentUsage: number;
  suggestedLimit: number;
  reduction: number;
}

/**
 * Result of calculating degradation plan
 */
export interface DegradationResult {
  suggestions: DegradationSuggestion[];
  totalOverage: number;
  canRecover: boolean;
}

/**
 * Overall budget summary
 */
export interface BudgetSummary {
  totalBudget: number;
  totalAllocated: number;
  totalUsed: number;
  componentsOverBudget: number;
  budgetUtilization: number;
}

/**
 * Calibration data for estimation accuracy tracking
 */
export interface CalibrationData {
  estimatedTokens: number;
  actualTokens: number;
  accuracy: number;
}

/**
 * Options for recording usage
 */
export interface UsageOptions {
  estimatedTokens?: number;
}

/**
 * Configuration options for TokenBudgetManager
 */
export interface TokenBudgetManagerOptions {
  /** Whether budget tracking is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Request budget instance for tracking allocations during a single request
 */
export class RequestBudget {
  private allocations: Map<string, BudgetAllocation> = new Map();
  private usage: Map<string, number> = new Map();
  private calibration: Map<string, CalibrationData> = new Map();
  private totalBudget: number;
  private enabled: boolean;

  constructor(
    allocations: BudgetAllocation[],
    totalBudget: number,
    enabled: boolean = true
  ) {
    this.totalBudget = totalBudget;
    this.enabled = enabled;

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
   * Record actual token usage for a component
   */
  recordUsage(
    componentId: string,
    tokens: number,
    options?: UsageOptions
  ): void {
    this.usage.set(componentId, tokens);

    if (options?.estimatedTokens !== undefined) {
      this.calibration.set(componentId, {
        estimatedTokens: options.estimatedTokens,
        actualTokens: tokens,
        accuracy: tokens > 0 ? options.estimatedTokens / tokens : 1,
      });
    }
  }

  /**
   * Get status for a specific component
   */
  getComponentStatus(componentId: string): ComponentStatus {
    const allocation = this.allocations.get(componentId);
    const used = this.usage.get(componentId) || 0;

    if (!allocation) {
      return {
        componentId,
        priority: ComponentPriority.LOW,
        allocated: 0,
        used,
        remaining: 0,
        overBudget: used > 0,
        overage: used,
      };
    }

    const allocated = allocation.target;
    const remaining = Math.max(0, allocated - used);
    const overBudget = used > allocated;
    const overage = overBudget ? used - allocated : 0;

    return {
      componentId,
      priority: allocation.priority,
      allocated,
      used,
      remaining,
      overBudget,
      overage,
    };
  }

  /**
   * Get degradation plan when budget is exceeded
   */
  getDegradationPlan(): DegradationResult {
    const suggestions: DegradationSuggestion[] = [];
    let totalOverage = 0;

    // Sort components by priority (LOW first for degradation)
    const componentIds = Array.from(this.allocations.keys());
    const sortedIds = componentIds.sort((a, b) => {
      const allocA = this.allocations.get(a)!;
      const allocB = this.allocations.get(b)!;
      // Reverse sort - LOW priority first
      return allocB.priority - allocA.priority;
    });

    for (const componentId of sortedIds) {
      const status = this.getComponentStatus(componentId);
      if (status.overBudget) {
        totalOverage += status.overage;

        const allocation = this.allocations.get(componentId)!;
        suggestions.push({
          componentId,
          priority: allocation.priority,
          currentUsage: status.used,
          suggestedLimit: allocation.target,
          reduction: status.overage,
        });
      }
    }

    return {
      suggestions,
      totalOverage,
      canRecover: suggestions.every(
        (s) => s.priority !== ComponentPriority.CRITICAL
      ),
    };
  }

  /**
   * Get overall budget summary
   */
  getSummary(): BudgetSummary {
    let totalAllocated = 0;
    let totalUsed = 0;
    let componentsOverBudget = 0;

    for (const [componentId] of this.allocations) {
      const status = this.getComponentStatus(componentId);
      totalAllocated += status.allocated;
      totalUsed += status.used;
      if (status.overBudget) {
        componentsOverBudget++;
      }
    }

    return {
      totalBudget: this.totalBudget,
      totalAllocated,
      totalUsed,
      componentsOverBudget,
      budgetUtilization: this.totalBudget > 0 ? totalUsed / this.totalBudget : 0,
    };
  }

  /**
   * Get calibration data for a component
   */
  getCalibrationData(componentId: string): CalibrationData {
    const data = this.calibration.get(componentId);
    if (!data) {
      return {
        estimatedTokens: 0,
        actualTokens: 0,
        accuracy: 1,
      };
    }
    return data;
  }
}

/**
 * Token Budget Manager
 *
 * Centralized manager for creating and tracking token budgets across
 * prompt generation. Supports feature flag for safe rollback.
 */
export class TokenBudgetManager {
  private enabled: boolean;

  constructor(options?: TokenBudgetManagerOptions) {
    this.enabled = options?.enabled ?? true;
  }

  /**
   * Create a new request budget with the given allocations
   */
  createBudget(
    allocations: BudgetAllocation[],
    totalBudget: number
  ): RequestBudget {
    return new RequestBudget(allocations, totalBudget, this.enabled);
  }

  /**
   * Check if budget tracking is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Default component allocations for narrative generation
 * Based on analysis from issue #408
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
];

/**
 * Default total budget (conservative ~8% of 1M context window)
 */
export const DEFAULT_TOTAL_BUDGET = 80000;
