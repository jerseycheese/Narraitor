import {
  RequestBudget,
  DEFAULT_ALLOCATIONS,
  DEFAULT_TOTAL_BUDGET,
} from '@/lib/promptContext/tokenBudgetManager';
import {
  estimateTokenCount,
  truncateToTokenLimit,
} from '@/lib/promptContext/tokenUtils';
import type { NarrativeContext, NarrativeSegment } from '@/types/narrative.types';
import { safeTrim } from '@/lib/utils';

export const createRequestBudget = (): RequestBudget => {
  const enabled = process.env.ENABLE_TOKEN_BUDGET_MANAGER === 'true';
  return new RequestBudget(DEFAULT_ALLOCATIONS, DEFAULT_TOTAL_BUDGET, enabled);
};

export const applyBudget = (
  content: string,
  componentId: string,
  budget?: RequestBudget
): string => {
  if (!budget || !budget.isEnabled()) {
    return content;
  }

  const estimatedTokens = estimateTokenCount(content);
  const limit = budget.getAllocation(componentId);

  if (!Number.isFinite(limit) || limit <= 0) {
    budget.recordUsage(componentId, 0);
    return '';
  }

  if (estimatedTokens <= limit) {
    budget.recordUsage(componentId, estimatedTokens);
    return content;
  }

  const limited = truncateToTokenLimit(content, limit);
  budget.recordUsage(componentId, estimateTokenCount(limited));
  return limited;
};

export const limitNarrativeContextToBudget = (
  narrativeContext: NarrativeContext | undefined,
  budget: RequestBudget
): NarrativeContext | undefined => {
  if (!narrativeContext || !budget.isEnabled()) {
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

  for (let i = recentSegments.length - 1; i >= 0; i--) {
    const segment = recentSegments[i];
    const segmentTokens = estimateTokenCount(segment.content);

    if (selected.length === 0 && segmentTokens > limit) {
      const truncated = truncateToTokenLimit(segment.content, limit);
      selected.unshift({ ...segment, content: truncated });
      totalTokens = estimateTokenCount(truncated);
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
      break;
    }

    selected.unshift(segment);
    totalTokens += segmentTokens;
  }

  budget.recordUsage('recent-narrative', totalTokens);
  return { ...narrativeContext, recentSegments: selected };
};
