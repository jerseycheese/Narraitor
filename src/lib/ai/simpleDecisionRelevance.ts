/**
 * Simple Decision Relevance - Minimal Decision Filtering
 *
 * Replaces the overengineered 442-line DecisionRelevanceCalculator with
 * a simple approach: filter by world, sort by recency, take top N.
 *
 * The AI is smart enough to figure out contextual relevance from a
 * chronological list of recent decisions.
 */

import type { PlayerDecision } from '@/types/personalization.types';
import type { EntityID } from '@/types/common.types';

export const DECISION_CONTEXT_LIMIT = 10;

/**
 * Minimal context needed for filtering decisions
 */
export interface SimpleNarrativeContext {
  worldId: EntityID;
  sessionId?: EntityID;
}

/**
 * Gets most relevant decisions using simple recency-based filtering
 *
 * @param decisions - All available decisions
 * @param context - Current narrative context (worldId, optional sessionId)
 * @param limit - Maximum number of decisions to return (default: 10)
 * @returns Most recent decisions filtered by context
 */
export function getMostRelevantDecisions(
  decisions: PlayerDecision[],
  context: SimpleNarrativeContext,
  limit: number = 10
): PlayerDecision[] {
  return decisions
    .filter(d => d.worldId === context.worldId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
