// src/lib/narrative/itemLossProcessor.ts

import { useInventoryStore } from '@/state/inventoryStore';
import {
  normalizeText,
  NORM_NAME,
} from '@/lib/utils';
import type { LostItemMetadata } from '@/types/narrative.types';
import type { EntityID } from '@/types/common.types';
import type { InventoryItem } from '@/types/inventory.types';
import { createLossJournalEntry } from '@/lib/inventory/journalIntegration';
import { logger } from '@/lib/utils/logger';
import {
  delayBetweenItems,
  itemNamesMatch,
  runQueued,
} from './itemProcessorShared';

type PreparedLossItem = LostItemMetadata & {
  normalizedName: string;
  matchedInventoryItem: InventoryItem | null;
  quantityToRemove: number;
  adjustedQuantity: boolean; // True if AI requested more than available
};

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
 * @param onError - Reports fail-open item errors to an awaited caller
 */
export async function processLostItems(
  items: LostItemMetadata[],
  characterId: EntityID,
  sessionId: EntityID,
  onError?: (error: unknown) => void
): Promise<void> {
  if (!items || items.length === 0) {
    return;
  }

  logger.info(`Processing ${items.length} lost items for character ${characterId}`);

  return runQueued(
    processingQueue,
    characterId,
    async () => {
      const inventoryStore = useInventoryStore.getState();
      const characterItems = inventoryStore.getCharacterItems(characterId);

      const preparedItems = await Promise.all(
        items.map((item) => prepareItemForLoss(item, characterItems))
      );

      for (let i = 0; i < preparedItems.length; i++) {
        const item = preparedItems[i];

        if (!item.matchedInventoryItem) {
          logger.warn(
            `Could not find item "${item.name}" in inventory for removal. Skipping.`,
            { characterId, inventoryCount: characterItems.length }
          );
          continue;
        }

        if (item.quantityToRemove <= 0) {
          logger.info(`Skipping removal of "${item.name}" as quantity is 0`);
          continue;
        }

        try {
          logger.info(`Removing ${item.quantityToRemove}x "${item.matchedInventoryItem.name}" from inventory`);
          inventoryStore.removeItem(
            characterId,
            item.matchedInventoryItem.id,
            item.quantityToRemove
          );

          // Create journal entry (non-blocking) with the actual quantity removed
          void createJournalEntryForLoss(
            item.matchedInventoryItem,
            { ...item, quantity: item.quantityToRemove },
            characterId,
            sessionId
          );

          if (item.adjustedQuantity) {
            logger.warn(
              `Insufficient quantity for "${item.name}": requested ${item.quantity}, had ${item.matchedInventoryItem.quantity}. Removed all available.`
            );
          }

          await delayBetweenItems(i, preparedItems.length);
        } catch (err) {
          logger.error(`Failed to remove item "${item.name}" from inventory:`, err);
          onError?.(err);
        }
      }
    },
    (err) => {
      logger.error('Previous item loss run failed', err);
      onError?.(err);
    },
    (err) => {
      logger.error('processLostItems encountered an unexpected error', err);
      onError?.(err);
    }
  );
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
    logger.error('Failed to create journal entry for item loss:', {
      error,
      itemName: item.name,
      characterId,
    });
  }
}
