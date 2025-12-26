/**
 * Deduplication functions for the lore store
 * Handles scanning for duplicates and merging facts
 */

import type { EntityID } from '../types/common.types';
import type { LoreFact, LoreCategory, DuplicateMatch } from '../types/lore.types';
import { findPotentialDuplicates, checkFactSimilarity } from '../lib/lore/fuzzyMatcher';
import { logger } from '@/lib/utils/logger';
import { getTimestamp } from '@/lib/utils';
import type { UserFriendlyError } from '@/lib/utils/errorUtils';
import { ErrorType } from '@/lib/utils/errorUtils';

/**
 * Context interface for deduplication operations
 * Follows the same pattern as other modular store files
 */
export interface DeduplicationContext {
  getFact: (id: EntityID) => LoreFact | undefined;
  getFacts: (options?: { worldId?: EntityID }) => LoreFact[];
  updateFact: (id: EntityID, updates: Partial<LoreFact>) => void;
  deleteFact: (id: EntityID) => void;
  setAliases: (id: EntityID, aliases: string[]) => void;
  setError: (error: UserFriendlyError | null) => void;
}

/**
 * Scan for potential duplicates in a world
 */
export async function scanForDuplicatesImpl(
  worldId: EntityID,
  category: LoreCategory | null,
  context: DeduplicationContext
): Promise<DuplicateMatch[]> {
  try {
    const facts = context.getFacts({ worldId });
    const options = category ? { category } : undefined;

    const duplicates = findPotentialDuplicates(facts, worldId, options);

    logger.info('[LoreStore] Duplicate scan complete', {
      worldId,
      category,
      duplicatesFound: duplicates.length,
    });

    return duplicates;
  } catch (error) {
    logger.error('[LoreStore] Error scanning for duplicates', error);
    context.setError({
      title: 'Duplicate Scan Failed',
      message: 'Failed to scan for duplicates',
      retryable: true,
      type: ErrorType.SERVICE,
    });
    return [];
  }
}

/**
 * Merge two facts into one
 * Primary fact is determined by importance (high > medium > low), with older as tiebreaker
 */
export function mergeFactsImpl(
  primaryId: EntityID,
  secondaryId: EntityID,
  context: DeduplicationContext
): void {
  // Validate inputs
  if (primaryId === secondaryId) {
    throw new Error('Cannot merge a fact with itself');
  }

  const primaryFact = context.getFact(primaryId);
  const secondaryFact = context.getFact(secondaryId);

  if (!primaryFact) {
    throw new Error(`Primary fact not found: ${primaryId}`);
  }

  if (!secondaryFact) {
    throw new Error(`Secondary fact not found: ${secondaryId}`);
  }

  if (primaryFact.worldId !== secondaryFact.worldId) {
    throw new Error('Cannot merge facts from different worlds');
  }

  try {
    // Determine which fact should be primary based on importance
    const importanceOrder = { high: 3, medium: 2, low: 1, undefined: 0 };
    const primaryImportance = importanceOrder[primaryFact.metadata?.importance ?? 'undefined'];
    const secondaryImportance = importanceOrder[secondaryFact.metadata?.importance ?? 'undefined'];

    // Use the actual primary based on importance (or older if equal)
    let actualPrimary = primaryFact;
    let actualSecondary = secondaryFact;

    if (secondaryImportance > primaryImportance) {
      actualPrimary = secondaryFact;
      actualSecondary = primaryFact;
    } else if (secondaryImportance === primaryImportance) {
      // If importance is equal, use older fact (earlier timestamp)
      if (secondaryFact.createdAt < primaryFact.createdAt) {
        actualPrimary = secondaryFact;
        actualSecondary = primaryFact;
      }
    }

    // Combine aliases: primary aliases + secondary aliases + secondary value
    const mergedAliases = [
      ...(actualPrimary.aliases || []),
      ...(actualSecondary.aliases || []),
      actualSecondary.value,
    ];

    // Remove duplicates from aliases
    const uniqueAliases = Array.from(new Set(mergedAliases.map(a => a.trim())))
      .filter(a => a.length > 0 && a !== actualPrimary.value);

    // Merge tags
    const primaryTags = actualPrimary.metadata?.tags || [];
    const secondaryTags = actualSecondary.metadata?.tags || [];
    const mergedTags = Array.from(new Set([...primaryTags, ...secondaryTags]));

    // Merge descriptions (concatenate if both exist)
    const primaryDesc = actualPrimary.metadata?.description || '';
    const secondaryDesc = actualSecondary.metadata?.description || '';
    const mergedDescription = primaryDesc && secondaryDesc
      ? `${primaryDesc}\n\n${secondaryDesc}`
      : primaryDesc || secondaryDesc;

    // Keep the higher importance (use actual values after swap)
    const actualPrimaryImportance = importanceOrder[actualPrimary.metadata?.importance ?? 'undefined'];
    const actualSecondaryImportance = importanceOrder[actualSecondary.metadata?.importance ?? 'undefined'];
    const mergedImportance = actualPrimaryImportance >= actualSecondaryImportance
      ? actualPrimary.metadata?.importance
      : actualSecondary.metadata?.importance;

    // Update primary fact with merged data
    context.setAliases(actualPrimary.id, uniqueAliases);

    context.updateFact(actualPrimary.id, {
      metadata: {
        ...actualPrimary.metadata,
        description: mergedDescription || undefined,
        importance: mergedImportance,
        tags: mergedTags.length > 0 ? mergedTags : undefined,
      },
    });

    // Delete the secondary fact
    context.deleteFact(actualSecondary.id);

    logger.info('[LoreStore] Facts merged successfully', {
      primaryId: actualPrimary.id,
      secondaryId: actualSecondary.id,
      aliasesCount: uniqueAliases.length,
    });

  } catch (error) {
    logger.error('[LoreStore] Error merging facts', error);
    context.setError({
      title: 'Merge Failed',
      message: 'Failed to merge facts',
      retryable: false,
      type: ErrorType.SERVICE,
    });
    throw error;
  }
}

/**
 * Check for duplicates before creating a new fact
 */
export async function checkDuplicateBeforeCreateImpl(
  value: string,
  category: LoreCategory,
  worldId: EntityID,
  context: DeduplicationContext
): Promise<DuplicateMatch[]> {
  try {
    const existingFacts = context.getFacts({ worldId })
      .filter(f => f.category === category);

    if (existingFacts.length === 0) {
      return [];
    }

    // Create a temporary fact for comparison
    const now = getTimestamp();
    const tempFact: LoreFact = {
      id: 'temp' as EntityID,
      worldId,
      category,
      key: 'temp_key',
      value,
      aliases: [],
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    };

    const matches: DuplicateMatch[] = [];

    // Check against each existing fact
    for (const existingFact of existingFacts) {
      const result = await checkFactSimilarity(tempFact, existingFact);

      // Only include matches above minimum threshold
      if (result.isDuplicate || result.confidence >= 0.6) {
        matches.push({
          fact1: existingFact,
          fact2: tempFact,
          confidence: result.confidence,
          method: result.method,
          rationale: result.rationale,
        });
      }
    }

    // Sort by confidence (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence);

  } catch (error) {
    logger.error('[LoreStore] Error checking for duplicates', error);
    return [];
  }
}
