/**
 * Lore Management System Type Definitions
 */

import type { EntityID, TimestampedEntity } from './common.types';

/**
 * Categories for organizing lore facts
 */
export type LoreCategory = 'characters' | 'locations' | 'events' | 'rules' | 'items' | 'organizations';

/**
 * Source types for tracking where facts originated
 */
export type LoreSource = 'narrative' | 'manual' | 'ai_generated' | 'imported';

/**
 * Individual lore fact entry
 */
export interface LoreFact extends TimestampedEntity {
  id: EntityID;
  category: LoreCategory;
  title: string;
  content: string;
  source: LoreSource;
  sourceReference?: string; // Reference to the narrative segment, user input, etc.
  tags: string[];
  isCanonical: boolean; // Whether this fact is confirmed/official
  relatedFacts: EntityID[]; // Links to other related facts
  worldId: EntityID; // Which world this fact belongs to
}

/**
 * Lore consistency validation result
 */
export interface LoreConsistencyCheck {
  isConsistent: boolean;
  conflictingFacts: EntityID[];
  suggestions: string[];
}

/**
 * Lore search/filter options
 */
export interface LoreSearchOptions {
  category?: LoreCategory;
  tags?: string[];
  source?: LoreSource;
  searchTerm?: string;
  worldId?: EntityID;
  isCanonical?: boolean;
}

/**
 * Lore extraction result from narrative text
 */
export interface LoreExtractionResult {
  extractedFacts: Omit<LoreFact, 'id' | 'createdAt' | 'updatedAt'>[];
  confidence: number; // 0-1 confidence score
  sourceText: string;
}

/**
 * Lore context for AI prompt inclusion
 */
export interface LoreContext {
  relevantFacts: LoreFact[];
  contextSummary: string;
  factCount: number;
}