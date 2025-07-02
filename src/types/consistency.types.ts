/**
 * Type definitions for AI Narrative Consistency Validation
 * Issue #184: AI consistency for enhanced player experience
 */

import type { EntityID } from './common.types';
import type { LoreFact, LoreCategory } from './lore.types';

/**
 * Type of consistency contradiction detected
 */
export type ContradictionType = 'character' | 'location' | 'rule' | 'event';

/**
 * Individual consistency contradiction detected in narrative
 */
export interface ConsistencyContradiction {
  type: ContradictionType;
  description: string;
  conflictingElements: string[];
  establishedLore: string[];
  severity: 'low' | 'medium' | 'high';
}

/**
 * Options for consistency validation
 */
export interface ConsistencyValidationOptions {
  includeWarnings?: boolean;
  maxFacts?: number;
  severityThreshold?: 'low' | 'medium' | 'high';
}

/**
 * Result of narrative consistency validation
 */
export interface ConsistencyValidationResult {
  isConsistent: boolean;
  consistencyScore: number; // 0-1, where 1 is fully consistent
  contradictions: ConsistencyContradiction[];
  warnings: string[];
  loreCoverage: number; // 0-1, how much of established lore was referenced
  referencedLore: string[];
}

/**
 * Formatted lore context for consistency checking
 */
export interface FormattedLoreContext {
  prioritizedFacts: LoreFact[];
  keywordMap: Map<string, string[]>;
  formattedContext: string;
  totalFacts: number;
}

/**
 * Options for formatting lore context
 */
export interface LoreFormattingOptions {
  maxFacts?: number;
  priorityFilter?: Array<'low' | 'medium' | 'high'>;
  categoryFilter?: LoreCategory[];
}

/**
 * Enhanced metadata for narrative generation with consistency validation
 */
export interface ConsistencyAwareMetadata {
  consistencyValidation?: ConsistencyValidationResult;
  loreContextUsed?: string[];
  validationTimestamp?: string;
}