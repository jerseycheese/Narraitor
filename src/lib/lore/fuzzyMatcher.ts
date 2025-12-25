/**
 * Fuzzy matching for lore entity deduplication
 * Hybrid approach: Levenshtein distance + AI semantic matching
 */

import { distance } from 'fastest-levenshtein';
import { normalizeText, NORM_NAME } from '../utils/textNormalization';
import { checkLoreSimilarityClient } from './checkLoreSimilarityClient';
import type { LoreFact, LoreCategory, DuplicateMatch, SimilarityResult } from '@/types/lore.types';
import type { EntityID } from '@/types/common.types';

// Confidence thresholds
const HIGH_CONFIDENCE_THRESHOLD = 0.85;
const MEDIUM_CONFIDENCE_THRESHOLD = 0.60;

/**
 * Calculate string similarity using Levenshtein distance
 * Returns a score from 0.0 (completely different) to 1.0 (identical)
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  // Normalize strings for comparison
  const normalized1 = normalizeText(str1, NORM_NAME).toLowerCase();
  const normalized2 = normalizeText(str2, NORM_NAME).toLowerCase();

  // Exact match returns 1.0
  if (normalized1 === normalized2) {
    return 1.0;
  }

  // Calculate Levenshtein distance
  const maxLength = Math.max(normalized1.length, normalized2.length);
  if (maxLength === 0) return 1.0; // Both empty strings

  const levenshteinDistance = distance(normalized1, normalized2);

  // Convert distance to similarity score (0-1 range)
  const similarity = 1 - (levenshteinDistance / maxLength);

  return Math.max(0, Math.min(1, similarity)); // Clamp to 0-1 range
}

/**
 * Check if value matches any alias (exact normalized match)
 */
function matchesAlias(value: string, aliases: string[]): boolean {
  const normalizedValue = normalizeText(value, NORM_NAME).toLowerCase();
  return aliases.some(alias =>
    normalizeText(alias, NORM_NAME).toLowerCase() === normalizedValue
  );
}

/**
 * Find potential duplicates in a list of facts
 */
export function findPotentialDuplicates(
  facts: LoreFact[],
  worldId: EntityID,
  options?: {
    minConfidence?: number;
    category?: LoreCategory;
  }
): DuplicateMatch[] {
  const minConfidence = options?.minConfidence ?? MEDIUM_CONFIDENCE_THRESHOLD;
  const category = options?.category;

  // Filter facts by world and optionally by category
  let filteredFacts = facts.filter(f => f.worldId === worldId);
  if (category) {
    filteredFacts = filteredFacts.filter(f => f.category === category);
  }

  const duplicates: DuplicateMatch[] = [];

  // Compare each pair of facts
  for (let i = 0; i < filteredFacts.length; i++) {
    for (let j = i + 1; j < filteredFacts.length; j++) {
      const fact1 = filteredFacts[i];
      const fact2 = filteredFacts[j];

      // Check for exact normalized match
      const normalized1 = normalizeText(fact1.value, NORM_NAME).toLowerCase();
      const normalized2 = normalizeText(fact2.value, NORM_NAME).toLowerCase();

      if (normalized1 === normalized2) {
        duplicates.push({
          fact1,
          fact2,
          confidence: 1.0,
          method: 'exact',
          rationale: 'Exact match after normalization',
        });
        continue;
      }

      // Check for alias matches
      if (matchesAlias(fact2.value, fact1.aliases || []) || matchesAlias(fact1.value, fact2.aliases || [])) {
        duplicates.push({
          fact1,
          fact2,
          confidence: 1.0,
          method: 'alias',
          rationale: 'Value matches known alias',
        });
        continue;
      }

      // Calculate string similarity
      const similarity = calculateStringSimilarity(fact1.value, fact2.value);

      if (similarity >= minConfidence) {
        duplicates.push({
          fact1,
          fact2,
          confidence: similarity,
          method: 'levenshtein',
          rationale: `Names are ${Math.round(similarity * 100)}% similar`,
        });
      }
    }
  }

  // Sort by confidence (highest first)
  return duplicates.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Check similarity between two specific facts
 * Uses hybrid approach: exact match -> alias match -> Levenshtein -> AI (if needed)
 */
export async function checkFactSimilarity(
  fact1: LoreFact,
  fact2: LoreFact
): Promise<SimilarityResult> {
  // 1. Check exact normalized match
  const normalized1 = normalizeText(fact1.value, NORM_NAME).toLowerCase();
  const normalized2 = normalizeText(fact2.value, NORM_NAME).toLowerCase();

  if (normalized1 === normalized2) {
    return {
      isDuplicate: true,
      confidence: 1.0,
      method: 'exact',
      rationale: 'Exact match after normalization',
    };
  }

  // 2. Check alias matches
  if (matchesAlias(fact2.value, fact1.aliases || []) || matchesAlias(fact1.value, fact2.aliases || [])) {
    return {
      isDuplicate: true,
      confidence: 1.0,
      method: 'alias',
      rationale: 'Value matches known alias',
    };
  }

  // 3. Calculate Levenshtein similarity
  const similarity = calculateStringSimilarity(fact1.value, fact2.value);

  // High confidence match - no need for AI
  if (similarity >= HIGH_CONFIDENCE_THRESHOLD) {
    return {
      isDuplicate: true,
      confidence: similarity,
      method: 'levenshtein',
      rationale: `Names are ${Math.round(similarity * 100)}% similar`,
    };
  }

  // Low confidence - clearly not duplicates
  if (similarity < MEDIUM_CONFIDENCE_THRESHOLD) {
    return {
      isDuplicate: false,
      confidence: similarity,
      method: 'levenshtein',
      rationale: `Names are only ${Math.round(similarity * 100)}% similar`,
    };
  }

  // Medium confidence (0.60-0.85) - use AI for semantic check
  try {
    const aiResult = await checkLoreSimilarityClient({
      name1: fact1.value,
      name2: fact2.value,
      category: fact1.category,
    });

    return {
      isDuplicate: aiResult.similar,
      confidence: aiResult.confidence,
      method: 'ai',
      rationale: aiResult.rationale || 'AI semantic analysis',
    };
  } catch (error) {
    // AI check failed - fall back to Levenshtein result
    return {
      isDuplicate: similarity >= 0.7, // Use slightly higher threshold as fallback
      confidence: similarity,
      method: 'levenshtein',
      rationale: `Levenshtein similarity: ${Math.round(similarity * 100)}% (AI check unavailable)`,
    };
  }
}

// Export types
export type { DuplicateMatch, SimilarityResult };
