/**
 * Lore Management Type Definitions
 * Issue #434: Basic lore consistency tracking
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
 * Simple lore fact entry
 */
export interface LoreFact extends TimestampedEntity {
  id: EntityID;
  category: LoreCategory;
  key: string;      // Simple key for the fact (e.g., "hero_name", "tavern_location")
  value: string;    // The fact content
  source: LoreSource;
  sessionId?: EntityID; // Which game session this fact came from
  worldId: EntityID;
}

/**
 * Simple search options for finding facts
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
  facts: string[]; // Simple array of fact strings for prompt inclusion
  factCount: number;
}