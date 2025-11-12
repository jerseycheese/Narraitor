// src/lib/narrative/itemAcquisitionProcessor.ts

import { useInventoryStore } from '@/state/inventoryStore';
import { categorizeInventoryItemClient } from '@/lib/inventory/categorizeInventoryItemClient';
import { getTimestamp, titleCase } from '@/lib/utils';
import type { AcquiredItemMetadata } from '@/types/narrative.types';
import type { EntityID } from '@/types/common.types';
import type { InventoryItemCategorization } from '@/types/inventory.types';
import { itemImageService } from '@/lib/services/itemImageService';

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

  const inventoryStore = useInventoryStore.getState();
  const now = getTimestamp();

  for (const item of items) {
    try {
      const normalizedName = normalizeItemName(item.name);
      const existingItems = inventoryStore.getCharacterItems(characterId);
      const existingMatch = existingItems.find(
        (existing) =>
          existing && normalizeItemName(existing.name).toLowerCase() === normalizedName.toLowerCase()
      );

      // Use AI to categorize the item
      let categorization: InventoryItemCategorization;

      try {
        const aiCategorization = await categorizeInventoryItemClient({
          name: item.name,
          description: item.description || '',
        });

        categorization = {
          ...aiCategorization,
          classifiedAt: now,
        };
      } catch {
        // Fallback to miscellaneous if AI categorization fails
        categorization = {
          categoryId: 'miscellaneous',
          source: 'fallback',
          classifiedAt: now,
          confidence: 0,
          rationale: 'AI categorization unavailable',
        };
      }

      // Determine if item is stackable based on category
      const stackable = isStackableCategory(categorization.categoryId);
      const quantity = item.quantity || 1;

      // Handle non-stackable equipment with quantity > 1
      // Split into individual items to satisfy inventory store validation
      if (!stackable && quantity > 1) {
        // Add each equipment item separately
        for (let i = 0; i < quantity; i++) {
          const itemId = inventoryStore.addItem(characterId, {
            name: normalizedName,
            description: item.description,
            quantity: 1,
            stackable: false,
            categorization,
            acquisition: {
              method: item.acquisitionMethod || 'unknown',
              quantity: 1,
              sessionId,
              acquiredAt: now,
            },
          });

          // Trigger background image generation (fire and forget)
          if (itemId) {
            itemImageService.generateForItem(itemId, characterId).catch((error) => {
              console.warn(`Background image generation failed for item: ${normalizedName}`, error);
            });
          }
        }
      } else {
        if (stackable && existingMatch) {
          const newQuantity = (existingMatch.quantity || 0) + quantity;
          inventoryStore.updateItemQuantity(existingMatch.id, newQuantity);
          continue;
        }

        // Add item normally for stackable items or single equipment
        const itemId = inventoryStore.addItem(characterId, {
          name: normalizedName,
          description: item.description,
          quantity,
          stackable,
          categorization,
          acquisition: {
            method: item.acquisitionMethod || 'unknown',
            quantity,
            sessionId,
            acquiredAt: now,
          },
        });

        // Trigger background image generation (fire and forget)
        if (itemId) {
          itemImageService.generateForItem(itemId, characterId).catch((error) => {
            console.warn(`Background image generation failed for item: ${normalizedName}`, error);
          });
        }
      }
    } catch (err) {
      // Log error but continue processing remaining items
      console.error(`Failed to add item "${item.name}" to inventory:`, err);
    }
  }
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
