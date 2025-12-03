// src/lib/narrative/itemAcquisitionProcessor.ts

import { useInventoryStore } from '@/state/inventoryStore';
import { categorizeInventoryItemClient } from '@/lib/inventory/categorizeInventoryItemClient';
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

type PreparedItem = AcquiredItemMetadata & {
  normalizedName: string;
  normalizedDescription: string;
  stackable: boolean;
  categorization: InventoryItemCategorization;
  quantity: number;
};

const RATE_LIMIT_DELAY_MS = 200;
const processingQueue = new Map<EntityID, Promise<void>>();

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
 */
export async function processAcquiredItems(
  items: AcquiredItemMetadata[],
  characterId: EntityID,
  sessionId: EntityID
): Promise<void> {
  if (!items || items.length === 0) {
    return;
  }

  const previous = processingQueue.get(characterId) ?? Promise.resolve();

  const tracked = previous
    .catch((err) => {
      // Prevent a failed prior job from blocking the queue
      console.error('Previous item acquisition run failed', err);
    })
    .then(async () => {
      const inventoryStore = useInventoryStore.getState();
      const now = getTimestamp();

      const preparedItems = await Promise.all(
        items.map((item) => prepareItem(item, now))
      );

      const deduplicatedItems = deduplicateBatch(preparedItems);

      for (let i = 0; i < deduplicatedItems.length; i++) {
        const item = deduplicatedItems[i];

        try {
          const existingItems = inventoryStore.getCharacterItems(characterId);
          const matchResult = findExistingMatch(existingItems, item);
          const existingMatch = matchResult?.match;

          if (item.stackable && existingMatch) {
            if (existingMatch.stackable) {
              const newQuantity = (existingMatch.quantity || 0) + item.quantity;
              inventoryStore.updateItemQuantity(existingMatch.id, newQuantity);

              if (matchResult.matchedBySoft) {
                console.warn(
                  `Merged stackable item "${item.normalizedName}" despite category mismatch due to identical name/description.`
                );
              }

              continue;
            }

            console.warn(
              `Item "${item.normalizedName}" was categorized as stackable but matches existing equipment. Skipping duplicate addition.`
            );
            continue;
          }

          if (!item.stackable && existingMatch) {
            console.warn(
              `Equipment item "${item.normalizedName}" already exists in inventory. Skipping duplicate addition.`
            );
            continue;
          }

          if (!item.stackable && item.quantity > 1) {
            for (let copyIndex = 0; copyIndex < item.quantity; copyIndex++) {
              const singleItem: PreparedItem = { ...item, quantity: 1 };

              await addItemToInventory(inventoryStore, singleItem, characterId, sessionId, now);
              await delayBetweenItems(copyIndex, item.quantity);
            }
            continue;
          }

          await addItemToInventory(inventoryStore, item, characterId, sessionId, now);
          await delayBetweenItems(i, deduplicatedItems.length);
        } catch (err) {
          // Log error but continue processing remaining items
          console.error(`Failed to add item "${item.name}" to inventory:`, err);
        }
      }
    })
    .catch((err) => {
      console.error('processAcquiredItems encountered an unexpected error', err);
    })
    .finally(() => {
      if (processingQueue.get(characterId) === tracked) {
        processingQueue.delete(characterId);
      }
    });

  processingQueue.set(characterId, tracked);

  return tracked;
}

/**
 * Determines if items in a category are typically stackable.
 * Most categories allow stacking except equipment which is often unique.
 */
