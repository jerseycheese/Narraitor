// src/lib/narrative/itemAcquisitionProcessor.ts

import { useInventoryStore } from '@/state/inventoryStore';
import { categorizeInventoryItemsClient } from '@/lib/inventory/categorizeInventoryItemClient';
import { isValidCategory } from '@/lib/inventory/categories';
import {
  getTimestamp,
  normalizeText,
  NORM_DESC,
  NORM_NAME,
  titleCase,
} from '@/lib/utils';
import type { AcquiredItemMetadata } from '@/types/narrative.types';
import type { EntityID } from '@/types/common.types';
import type { InventoryItem, InventoryItemCategorization } from '@/types/inventory.types';
import { itemImageService } from '@/lib/services/itemImageService';
import {
  delayBetweenItems,
  itemNamesMatch,
  runQueued,
} from './itemProcessorShared';

import Logger from '@/lib/utils/logger';
const logger = new Logger('ItemAcquisitionProcessor');

type PreparedItem = AcquiredItemMetadata & {
  normalizedName: string;
  normalizedDescription: string;
  stackable: boolean;
  categorization: InventoryItemCategorization;
  quantity: number;
};

export interface AcquiredItemReference {
  id: EntityID;
  name: string;
}

const processingQueue = new Map<EntityID, Promise<unknown>>();

/**
 * Processes items acquired during narrative generation and adds them to character inventory.
 *
 * This function bridges the narrative generation system with the inventory system by:
 * 1. Taking item metadata from AI-generated narrative
 * 2. Using AI categorization to properly classify items
 * 3. Adding items to character inventory with proper acquisition tracking
 * 4. Maintaining journal integration through existing inventory store methods
 *
 * @param items - Array of item metadata from AI narrative generation
 * @param characterId - ID of the character acquiring the items
 * @param sessionId - ID of the current game session
 * @param onError - Reports fail-open item errors to an awaited caller
 * @param sourceId - Optional segment ID that sourced this acquisition
 */
export async function processAcquiredItems(
  items: AcquiredItemMetadata[],
  characterId: EntityID,
  sessionId: EntityID,
  onError?: (error: unknown) => void,
  sourceId?: EntityID
): Promise<AcquiredItemReference[]> {
  if (!items || items.length === 0) {
    return [];
  }

  const result = await runQueued(
    processingQueue,
    characterId,
    async () => {
      const inventoryStore = useInventoryStore.getState();
      const now = getTimestamp();

      const categorizations = await categorizeItems(items, now);
      const preparedItems = items.map((item, index) =>
        prepareItem(item, categorizations[index])
      );

      const deduplicatedItems = await deduplicateBatch(preparedItems);
      const acceptedItems: AcquiredItemReference[] = [];

      for (let i = 0; i < deduplicatedItems.length; i++) {
        const item = deduplicatedItems[i];

        try {
          const existingItems = inventoryStore.getCharacterItems(characterId);
          const matchResult = await findExistingMatch(existingItems, item);
          const existingMatch = matchResult?.match;

          if (item.stackable && existingMatch) {
            if (existingMatch.stackable) {
              const newQuantity = (existingMatch.quantity || 0) + item.quantity;
              inventoryStore.updateItemQuantity(existingMatch.id, newQuantity);
              acceptedItems.push({ id: existingMatch.id, name: existingMatch.name });

              if (matchResult.matchedBySoft) {
                logger.warn(
                  `Merged stackable item "${item.normalizedName}" despite category mismatch due to identical name/description.`
                );
              }

              continue;
            }

            logger.warn(
              `Item "${item.normalizedName}" was categorized as stackable but matches existing equipment. Skipping duplicate addition.`
            );
            continue;
          }

          if (!item.stackable && existingMatch) {
            logger.warn(
              `Item "${item.normalizedName}" already exists in inventory. Skipping duplicate addition.`
            );
            continue;
          }

          if (!item.stackable && item.quantity > 1) {
            for (let copyIndex = 0; copyIndex < item.quantity; copyIndex++) {
              const singleItem: PreparedItem = { ...item, quantity: 1 };

              const addedId = await addItemToInventory(
                inventoryStore,
                singleItem,
                characterId,
                sessionId,
                now,
                sourceId
              );
              if (addedId) {
                acceptedItems.push({ id: addedId, name: singleItem.normalizedName });
              }
              await delayBetweenItems(copyIndex, item.quantity);
            }
            continue;
          }

          const addedId = await addItemToInventory(
            inventoryStore,
            item,
            characterId,
            sessionId,
            now,
            sourceId
          );
          if (addedId) {
            acceptedItems.push({ id: addedId, name: item.normalizedName });
          }
          await delayBetweenItems(i, deduplicatedItems.length);
        } catch (err) {
          // Log error but continue processing remaining items
          logger.error(`Failed to add item "${item.name}" to inventory:`, err);
          onError?.(err);
        }
      }

      return acceptedItems;
    },
    (err) => {
      logger.error('Previous item acquisition run failed', err);
      onError?.(err);
    },
    (err) => {
      logger.error('processAcquiredItems encountered an unexpected error', err);
      onError?.(err);
    }
  );

  return result ?? [];
}

