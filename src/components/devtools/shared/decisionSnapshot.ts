/**
 * Read-only snapshot of decision and prompt-debug state for the DevTools
 * decision inspectors (#212/#213). Reads the playerDecisionTracker singleton
 * and the narrative store via getState() — a deliberate point-in-time snapshot
 * (refreshed on demand), never a live subscription, and never a mutation.
 */

import { playerDecisionTracker } from '@/lib/ai/playerDecisionTracker';
import { useNarrativeStore } from '@/state/narrativeStore';
import type { PlayerDecision, ChoiceTypePreference } from '@/types/personalization.types';
import type { Decision, NarrativeSegment } from '@/types/narrative.types';
import type { EntityID } from '@/types/common.types';

interface DecisionPatternSummary {
  dominantChoiceTypes: ChoiceTypePreference[];
  choiceDistribution: Record<ChoiceTypePreference, number>;
  patternStrength: number;
}

export interface DecisionInspectorSnapshot {
  /** Tracker records, newest first (the tracker unshifts on record). */
  trackerDecisions: PlayerDecision[];
  /** Choice-pattern analysis over the tracker records. */
  patterns: DecisionPatternSummary;
  /** Structured decisions from the narrative store, by ID. */
  storeDecisions: Record<EntityID, Decision>;
  /** Decision IDs grouped by session, in creation order. */
  sessionDecisions: Record<EntityID, EntityID[]>;
  /** Narrative segments by ID (carry causedByDecisionId + prompt debugInfo). */
  segments: Record<EntityID, NarrativeSegment>;
}

export function buildDecisionSnapshot(): DecisionInspectorSnapshot {
  const narrativeState = useNarrativeStore.getState();
  const trackerDecisions = playerDecisionTracker.getAllDecisions();

  return {
    trackerDecisions,
    patterns: playerDecisionTracker.analyzeChoicePatterns(trackerDecisions),
    storeDecisions: narrativeState.decisions,
    sessionDecisions: narrativeState.sessionDecisions,
    segments: narrativeState.segments,
  };
}

/**
 * Mirrors the tracker's sanitizeString so store-side text can be matched
 * against the sanitized copies the tracker persists.
 */
export function normalizeForTrackerMatch(text: string, maxLength: number = 500): string {
  return text
    .replace(/[<>'"&]/g, '')
    .substring(0, maxLength)
    .trim();
}
