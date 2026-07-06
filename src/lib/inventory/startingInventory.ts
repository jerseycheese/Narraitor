// src/lib/inventory/startingInventory.ts

import type { EntityID } from '@/types/common.types';
import type { InventoryItemInput } from '@/types/inventory.types';
import { useInventoryStore } from '@/state/inventoryStore';
import { getTimestamp } from '@/lib/utils';

/**
 * Seeds a freshly created character's inventory with their archetype's
 * starting equipment. Items are tagged with the `starting-equipment`
 * acquisition method so journal/timeline views can distinguish them from
 * items earned in play. Items flagged `equipped` are equipped immediately.
 */
export function applyStartingInventory(
  characterId: EntityID,
  startingInventory: InventoryItemInput[] | undefined
): void {
  if (!startingInventory || startingInventory.length === 0) {
    return;
  }

  const store = useInventoryStore.getState();
  const acquiredAt = getTimestamp();

  startingInventory.forEach((input) => {
    const stackable = input.stackable ?? false;
    const quantity = input.quantity ?? 1;

    const itemId = store.addItem(characterId, {
      name: input.name,
      description: input.description,
      quantity,
      stackable,
      maxStack: input.maxStack,
      categorization: {
        categoryId: input.categoryId,
        source: 'system',
        classifiedAt: acquiredAt,
      },
      acquisition: {
        acquiredAt,
        method: 'starting-equipment',
        quantity,
      },
    });

    if (itemId && input.equipped) {
      store.updateItem(itemId, { equipped: true });
    }
  });
}