/**
 * Determines if items in a category are typically stackable.
 * Most categories allow stacking except equipment which is often unique.
 */
function isStackableCategory(categoryId: string): boolean {
  // Equipment, personal items, and quest items are unique (non-stackable)
  // All other categories are stackable (consumables, valuables, documents, miscellaneous)
  const nonStackableCategories = ['equipment', 'personal', 'quest-items'];
  return !nonStackableCategories.includes(categoryId);
}

/**
 * Normalizes item names to title case for consistency
 * Uses the project's standard titleCase utility from @/lib/utils
 */
function normalizeItemName(rawName: string): string {
  const trimmed = (rawName || '').trim();
  if (!trimmed) {
    return 'Unnamed Item';
  }

  return titleCase(trimmed);
}

function normalizeDescription(rawDescription?: string): string {
  return normalizeText(rawDescription || '', NORM_DESC);
}

function buildStackableKey(name: string, categoryId: string, description: string): string {
  const normalizedNameForKey = normalizeText(name || '', NORM_NAME).toLowerCase();
  const normalizedDescriptionForKey = normalizeText(description || '', NORM_DESC).toLowerCase();

  return `${normalizedNameForKey}::${categoryId || 'unknown'}::${normalizedDescriptionForKey}`;
}

function buildEquipmentKey(name: string, categoryId: string): string {
  const normalizedNameForKey = normalizeText(name || '', NORM_NAME).toLowerCase();
  return `${normalizedNameForKey}::${categoryId || 'unknown'}`;
}

function buildNameKey(name: string): string {
  return normalizeText(name || '', NORM_NAME).toLowerCase();
}

function prepareItem(
  item: AcquiredItemMetadata,
  categorization: InventoryItemCategorization
): PreparedItem {
  const normalizedName = normalizeItemName(item.name);
  const stackable = isStackableCategory(categorization.categoryId);
  const quantity = item.quantity ?? 1;

  return {
    ...item,
    normalizedName,
    normalizedDescription: normalizeDescription(item.description),
    stackable,
    categorization,
    quantity,
  };
}

/**
 * Resolves a categorization for every acquired item, preferring the narrative
 * AI's category hint (zero extra API calls) and batching the remainder into a
 * single categorization request instead of one call per item.
 */
async function categorizeItems(
  items: AcquiredItemMetadata[],
  now: string
): Promise<InventoryItemCategorization[]> {
  const results = new Array<InventoryItemCategorization>(items.length);
  const needsAiIndices: number[] = [];

  items.forEach((item, index) => {
    const fromHint = hintCategorization(item, now);
    if (fromHint) {
      results[index] = fromHint;
    } else {
      needsAiIndices.push(index);
    }
  });

  if (needsAiIndices.length === 0) {
    return results;
  }

  const aiResults = await batchCategorize(
    needsAiIndices.map((index) => items[index]),
    now
  );

  needsAiIndices.forEach((index, position) => {
    results[index] = aiResults[position];
  });

  return results;
}

/**
 * Uses the narrative AI's category hint when it is present and valid, skipping
 * the separate categorization API call entirely.
 */
function hintCategorization(
  item: AcquiredItemMetadata,
  now: string
): InventoryItemCategorization | null {
  if (item.categoryHint && isValidCategory(item.categoryHint)) {
    return {
      categoryId: item.categoryHint,
      source: 'narrative-context',
      classifiedAt: now,
      confidence: 0.95,
      rationale: 'Category inferred from narrative context',
    };
  }
  return null;
}

const fallbackCategorization = (now: string): InventoryItemCategorization => ({
  categoryId: 'miscellaneous',
  source: 'fallback',
  classifiedAt: now,
  confidence: 0,
  rationale: 'AI categorization unavailable',
});

async function batchCategorize(
  items: AcquiredItemMetadata[],
  now: string
): Promise<InventoryItemCategorization[]> {
  try {
    const responses = await categorizeInventoryItemsClient(
      items.map((item) => ({
        name: item.name,
        description: item.description || '',
      }))
    );

    return items.map((_, index) => {
      const response = responses[index];
      return response
        ? { ...response, classifiedAt: now }
        : fallbackCategorization(now);
    });
  } catch {
    return items.map(() => fallbackCategorization(now));
  }
}

