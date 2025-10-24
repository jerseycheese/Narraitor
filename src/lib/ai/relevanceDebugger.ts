/**
 * Relevance Debugger Utilities
 *
 * Helper functions for building narrative contexts used by the decision relevance debugger.
 * These utilities reconstruct the context that the relevance calculator uses, which helps
 * developers understand why certain decisions are scoring high or low.
 */

import type { CurrentNarrativeContext } from '@/types/relevance.types';
import type { NarrativeSegment } from '@/types/narrative.types';
import type { PlayerDecision } from '@/types/personalization.types';
import { getTimestamp } from '@/lib/utils';

export interface ContextParams {
  sessionId: string;
  worldId: string;
  segments: NarrativeSegment[];
  decisions: PlayerDecision[];
}

/**
 * Builds a CurrentNarrativeContext from narrative segments and decisions
 *
 * This reconstructs the narrative context that the relevance calculator uses,
 * which is helpful for debugging why certain decisions are scoring high or low.
 * It extracts location, characters, situation, events, and tags from the most
 * recent segments and decisions.
 *
 * @param params - Session data including segments and decisions
 * @returns Structured narrative context for relevance scoring
 *
 * @example
 * ```typescript
 * import { buildRelevanceContext } from '@/lib/ai/relevanceDebugger';
 *
 * const context = buildRelevanceContext({
 *   sessionId: 'session-123',
 *   worldId: 'world-456',
 *   segments: narrativeSegments,
 *   decisions: playerDecisions
 * });
 *
 * // Use with DecisionRelevanceCalculator
 * const calculator = new DecisionRelevanceCalculator();
 * const analysis = calculator.analyzeDecisionRelevance(decisions, context);
 * ```
 */
export function buildRelevanceContext({
  sessionId,
  worldId,
  segments,
  decisions,
}: ContextParams): CurrentNarrativeContext {
  const sortedDecisions = [...decisions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const latestDecision = sortedDecisions[0];

  // Extract location from most recent segment or latest decision
  let location: string | undefined;
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    const segment = segments[i];
    if (segment?.metadata?.location) {
      location = segment.metadata.location;
      break;
    }
  }
  if (!location && latestDecision?.context?.location) {
    location = latestDecision.context.location;
  }

  // Collect all characters from segments, fallback to decisions
  const characterSet = new Set<string>();
  segments.forEach((segment) => {
    segment.characterIds?.forEach((id) => characterSet.add(id));
    segment.metadata?.characterIds?.forEach((id) => characterSet.add(id));
  });
  if (characterSet.size === 0) {
    sortedDecisions.forEach((decision) => {
      decision.context.charactersPresent?.forEach((char) => characterSet.add(char));
    });
  }

  // Extract situation from most recent decision that has one
  const situation =
    sortedDecisions.find((decision) => Boolean(decision.context.situation))?.context.situation;

  // Get last 5 narrative events as snippets
  const recentEvents = segments
    .slice(-5)
    .map((segment) => segment.content?.substring(0, 120))
    .filter(Boolean);

  // Collect tags from segments, fallback to decision choice types and keywords
  const tagSet = new Set<string>();
  segments.forEach((segment) => {
    segment.metadata?.tags?.forEach((tag) => {
      if (tag) tagSet.add(tag);
    });
  });
  if (tagSet.size === 0) {
    sortedDecisions.forEach((decision) => {
      if (decision.choiceType) tagSet.add(decision.choiceType);
      decision.context.situation
        ?.split(/\s+/)
        .filter((word) => word.length > 4)
        .forEach((word) => tagSet.add(word.toLowerCase()));
    });
  }

  // Determine context timestamp from latest segment or decision
  const contextTimestamp = (() => {
    const latestSegment = segments[segments.length - 1];
    if (latestSegment?.timestamp instanceof Date) {
      return latestSegment.timestamp.toISOString();
    }
    if (latestSegment?.timestamp && typeof latestSegment.timestamp === 'string') {
      return new Date(latestSegment.timestamp).toISOString();
    }
    if (latestDecision?.timestamp) {
      return new Date(latestDecision.timestamp).toISOString();
    }
    return getTimestamp();
  })();

  return {
    location,
    charactersPresent: Array.from(characterSet).slice(0, 10),
    situation,
    recentEvents,
    activeTags: Array.from(tagSet).slice(0, 15),
    worldId,
    sessionId,
    timestamp: contextTimestamp,
  };
}
