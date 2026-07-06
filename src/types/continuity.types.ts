// src/types/continuity.types.ts

import type { EntityID } from './common.types';

/**
 * Types for the runtime continuity guardrail (#409/#412): deterministic
 * contradiction detection over generated narrative, with a single corrective
 * AI call when an issue is found.
 */

type ContinuityIssueType = 'relationship-tone' | 'reversed-fact';

export type ContinuityStatus = 'clean' | 'corrected' | 'flagged';

export type ContinuityTone = 'hostile' | 'guarded' | 'neutral' | 'warm';

/**
 * Tone expectation for an NPC, derived from worldStore.npcRelationships and
 * joined to display names/aliases via npcStore and lore character facts.
 */
export interface ContinuityNpcExpectation {
  npcId: EntityID;
  name: string;
  aliases: string[];
  trust: number;
  sentiment: number;
  expectedTone: ContinuityTone;
}

/**
 * A lore fact whose status makes certain narrative assertions contradictory
 * (e.g. a dead character appearing alive).
 */
export interface ContinuityCanonFact {
  entity: string;
  aliases: string[];
  status: 'dead' | 'destroyed';
  statement: string;
}

export interface ContinuityRecentDecision {
  text: string;
  outcome?: string;
}

/**
 * Compact, deterministic snapshot of the constraints a new segment must honor.
 */
export interface ContinuityContract {
  npcs: ContinuityNpcExpectation[];
  canonFacts: ContinuityCanonFact[];
  recentDecisions: ContinuityRecentDecision[];
}

export interface ContinuityIssue {
  type: ContinuityIssueType;
  entity: string;
  /** Offending sentence (trimmed). */
  excerpt: string;
  /** Human-readable constraint that was violated. */
  expectation: string;
}

/** Compact note persisted on the segment (NarrativeMetadata.continuity). */
export interface ContinuitySegmentNote {
  status: ContinuityStatus;
  issues?: Array<{ type: ContinuityIssueType; entity: string }>;
}

/** Full record for the DevTools feed (continuityStore). */
export interface ContinuityValidationResult {
  id: string;
  worldId: EntityID;
  sessionId?: EntityID;
  status: ContinuityStatus;
  issues: ContinuityIssue[];
  /** Issues still present after the correction attempt (status === 'flagged'). */
  remainingIssues?: ContinuityIssue[];
  detectionMs: number;
  correctionMs?: number;
  timestamp: string;
}
