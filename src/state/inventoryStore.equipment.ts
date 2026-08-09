import { ErrorType, createStoreError } from '@/lib/utils/errorUtils';
import { canEquipItem } from '@/lib/inventory/equippable';
import { createEnsureCharacterInventory } from './inventoryStore.helpers';
import type { InventoryStoreSet, InventoryStoreGet } from './inventoryStore.types';

/**
 * Equipment action factory: item usage (consuming stackables/consumables)
 * and the equip/unequip toggle, including equip-eligibility checks.
 */
export const createEquipmentActions = (
  set: InventoryStoreSet,
  get: InventoryStoreGet
) => {
  const ensureCharacterInventory = createEnsureCharacterInventory(set, get);

  return {
    useItem: (characterId: string, itemId: string) => {
      const state = get();
      const item = state.items[itemId];

      // Validate item exists
      if (!item) {
        const error = createStoreError(
          'Item Not Found',
          'The specified item could not be found.',
          ErrorType.VALIDATION
        );
        set({ error });
        return {
          success: false,
          error: {
            type: error.type,
            title: error.title,
            message: error.message,
          },
        };
      }

      // Validate character owns this item
      const characterItems = ensureCharacterInventory(characterId, state);
      if (!characterItems.includes(itemId)) {
        const error = createStoreError(
          'Item Not Available',
          'This item is not in your inventory.',
          ErrorType.VALIDATION
        );
        set({ error });
        return {
          success: false,
          error: {
            type: error.type,
            title: error.title,
            message: error.message,
          },
        };
      }

      // Validate item has quantity > 0
      if (item.quantity <= 0) {
        const error = createStoreError(
          'Item Not Available',
          'This item is no longer available.',
          ErrorType.VALIDATION
        );
        set({ error });
        return {
          success: false,
          error: {
            type: error.type,
            title: error.title,
            message: error.message,
          },
        };
      }

      // Determine if item usage should consume quantity.
      // Items explicitly categorized as consumables always consume.
      // Additionally, stackable items are treated as consumables so quantities decrement on use.
      const shouldConsume =
        item.categoryId === 'consumables' || item.stackable;
      let wasConsumed = false;
      let remainingQuantity = item.quantity;

      const previousQuantity = item.quantity;

      if (shouldConsume) {
        wasConsumed = true;
        if (item.quantity === 1) {
          // Remove the entire item
          get().delete(itemId);
          remainingQuantity = 0;
        } else {
          // Reduce quantity by 1
          get().update(itemId, { quantity: item.quantity - 1 });
          remainingQuantity = item.quantity - 1;
        }
      }

      return {
        success: true,
        itemName: item.name,
        categoryId: item.categoryId,
        wasConsumed,
        remainingQuantity,
        previousQuantity,
      };
    },

    toggleEquipItem: (characterId: string, itemId: string) => {
      const state = get();
      const item = state.items[itemId];

      if (!item) {
        const error = createStoreError(
          'Item Not Found',
          'The specified item could not be found.',
          ErrorType.VALIDATION
        );
        set({ error });
        return {
          success: false,
          error: {
            type: error.type,
            title: error.title,
            message: error.message,
          },
        };
      }

      const characterItems = ensureCharacterInventory(characterId, state);
      if (!characterItems.includes(itemId)) {
        const error = createStoreError(
          'Item Not In Inventory',
          "The specified item is not in this character's inventory.",
          ErrorType.VALIDATION
        );
        set({ error });
        return {
          success: false,
          error: {
            type: error.type,
            title: error.title,
            message: error.message,
          },
        };
      }

      // Unequipping is always allowed; equipping is gated by compatibility.
      const nextEquipped = !item.equipped;
      if (nextEquipped) {
        const eligibility = canEquipItem(item);
        if (!eligibility.allowed) {
          const error = createStoreError(
            'Cannot Equip Item',
            eligibility.reason ?? 'This item cannot be equipped.',
            ErrorType.VALIDATION
          );
          set({ error });
          return {
            success: false,
            equipped: item.equipped ?? false,
            error: {
              type: error.type,
              title: error.title,
              message: error.message,
            },
          };
        }
      }

      get().update(itemId, { equipped: nextEquipped });

      return {
        success: true,
        equipped: nextEquipped,
      };
    },
  };
};
