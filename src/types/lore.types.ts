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
 * Lore fact entry with rich structured data
 */
export interface LoreFact extends TimestampedEntity {
  id: EntityID;
  category: LoreCategory;
  key: string;      // Descriptive key for human reference (e.g., "world-123:character_lady_seraphina")
  value: string;    // The fact content (canonical name)
  source: LoreSource;
  sessionId?: EntityID; // Which game session this fact came from
  worldId: EntityID;
  // Rich metadata from AI extraction
  metadata?: {
    description?: string;
    importance?: 'low' | 'medium' | 'high';
    type?: string; // character role, location type, event type, etc.
    tags?: string[];
    relatedEntities?: string[];
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
}

/**
 * Structured lore extraction from AI
 */
export interface StructuredLoreExtraction {
  characters: Array<{
    name: string;
    description?: string;
    role?: string;
    importance?: 'low' | 'medium' | 'high';
    tags?: string[];
  }>;
  locations: Array<{
    name: string;
    type?: string; // city, tavern, forest, etc.
    description?: string;
    importance?: 'low' | 'medium' | 'high';
    tags?: string[];
  }>;
  events: Array<{
    description: string;
    significance?: string;
    importance?: 'low' | 'medium' | 'high';
    relatedEntities?: string[];
  }>;
  rules: Array<{
    rule: string;
    context?: string;
    importance?: 'low' | 'medium' | 'high';
    tags?: string[];
  }>;
  relationships?: Array<{
    from: string;
    to: string;
    type: string; // ally, enemy, mentor, etc.
    description?: string;
  }>;
}
