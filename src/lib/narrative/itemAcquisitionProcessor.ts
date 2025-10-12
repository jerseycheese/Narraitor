// src/lib/narrative/itemAcquisitionProcessor.ts

import { useInventoryStore } from '@/state/inventoryStore';
import { categorizeInventoryItemClient } from '@/lib/inventory/categorizeInventoryItemClient';
import { getTimestamp } from '@/lib/utils';
import type { AcquiredItemMetadata } from '@/types/narrative.types';
import type { EntityID } from '@/types/common.types';
import type { InventoryItemCategorization } from '@/types/inventory.types';

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
      // Use AI to categorize the item
      let categorization: InventoryItemCategorization;

      try {
        const aiCategorization = await categorizeInventoryItemClient(
          item.name,
          item.description || ''
        );

        categorization = {
          ...aiCategorization,
          classifiedAt: now,
        };
      } catch (error) {
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

      // Add item to inventory using existing store method
      // This automatically handles journal integration via existing logic
      inventoryStore.addItem(characterId, {
        name: item.name,
        description: item.description,
        quantity: item.quantity || 1,
        stackable,
        categorization,
        acquisition: {
          method: item.acquisitionMethod || 'unknown',
          quantity: item.quantity || 1,
          sessionId,
          acquiredAt: now,
        },
      });
    } catch (error) {
      // Log error but continue processing remaining items
      console.error(`Failed to add item "${item.name}" to inventory:`, error);
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
