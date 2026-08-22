// src/types/continuity.types.ts

import type { EntityID } from './common.types';

/**
 * Types for the runtime continuity guardrail: deterministic
 * contradiction detection over generated narrative, with a single corrective
 * AI call when an issue is found.
 */

type ContinuityIssueType = 'relationship-tone' | 'reversed-fact' | 'stale-promise';

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
 * A factual answer the story already gave. The first answer per topic and
 * speaker is canon; later ones on the same topic are what drift looks like.
 */
export interface ContinuityAssertion {
  topic: string;
  speaker: string;
  claim: string;
  /** How many ledger facts share this topic; repeated questions rank first. */
  mentions: number;
}

/**
 * A promise made in the story, and whether it has since been kept. Delivered
 * commitments are the ones the engine must not promise again.
 */
export interface ContinuityCommitment {
  topic: string;
  by: string;
  statement: string;
  status: 'promised' | 'delivered';
  /**
   * Words a sentence can use to refer to this commitment — the topic's own
   * significant terms plus those of a matching inventory item. Detection only;
   * these never reach the prompt.
   */
  terms: string[];
}

/** A lasting change the player made to the scene, still true until undone on-page. */
export interface ContinuitySceneChange {
  statement: string;
}

/**
 * Compact, deterministic snapshot of the constraints a new segment must honor.
 */
export interface ContinuityContract {
  npcs: ContinuityNpcExpectation[];
  canonFacts: ContinuityCanonFact[];
  recentDecisions: ContinuityRecentDecision[];
  assertions: ContinuityAssertion[];
  commitments: ContinuityCommitment[];
  sceneChanges: ContinuitySceneChange[];
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
