/**
 * Lore Management Type Definitions
 * Basic lore consistency tracking and validation
 */

import type { EntityID, TimestampedEntity } from './common.types';
import { z } from 'zod';

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
 * Lore Validation Types
 * Lore validation layer for AI-generated content
 */

/**
 * Contradiction severity levels
 */
export type ContradictionSeverity = 'minor' | 'moderate' | 'major' | 'breaking';

/**
 * Validation confidence levels
 */
export type ValidationConfidence = 'low' | 'medium' | 'high';

/**
 * Overall validation severity
 */
export type ValidationSeverity = 'none' | 'minor' | 'moderate' | 'major' | 'breaking';

/**
 * Contradiction category
 */
export type ContradictionCategory = 'character' | 'world-rule' | 'historical-event' | 'location';

/**
 * Context for lore validation request
 */
export interface LoreValidationContext {
  characters: Array<{
    id: EntityID;
    name: string;
    background: string;
    personality: string;
    physicalDescription?: string;
  }>;
  worldRules: Array<{
    rule: string;
    description: string;
    importance: 'low' | 'medium' | 'high';
  }>;
  historicalEvents: Array<{
    description: string;
    timestamp: string;
    characterIds: EntityID[];
  }>;
  locations: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  recentNarrative?: string;
}

/**
 * Lore validation request
 */
export interface LoreValidationRequest {
  content: string;
  worldId: EntityID;
  characterIds: EntityID[];
  sessionId?: EntityID;
  context: LoreValidationContext;
}

/**
 * Individual contradiction flag
 * Compact format - excerpts truncated to 100 chars max
 */
export interface ContradictionFlag {
  category: ContradictionCategory;
  severity: ContradictionSeverity;
  description: string;
  conflictingLore: string;
  narrativeExcerpt: string;
}

/**
 * Lore validation result
 */
export interface LoreValidationResult {
  isConsistent: boolean;
  contradictions: ContradictionFlag[];
  severity: ValidationSeverity;
  confidence: ValidationConfidence;
  processingTime: number;
  validated: boolean; // false if validation skipped/failed
}

/**
 * Zod schema for contradiction flag validation
 */
export const ContradictionFlagSchema = z.object({
  category: z.enum(['character', 'world-rule', 'historical-event', 'location']),
  severity: z.enum(['minor', 'moderate', 'major', 'breaking']),
  description: z.string(),
  conflictingLore: z.string(),
  narrativeExcerpt: z.string(),
});

/**
 * Zod schema for validation result
 */
export const LoreValidationResultSchema = z.object({
  isConsistent: z.boolean(),
  contradictions: z.array(ContradictionFlagSchema),
  severity: z.enum(['none', 'minor', 'moderate', 'major', 'breaking']),
  confidence: z.enum(['low', 'medium', 'high']),
});
