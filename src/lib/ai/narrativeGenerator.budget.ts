import {
  RequestBudget,
  DEFAULT_COMPONENT_BUDGETS,
  DEFAULT_TOTAL_BUDGET,
  REQUEST_TOTAL_COMPONENT_ID,
} from '@/lib/promptContext/tokenBudgetManager';
import {
  estimateTokenCount,
  truncateToTokenLimit,
} from '@/lib/promptContext/tokenUtils';
import type { NarrativeContext, NarrativeSegment } from '@/types/narrative.types';
import { safeTrim } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { useCalibrationStore } from '@/state/calibrationStore';

/** Fraction of a component's allocation above which we log an approaching-limit notice. */
const APPROACHING_LIMIT_RATIO = 0.9;

export const createRequestBudget = (): RequestBudget => {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_TOKEN_BUDGET_MANAGER === 'true';
  return new RequestBudget(DEFAULT_COMPONENT_BUDGETS, DEFAULT_TOTAL_BUDGET, enabled);
};

export const applyBudget = (
  content: string,
  componentId: string,
  budget?: RequestBudget
): string => {
  if (!budget) {
    return content;
  }

  const estimatedTokens = estimateTokenCount(content);

  // Measurement is decoupled from enforcement: when the budget is disabled we
  // still record the estimate for observability, but never truncate or log.
  if (!budget.isEnabled()) {
    budget.recordUsage(componentId, estimatedTokens);
    return content;
  }

  const limit = budget.getAllocation(componentId);

  if (!Number.isFinite(limit) || limit <= 0) {
    if (estimatedTokens > 0) {
      logger.warn('Component exceeded token budget', {
        componentId,
        estimated: estimatedTokens,
        limit: Number.isFinite(limit) ? limit : 0,
        overage: estimatedTokens,
        truncated: true,
      });
    }
    budget.recordUsage(componentId, 0);
    return '';
  }

  if (estimatedTokens <= limit) {
    if (estimatedTokens > limit * APPROACHING_LIMIT_RATIO) {
      logger.info('Component approaching token budget', {
        componentId,
        estimated: estimatedTokens,
        limit,
        utilization: estimatedTokens / limit,
      });
    }
    budget.recordUsage(componentId, estimatedTokens);
    return content;
  }

  logger.warn('Component exceeded token budget', {
    componentId,
    estimated: estimatedTokens,
    limit,
    overage: estimatedTokens - limit,
    truncated: true,
  });

  const limited = truncateToTokenLimit(content, limit);
  budget.recordUsage(componentId, estimateTokenCount(limited));
  return limited;
};

export const limitNarrativeContextToBudget = (
  narrativeContext: NarrativeContext | undefined,
  budget: RequestBudget
): NarrativeContext | undefined => {
  if (!narrativeContext) {
    return narrativeContext;
  }

  // Measurement only when enforcement is disabled: record the recent-narrative
  // estimate for observability without dropping any segments.
  if (!budget.isEnabled()) {
    const recentSegments = narrativeContext.recentSegments ?? [];
    const totalTokens = recentSegments.reduce(
      (sum, segment) => sum + estimateTokenCount(segment.content),
      0
    );
    budget.recordUsage('recent-narrative', totalTokens);
    return narrativeContext;
  }

  const limit = budget.getAllocation('recent-narrative');
  if (!Number.isFinite(limit) || limit <= 0) {
    return { ...narrativeContext, recentSegments: [] };
  }

  const recentSegments = narrativeContext.recentSegments ?? [];
  if (recentSegments.length === 0) {
    return narrativeContext;
  }

  const selected: NarrativeSegment[] = [];
  let totalTokens = 0;
  let didTruncate = false;

  for (let i = recentSegments.length - 1; i >= 0; i--) {
    const segment = recentSegments[i];
    const segmentTokens = estimateTokenCount(segment.content);

    if (selected.length === 0 && segmentTokens > limit) {
      const truncated = truncateToTokenLimit(segment.content, limit);
      selected.unshift({ ...segment, content: truncated });
      totalTokens = estimateTokenCount(truncated);
      didTruncate = true;
      break;
    }

    if (totalTokens + segmentTokens > limit) {
      const remaining = limit - totalTokens;
      if (selected.length > 0 && remaining > 0) {
        const truncated = truncateToTokenLimit(segment.content, remaining);
        if (safeTrim(truncated)) {
          selected.unshift({ ...segment, content: truncated });
          totalTokens += estimateTokenCount(truncated);
        }
      }
      didTruncate = true;
      break;
    }

    selected.unshift(segment);
    totalTokens += segmentTokens;
  }

  if (didTruncate) {
    logger.warn('Recent narrative truncated to token budget', {
      componentId: 'recent-narrative',
      limit,
      totalTokens,
      includedSegments: selected.length,
      droppedSegments: recentSegments.length - selected.length,
      truncated: true,
    });
  }

  budget.recordUsage('recent-narrative', totalTokens);
  return { ...narrativeContext, recentSegments: selected };
};

/**
 * Record request-level calibration and publish a snapshot for the DevTools
 * panel. Reconciles the whole-prompt heuristic estimate against the provider's
 * actual prompt-token count (per-component actuals aren't available from the
 * Gemini API). Runs regardless of enforcement — observability is decoupled from
 * truncation.
 */
export const recordRequestCalibration = (
  budget: RequestBudget,
  fullPrompt: string,
  response: { promptTokens?: number } | undefined
): void => {
  const actualTokens =
    typeof response?.promptTokens === 'number' ? response.promptTokens : undefined;

  budget.recordUsage(
    REQUEST_TOTAL_COMPONENT_ID,
    estimateTokenCount(fullPrompt),
    actualTokens !== undefined ? { actualTokens } : undefined
  );

  publishBudgetSnapshot(budget);
};

/**
 * Push a budget snapshot into the calibration store for the DevTools panel.
 * Browser + non-production only; failures are swallowed so that observability
 * never interferes with narrative generation.
 */
const publishBudgetSnapshot = (budget: RequestBudget): void => {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
    return;
  }

  try {
    useCalibrationStore.getState().recordSnapshot(budget.getSnapshot());
  } catch {
    // Intentionally ignored — observability must never break generation.
  }
};
