// src/lib/narrative/itemLossProcessor.ts

import { useInventoryStore } from '@/state/inventoryStore';
import {
  getTimestamp,
  normalizeText,
  NORM_NAME,
} from '@/lib/utils';
import type { LostItemMetadata } from '@/types/narrative.types';
import type { EntityID } from '@/types/common.types';
import type { InventoryItem } from '@/types/inventory.types';
import { createLossJournalEntry } from '@/lib/inventory/journalIntegration';

type PreparedLossItem = LostItemMetadata & {
  normalizedName: string;
  matchedInventoryItem: InventoryItem | null;
  quantityToRemove: number;
  adjustedQuantity: boolean; // True if AI requested more than available
};

const RATE_LIMIT_DELAY_MS = 200;
const processingQueue = new Map<EntityID, Promise<void>>();

/**
 * Processes items lost or consumed during narrative generation and removes them from character inventory.
 *
 * This function bridges the narrative generation system with the inventory system by:
 * 1. Taking item loss metadata from AI-generated narrative
 * 2. Using semantic matching to find the correct items in inventory
 * 3. Removing items or decreasing quantities in character inventory
 * 4. Creating journal entries for the losses
 *
 * @param items - Array of item loss metadata from AI narrative generation
 * @param characterId - ID of the character losing the items
 * @param sessionId - ID of the current game session
 */
export async function processLostItems(
  items: LostItemMetadata[],
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
      console.error('Previous item loss run failed', err);
    })
    .then(async () => {
      const inventoryStore = useInventoryStore.getState();
      const characterItems = inventoryStore.getCharacterItems(characterId);

      const preparedItems = await Promise.all(
        items.map((item) => prepareItemForLoss(item, characterItems))
      );

      for (let i = 0; i < preparedItems.length; i++) {
        const item = preparedItems[i];

        if (!item.matchedInventoryItem) {
          console.warn(
            `Could not find item "${item.name}" in inventory for removal. Skipping.`
          );
          continue;
        }

        try {
          // Execute removal
          inventoryStore.removeItem(
            characterId,
            item.matchedInventoryItem.id,
            item.quantityToRemove
          );

          // Create journal entry (non-blocking)
          void createJournalEntryForLoss(
            item.matchedInventoryItem,
            item,
            characterId,
            sessionId
          );

          if (item.adjustedQuantity) {
            console.warn(
              `Insufficient quantity for "${item.name}": requested ${item.quantity}, had ${item.matchedInventoryItem.quantity}. Removed all available.`
            );
          }

          // Rate limiting between items
          await delayBetweenItems(i, preparedItems.length);
        } catch (err) {
          // Log error but continue processing remaining items
          console.error(`Failed to remove item "${item.name}" from inventory:`, err);
        }
      }
    })
    .catch((err) => {
      console.error('processLostItems encountered an unexpected error', err);
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
 * Validates and matches items for loss.
 */
async function prepareItemForLoss(
  item: LostItemMetadata,
  inventory: InventoryItem[]
): Promise<PreparedLossItem> {
  const normalizedName = normalizeText(item.name || '', NORM_NAME).toLowerCase();
  let matchedItem: InventoryItem | null = null;

  // 1. Exact ID match (if provided)
  if (item.itemId) {
    matchedItem = inventory.find((i) => i.id === item.itemId) || null;
  }

  // 2. Exact name match (fallback)
  if (!matchedItem) {
    matchedItem = inventory.find((i) => normalizeText(i.name, NORM_NAME).toLowerCase() === normalizedName) || null;
  }

  // 3. Semantic AI matching (fallback)
  if (!matchedItem) {
    for (const invItem of inventory) {
      if (await itemNamesMatch(item.name, invItem.name)) {
        matchedItem = invItem;
        break;
      }
    }
  }

  const requestedQuantity = item.quantity ?? 1;
  let quantityToRemove = requestedQuantity;
  let adjustedQuantity = false;

  if (matchedItem && requestedQuantity > matchedItem.quantity) {
    quantityToRemove = matchedItem.quantity;
    adjustedQuantity = true;
  }

  return {
    ...item,
    normalizedName,
    matchedInventoryItem: matchedItem,
    quantityToRemove,
    adjustedQuantity,
  };
}

/**
 * Checks if two item names are semantically similar using AI.
 * Reuses the pattern from itemAcquisitionProcessor.
 */
async function itemNamesMatch(name1: string, name2: string): Promise<boolean> {
  const normalized1 = normalizeText(name1 || '', NORM_NAME).toLowerCase();
  const normalized2 = normalizeText(name2 || '', NORM_NAME).toLowerCase();

  // Quick exact match check
  if (normalized1 === normalized2) return true;

  try {
    const { checkItemSimilarityClient } = await import('@/lib/inventory/checkItemSimilarityClient');
    const result = await checkItemSimilarityClient({
      name1,
      name2,
    });

    return result.similar && result.confidence > 0.7;
  } catch (error) {
    console.warn('AI similarity check failed for item loss, using fallback:', error);
    return normalized1.includes(normalized2) || normalized2.includes(normalized1);
  }
}

/**
 * Creates a journal entry for item loss.
 */
async function createJournalEntryForLoss(
  item: InventoryItem,
  lossMetadata: LostItemMetadata,
  characterId: EntityID,
  sessionId: EntityID
): Promise<void> {
  try {
    const { useJournalStore } = await import('@/state/journalStore');
    const { useSessionStore } = await import('@/state/sessionStore');

    const sessionStore = useSessionStore.getState();
    const journalStore = useJournalStore.getState();

    const worldId = sessionStore.worldId;
    if (!worldId) return;

    const journalEntry = createLossJournalEntry(
      item,
      lossMetadata,
      worldId,
      characterId
    );

    journalStore.addEntry(sessionId, journalEntry);
  } catch (error) {
    console.warn('Failed to create journal entry for item loss:', error);
  }
}

function delayBetweenItems(index: number, total: number): Promise<void> {
  if (index >= total - 1) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
}
