// src/lib/narrative/itemProcessorShared.ts
//
// Shared helpers used by both itemAcquisitionProcessor and itemLossProcessor:
// AI-driven name similarity, rate-limit delay between item operations, and
// the per-character processing-queue helper that serialises concurrent runs.

import type { EntityID } from '@/types/common.types';
import { normalizeText, NORM_NAME } from '@/lib/utils';

import Logger from '@/lib/utils/logger';
const logger = new Logger('ItemProcessorShared');

const RATE_LIMIT_DELAY_MS = 200;

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
export function runQueued(
  queue: Map<EntityID, Promise<void>>,
  characterId: EntityID,
  work: () => Promise<void>,
  onPriorError: (err: unknown) => void,
  onUnexpectedError: (err: unknown) => void
): Promise<void> {
  const previous = queue.get(characterId) ?? Promise.resolve();

  const tracked = previous
    .catch(onPriorError)
    .then(work)
    .catch(onUnexpectedError)
    .finally(() => {
      if (queue.get(characterId) === tracked) {
        queue.delete(characterId);
      }
    });

  queue.set(characterId, tracked);
  return tracked;
}