async function deduplicateBatch(items: PreparedItem[]): Promise<PreparedItem[]> {
  const map = new Map<string, PreparedItem>();
  const allItems: Array<{ key: string; item: PreparedItem }> = [];

  for (const item of items) {
    const primaryKey = item.stackable
      ? buildStackableKey(item.normalizedName, item.categorization.categoryId, item.description || '')
      : buildEquipmentKey(item.normalizedName, item.categorization.categoryId);

    let existingKey: string | undefined = primaryKey;
    let existing = map.get(primaryKey);

    // Check semantic name similarity for all items (e.g., "Lantern" vs "Rusty Kerosene Lantern", "Locket" vs "Tarnished Silver Locket")
    let existingIndex = -1;
    if (!existing) {
      for (let i = 0; i < allItems.length; i++) {
        if (await itemNamesMatch(item.normalizedName, allItems[i].item.normalizedName)) {
          existingKey = allItems[i].key;
          existing = map.get(existingKey);
          existingIndex = i;
          break;
        }
      }
    }

    if (!existing) {
      const newItem = { ...item };
      map.set(primaryKey, newItem);
      allItems.push({ key: primaryKey, item: newItem });
      continue;
    }

    if (item.stackable && existing.stackable) {
      const mergedQuantity = (existing.quantity || 0) + (item.quantity || 0);
      const mergedItem = {
        ...existing,
        quantity: mergedQuantity,
        acquisitionMethod: existing.acquisitionMethod ?? item.acquisitionMethod,
      };
      map.set(existingKey as string, mergedItem);

      // Update the item reference in allItems so subsequent matches see the merged quantity
      if (existingIndex >= 0) {
        allItems[existingIndex].item = mergedItem;
      }

      if (existing.acquisitionMethod && item.acquisitionMethod && existing.acquisitionMethod !== item.acquisitionMethod) {
        logger.warn(
          `Stackable item "${item.normalizedName}" had differing acquisition methods within the same batch. Using "${existing.acquisitionMethod}".`
        );
      }

      continue;
    }

    // Equipment duplicate within the same batch (description may differ)
    const betterDescription = chooseBetterDescription(existing.description, item.description);
    const mergedItem = {
      ...existing,
      description: betterDescription,
      normalizedDescription: normalizeDescription(betterDescription),
    };
    map.set(existingKey as string, mergedItem);

    // Update the item reference in allItems so subsequent matches see the merged description
    if (existingIndex >= 0) {
      allItems[existingIndex].item = mergedItem;
    }

    logger.warn(
      `Duplicate equipment item detected in batch: "${item.normalizedName}". Keeping one entry and merging details.`
    );
  }

  return Array.from(map.values());
}

async function findExistingMatch(
  existingItems: InventoryItem[],
  item: PreparedItem
): Promise<{ match: InventoryItem; matchedBySoft: boolean } | undefined> {
  // First try exact matching based on stackability
  if (item.stackable) {
    const targetKey = buildStackableKey(item.normalizedName, item.categorization.categoryId, item.description || '');
    for (const existing of existingItems) {
      if (!existing || !existing.stackable) continue;
      const existingKey = buildStackableKey(existing.name, existing.categoryId, existing.description || '');
      if (existingKey === targetKey) {
        return { match: existing, matchedBySoft: false };
      }
    }
  } else {
    // Non-stackable: try exact name match first
    const targetNameKey = buildNameKey(item.normalizedName);
    for (const existing of existingItems) {
      if (!existing || existing.stackable) continue;
      const existingNameKey = buildNameKey(existing.name);
      if (existingNameKey === targetNameKey) {
        return { match: existing, matchedBySoft: false };
      }
    }
  }

  // Semantic name matching for all items (handles "Locket" vs "Tarnished Silver Locket", "Photo of Mom" vs "Photo of your mother")
  for (const existing of existingItems) {
    if (!existing) continue;
    if (await itemNamesMatch(item.normalizedName, existing.name)) {
      return { match: existing, matchedBySoft: true };
    }
  }

  return undefined;
}

async function addItemToInventory(
  inventoryStore: ReturnType<typeof useInventoryStore.getState>,
  item: PreparedItem,
  characterId: EntityID,
  sessionId: EntityID,
  now: string,
  sourceId?: EntityID
): Promise<EntityID | null> {
  const itemId = inventoryStore.addItem(characterId, {
    name: item.normalizedName,
    description: item.description,
    quantity: item.quantity,
    stackable: item.stackable,
    categorization: item.categorization,
    acquisition: {
      method: item.acquisitionMethod || 'unknown',
      quantity: item.quantity,
      sessionId,
      sourceId,
      acquiredAt: now,
    },
  });

  if (itemId) {
    itemImageService.generateForItem(itemId, characterId).catch((error) => {
      logger.warn(`Background image generation failed for item: ${item.normalizedName}`, error);
    });
  }

  return itemId;
}

function chooseBetterDescription(existing?: string, incoming?: string): string | undefined {
  const existingTrimmed = (existing || '').trim();
  const incomingTrimmed = (incoming || '').trim();

  if (!existingTrimmed) {
    return incomingTrimmed || existingTrimmed;
  }

  if (!incomingTrimmed) {
    return existingTrimmed;
  }

  return incomingTrimmed.length > existingTrimmed.length ? incomingTrimmed : existingTrimmed;
}
