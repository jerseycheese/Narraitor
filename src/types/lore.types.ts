/**
 * Lore Management Type Definitions
 * Basic lore consistency tracking
 */

import type { EntityID, TimestampedEntity } from './common.types';

/**
 * Basic categories for organizing lore facts
 */
export type LoreCategory = 'characters' | 'locations' | 'events' | 'rules';

/**
 * Source types for tracking where facts originated
 */
export type LoreSource = 'narrative' | 'manual';

/**
 * Where lore context was used
 */
export type LoreUsageSource = 'narrative' | 'choices' | 'lore-extraction' | 'unknown';

/**
 * What kind of usage event was recorded
 */
type LoreUsageEventType = 'context' | 'mention';

/**
 * Lore usage event entry
 */
export interface LoreUsageEvent {
  id: EntityID;
  worldId: EntityID;
  sessionId?: EntityID;
  source: LoreUsageSource;
  eventType: LoreUsageEventType;
  factIds: EntityID[];
  timestamp: string;
  responseExcerpt?: string;
}

/**
 * Aggregate usage stats for a lore fact
 */
export interface LoreUsageStats {
  usageCount: number;
  mentionCount: number;
  lastUsedAt?: string;
  lastMentionedAt?: string;
  lastSource?: LoreUsageSource;
  lastSessionId?: EntityID;
}

/**
 * What an event fact means for continuity: a factual answer the story gave,
 * a promise made or kept, or a lasting change the player made to the scene.
 * The continuity guardrail builds its contract from these; untagged events are
 * ordinary lore.
 */
export type LoreContinuityKind = 'assertion' | 'commitment' | 'scene-change';

export type LoreContinuityFulfillment =
  | { kind: 'durable' }
  | { kind: 'possession'; itemId: EntityID };

export interface LoreContinuityAnnotation {
  kind: LoreContinuityKind;
  /** Short stable label for the question/promise/object so repeats line up across turns. */
  topic?: string;
  /** Who made the assertion or promise ("narration" when unattributed). */
  speaker?: string;
  /** Commitments only. */
  status?: 'promised' | 'delivered';
  /** Fulfillment classification for delivered commitments. Missing means legacy or unclassified. */
  fulfillment?: LoreContinuityFulfillment;
}

/**
 * Lore fact entry with rich structured data
 */
export interface LoreFact extends TimestampedEntity {
  id: EntityID;
  category: LoreCategory;
  key: string;      // Descriptive key for human reference (e.g., "world-123:character_lady_seraphina")
  value: string;    // The fact content (canonical name)
  aliases: string[]; // Alternative names/references for this entity
  source: LoreSource;
  sessionId?: EntityID; // Which game session this fact came from
  worldId: EntityID;
  visibility: 'session-private' | 'world-shared'; // Session-private or shared across all sessions
  // Rich metadata from AI extraction
  metadata?: {
    description?: string;
    importance?: 'low' | 'medium' | 'high';
    type?: string; // character role, location type, event type, etc.
    tags?: string[];
    relatedEntities?: string[];
    continuity?: LoreContinuityAnnotation;
  };
}

/**
 * Search options for finding facts
 */
export interface LoreSearchOptions {
  category?: LoreCategory;
  worldId?: EntityID;
  sessionId?: EntityID;
}

/**
 * Lore context for AI prompt inclusion
 */
export interface LoreContext {
  facts: string[]; // Array of fact strings for prompt inclusion
  factCount: number;
  factIds?: EntityID[];
}

/**
 * Structured lore extraction from AI
 */
export interface StructuredLoreExtraction {
  characters: Array<{
    name: string;
    aliases?: string[]; // Alternative names this character is known by
    description?: string;
    role?: string;
    importance?: 'low' | 'medium' | 'high';
    visibility?: 'session-private' | 'world-shared';
    tags?: string[];
  }>;
  locations: Array<{
    name: string;
    aliases?: string[]; // Alternative names for this location
    type?: string; // city, tavern, forest, etc.
    description?: string;
    importance?: 'low' | 'medium' | 'high';
    visibility?: 'session-private' | 'world-shared';
    tags?: string[];
  }>;
  events: Array<{
    description: string;
    significance?: string;
    importance?: 'low' | 'medium' | 'high';
    visibility?: 'session-private' | 'world-shared';
    relatedEntities?: string[];
    continuity?: LoreContinuityAnnotation;
  }>;
  rules: Array<{
    rule: string;
    context?: string;
    importance?: 'low' | 'medium' | 'high';
    visibility?: 'session-private' | 'world-shared';
    tags?: string[];
  }>;
  relationships?: Array<{
    from: string;
    to: string;
    type: string; // ally, enemy, mentor, etc.
    description?: string;
  }>;
}

/**
 * Structured lore context for AI consistency instructions
 */
export interface ConsistencyLoreContext {
  characters: Array<{
    name: string;
    traits: string[];
    background: string;
    importance?: 'high' | 'medium' | 'low';
  }>;
  locations: Array<{
    name: string;
    type: string;
    description: string;
    importance?: 'high' | 'medium' | 'low';
  }>;
  worldRules: Array<{
    rule: string;
    description: string;
    importance?: 'high' | 'medium' | 'low';
  }>;
  historicalEvents: Array<{
    event: string;
    description: string;
    importance?: 'high' | 'medium' | 'low';
  }>;
}

/**
 * Match between two potentially duplicate facts
 */
export interface DuplicateMatch {
  fact1: LoreFact;
  fact2: LoreFact;
  confidence: number; // 0.0 to 1.0
  method: 'exact' | 'levenshtein' | 'ai' | 'alias';
  rationale?: string;
}

/**
 * Match record for entity resolution review
 */
export interface EntityMatch {
  id: EntityID;
  worldId: EntityID;
  fact1Id: EntityID;
  fact2Id: EntityID;
  confidence: number; // 0.0 to 1.0
  method: 'exact' | 'levenshtein' | 'ai' | 'alias';
  rationale?: string;
  crossCategory?: boolean;
  status: 'pending' | 'merged' | 'ignored';
  createdAt: string;
}

/**
 * Result of resolving an entity name against existing facts
 */
export interface EntityResolutionResult {
  entity: LoreFact;
  isNew: boolean;
  confidence: number;
  matchedBy?: 'exact' | 'levenshtein' | 'ai' | 'alias';
  matchId?: EntityID;
}

/**
 * Audit entry for merges
 */
export interface LoreMergeAuditEntry {
  id: EntityID;
  worldId: EntityID;
  primaryId: EntityID;
  secondaryId: EntityID;
  primaryName: string;
  secondaryName: string;
  primaryCategory: LoreCategory;
  secondaryCategory: LoreCategory;
  timestamp: string;
  referencesUpdated: number;
  aliasesAdded: string[];
  crossCategory?: boolean;
}
