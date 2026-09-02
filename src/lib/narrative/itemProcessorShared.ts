// src/lib/narrative/itemProcessorShared.ts
//
// Shared helpers used by both itemAcquisitionProcessor and itemLossProcessor:
// AI-driven name similarity, rate-limit delay between item operations, and
// the per-character processing-queue helper that serialises concurrent runs.

import { distance } from 'fastest-levenshtein';
import type { EntityID } from '@/types/common.types';
import { normalizeText, NORM_NAME } from '@/lib/utils';

import Logger from '@/lib/utils/logger';
const logger = new Logger('ItemProcessorShared');

const RATE_LIMIT_DELAY_MS = 200;

// Shortest token length we trust for a substring match. Below this, substrings
// produce false positives ("key" inside "donkey", "ash" inside "flask").
const MIN_SUBSTRING_LENGTH = 4;

/**
 * True when `shorter` appears in `longer` as a whole word-sequence (bounded by
 * spaces or string ends), not mid-word. Padding both with spaces means
 * "lantern" matches "rusty kerosene lantern" but "ring" does NOT match
 * "earring" - the latter would merge genuinely different items.
 */
function containsAsWholeWords(longer: string, shorter: string): boolean {
  return ` ${longer} `.includes(` ${shorter} `);
}

/**
 * Cheap, high-precision name-equivalence check used to skip the AI similarity
 * call for obvious duplicates ("Gold Coin" vs "Gold Coins", "Lantern" vs
 * "Rusty Kerosene Lantern"). Only ever returns true for confident matches;
 * ambiguous pairs (synonyms, reorderings) still defer to the AI check.
 */
function namesAreObviousMatch(normalized1: string, normalized2: string): boolean {
  if (!normalized1 || !normalized2) return false;

  const shorter =
    normalized1.length <= normalized2.length ? normalized1 : normalized2;
  const longer =
    normalized1.length <= normalized2.length ? normalized2 : normalized1;

  // Whole-word containment (handles descriptive expansions of a base noun).
  if (shorter.length >= MIN_SUBSTRING_LENGTH && containsAsWholeWords(longer, shorter)) {
    return true;
  }

  // Near-identical spellings (typos, singular/plural) within a small edit budget
  // scaled to the longer string so longer names tolerate slightly more drift.
  const maxLength = longer.length;
  if (maxLength === 0) return false;
  const editBudget = Math.max(1, Math.floor(maxLength * 0.15));
  return distance(normalized1, normalized2) <= editBudget;
}

/**
 * Checks if two item names are semantically similar using AI.
 * Handles variations like:
 *   - "Lantern" vs "Rusty Kerosene Lantern"
 *   - "Photo of Mom" vs "Photo of your mother"
 *   - "Gold Coin" vs "Gold Coins"
 *   - "Healing Potion" vs "Potion of Healing"
 */
export async function itemNamesMatch(name1: string, name2: string): Promise<boolean> {
  const normalized1 = normalizeText(name1 || '', NORM_NAME).toLowerCase();
  const normalized2 = normalizeText(name2 || '', NORM_NAME).toLowerCase();

  if (normalized1 === normalized2) return true;

  // Resolve obvious duplicates locally before paying for an AI similarity call.
  if (namesAreObviousMatch(normalized1, normalized2)) return true;

  try {
    const { checkItemSimilarityClient } = await import('@/lib/inventory/checkItemSimilarityClient');
    const result = await checkItemSimilarityClient({ name1, name2 });
    return result.similar && result.confidence > 0.7;
  } catch (error) {
    logger.warn('AI similarity check failed, using fallback:', error);
    return normalized1.includes(normalized2) || normalized2.includes(normalized1);
  }
}

export function delayBetweenItems(index: number, total: number): Promise<void> {
  if (index >= total - 1) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
}

/**
 * Runs `work` serialised against any prior in-flight run for the same `characterId`.
 * Used by acquisition and loss processors to prevent concurrent inventory mutations
 * for one character.
 */
export function runQueued<T = void>(
  queue: Map<EntityID, Promise<unknown>>,
  characterId: EntityID,
  work: () => Promise<T>,
  onPriorError: (err: unknown) => void,
  onUnexpectedError: (err: unknown) => void
): Promise<T | undefined> {
  const previous = queue.get(characterId) ?? Promise.resolve();

  let result: T | undefined;
  const tracked = previous
    .catch(onPriorError)
    .then(async () => {
      result = await work();
      return result;
    })
    .catch(onUnexpectedError)
    .finally(() => {
      if (queue.get(characterId) === tracked) {
        queue.delete(characterId);
      }
    });

  queue.set(characterId, tracked);
  return tracked.then(() => result);
}