function isStackableCategory(categoryId: string): boolean {
  // Equipment items are typically not stackable (each is unique)
  // All other categories typically allow stacking
  return categoryId !== 'equipment';
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

function buildDedupKey(name: string, categoryId: string, description: string): string {
  const normalizedNameForKey = normalizeText(name || '', NORM_NAME).toLowerCase();
  const normalizedDescriptionForKey = normalizeText(description || '', NORM_DESC).toLowerCase();

  return `${normalizedNameForKey}::${categoryId || 'unknown'}::${normalizedDescriptionForKey}`;
}

function buildSoftKey(name: string, description: string): string {
  const normalizedNameForKey = normalizeText(name || '', NORM_NAME).toLowerCase();
  const normalizedDescriptionForKey = normalizeText(description || '', NORM_DESC).toLowerCase();

  return `${normalizedNameForKey}::${normalizedDescriptionForKey}`;
}

async function prepareItem(item: AcquiredItemMetadata, now: string): Promise<PreparedItem> {
  const normalizedName = normalizeItemName(item.name);
  const categorization = await getItemCategorization(item, now);
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

async function getItemCategorization(
  item: AcquiredItemMetadata,
  now: string
): Promise<InventoryItemCategorization> {
  try {
    const aiCategorization = await categorizeInventoryItemClient({
      name: item.name,
      description: item.description || '',
    });

    return {
      ...aiCategorization,
      classifiedAt: now,
    };
  } catch {
    return {
      categoryId: 'miscellaneous',
      source: 'fallback',
      classifiedAt: now,
      confidence: 0,
      rationale: 'AI categorization unavailable',
    };
  }
}

function deduplicateBatch(items: PreparedItem[]): PreparedItem[] {
  const map = new Map<string, PreparedItem>();
  const softKeyIndex = new Map<string, string>();

  for (const item of items) {
    const dedupKey = buildDedupKey(item.normalizedName, item.categorization.categoryId, item.description || '');
    const softKey = buildSoftKey(item.normalizedName, item.description || '');

    let existingKey: string | undefined = dedupKey;
    let existing = map.get(dedupKey);

    if (!existing) {
      const softExistingKey = softKeyIndex.get(softKey);
      if (softExistingKey) {
        existingKey = softExistingKey;
        existing = map.get(softExistingKey);
      }
    }

    if (!existing) {
      map.set(dedupKey, { ...item });
      softKeyIndex.set(softKey, dedupKey);
      continue;
    }

    if (item.stackable && existing.stackable) {
      const mergedQuantity = (existing.quantity || 0) + (item.quantity || 0);
      map.set(existingKey as string, {
        ...existing,
        quantity: mergedQuantity,
        acquisitionMethod: existing.acquisitionMethod ?? item.acquisitionMethod,
      });

      if (existing.acquisitionMethod && item.acquisitionMethod && existing.acquisitionMethod !== item.acquisitionMethod) {
        console.warn(
          `Stackable item "${item.normalizedName}" had differing acquisition methods within the same batch. Using "${existing.acquisitionMethod}".`
        );
      }

      continue;
    }

    // Duplicate equipment within the same batch
    console.warn(
      `Duplicate equipment item detected in batch: "${item.normalizedName}". Keeping the first occurrence only.`
    );
  }

  return Array.from(map.values());
}

function findExistingMatch(
  existingItems: InventoryItem[],
  item: PreparedItem
): { match: InventoryItem; matchedBySoft: boolean } | undefined {
  const targetKey = buildDedupKey(item.normalizedName, item.categorization.categoryId, item.description || '');
  const targetSoftKey = buildSoftKey(item.normalizedName, item.description || '');

  for (const existing of existingItems) {
    if (!existing) continue;
    const existingKey = buildDedupKey(existing.name, existing.categoryId, existing.description || '');
    if (existingKey === targetKey) {
      return { match: existing, matchedBySoft: false };
    }
  }

  for (const existing of existingItems) {
    if (!existing) continue;
    const existingSoftKey = buildSoftKey(existing.name, existing.description || '');
    if (existingSoftKey === targetSoftKey) {
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
  now: string
): Promise<void> {
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
      acquiredAt: now,
    },
  });

  if (itemId) {
    itemImageService.generateForItem(itemId, characterId).catch((error) => {
      console.warn(`Background image generation failed for item: ${item.normalizedName}`, error);
    });
  }
}

function delayBetweenItems(index: number, total: number): Promise<void> {
  if (index >= total - 1) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
}
