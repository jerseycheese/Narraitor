import { normalizeText, NORM_NAME, getTimestamp } from '@/lib/utils';
import { ErrorType, createStoreError } from '@/lib/utils/errorUtils';
import { InventoryItem, InventoryAcquisitionRecord } from '@/types/inventory.types';
import {
  createEnsureCharacterInventory,
  createJournalEntryForAcquisition,
  validateNewItemData,
} from './inventoryStore.helpers';
import type {
  InventoryItemAddPayload,
  InventoryItemCreatePayload,
  InventoryStoreSet,
  InventoryStoreGet,
} from './inventoryStore.types';

/**
 * Character-inventory action factory: adding/removing items from a specific
 * character's inventory, including stacking behavior and the
 * character-scoped queries.
 */
export const createCharacterInventoryActions = (
  set: InventoryStoreSet,
  get: InventoryStoreGet
) => {
  const ensureCharacterInventory = createEnsureCharacterInventory(set, get);

  return {
    addItem: (characterId: string, itemData: InventoryItemAddPayload) => {
      const acquisition = itemData.acquisition;

      if (!acquisition) {
        set({
          error: createStoreError(
            'Acquisition Missing',
            'Unable to add item without acquisition metadata.',
            ErrorType.VALIDATION
          ),
        });
        return '';
      }

      const now = getTimestamp();
      const quantityToAdd = itemData.quantity ?? acquisition.quantity ?? 1;

      if (quantityToAdd <= 0) {
        set({
          error: createStoreError(
            'Invalid Quantity',
            'Item quantity must be greater than zero.',
            ErrorType.VALIDATION
          ),
        });
        return '';
      }

      const normalizedName = normalizeText(itemData.name, NORM_NAME);
      const state = get();
      const characterItems = ensureCharacterInventory(characterId, state);

      if (itemData.stackable) {
        const existingItemId = characterItems.find((id) => {
          const item = state.items[id];
          if (!item) {
            return false;
          }

          if (item.name !== normalizedName) {
            return false;
          }

          if (
            itemData.categorization &&
            item.categoryId !== itemData.categorization.categoryId
          ) {
            return false;
          }

          return true;
        });

        if (existingItemId) {
          const existingItem = state.items[existingItemId];
          const maxStack = existingItem.maxStack ?? itemData.maxStack;
          const newQuantity = existingItem.quantity + quantityToAdd;

          if (maxStack && newQuantity > maxStack) {
            set({
              error: createStoreError(
                'Stack Limit Exceeded',
                `Cannot add more items. Maximum stack size is ${maxStack}.`,
                ErrorType.VALIDATION
              ),
            });
            return existingItemId;
          }

          const acquisitionRecord: InventoryAcquisitionRecord = {
            ...acquisition,
            acquiredAt: acquisition.acquiredAt ?? now,
            quantity: acquisition.quantity ?? quantityToAdd,
          };

          set((currentState) => {
            const targetItem = currentState.items[existingItemId];
            if (!targetItem) {
              return currentState;
            }

            const nextCategorization = itemData.categorization
              ? {
                  ...targetItem.categorization,
                  ...itemData.categorization,
                  classifiedAt: itemData.categorization.classifiedAt ?? now,
                }
              : targetItem.categorization;

            const nextItem: InventoryItem = {
              ...targetItem,
              quantity: newQuantity,
              maxStack: maxStack ?? targetItem.maxStack,
              updatedAt: now,
              acquisitionHistory: [
                ...targetItem.acquisitionHistory,
                acquisitionRecord,
              ],
              categorization: nextCategorization,
              categoryId: nextCategorization.categoryId,
            };

            return {
              items: { ...currentState.items, [existingItemId]: nextItem },
              entities: {
                ...currentState.entities,
                [existingItemId]: nextItem,
              },
              error: null,
            };
          });

          // Create journal entry for stacked item acquisition if sessionId provided
          if (acquisition.sessionId) {
            const updatedItem = get().items[existingItemId];
            if (updatedItem) {
              void createJournalEntryForAcquisition(
                updatedItem,
                acquisition.sessionId,
                characterId
              );
            }
          }

          return existingItemId;
        }
      }

      if (!itemData.categorization) {
        set({
          error: createStoreError(
            'Categorization Missing',
            'Unable to add new item without categorization metadata.',
            ErrorType.VALIDATION
          ),
        });
        return '';
      }

      const newItemPayload: InventoryItemCreatePayload = {
        name: itemData.name,
        description: itemData.description,
        stackable: itemData.stackable,
        maxStack: itemData.maxStack,
        quantity: quantityToAdd,
        categorization: itemData.categorization,
        acquisition,
        ...(itemData.image && { image: itemData.image }), // Include image if present
      };

      try {
        validateNewItemData(newItemPayload);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Invalid item data';
        set({
          error: createStoreError(
            'Validation Error',
            errorMessage,
            ErrorType.VALIDATION
          ),
        });
        return '';
      }

      const acquisitionRecord: InventoryAcquisitionRecord = {
        ...acquisition,
        acquiredAt: acquisition.acquiredAt ?? now,
        quantity: acquisition.quantity ?? quantityToAdd,
      };

      const categorization = {
        ...itemData.categorization,
        classifiedAt: itemData.categorization.classifiedAt ?? now,
      };

      const itemDraft: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'> = {
        name: newItemPayload.name,
        description: newItemPayload.description ?? '',
        stackable: newItemPayload.stackable,
        maxStack: newItemPayload.maxStack,
        quantity: quantityToAdd,
        categoryId: categorization.categoryId,
        acquisitionHistory: [acquisitionRecord],
        categorization,
        ...(newItemPayload.image && { image: newItemPayload.image }), // Include image if present
      };

      const itemId = get().create(itemDraft);

      set((currentState) => ({
        characterInventories: {
          ...currentState.characterInventories,
          [characterId]: [...characterItems, itemId],
        },
      }));

      // Create journal entry for new item acquisition if sessionId provided
      if (acquisition.sessionId) {
        const newItem = get().items[itemId];
        if (newItem) {
          void createJournalEntryForAcquisition(
            newItem,
            acquisition.sessionId,
            characterId
          );
        }
      }

      return itemId;
    },

    removeItem: (characterId: string, itemId: string, quantity?: number) => {
      const state = get();
      const item = state.items[itemId];

      if (!item) {
        set({
          error: createStoreError(
            'Item Not Found',
            'The specified item could not be found.',
            ErrorType.VALIDATION
          ),
        });
        return;
      }

      const characterItems = ensureCharacterInventory(characterId, state);
      if (!characterItems.includes(itemId)) {
        set({
          error: createStoreError(
            'Item Not In Inventory',
            "The specified item is not in this character's inventory.",
            ErrorType.VALIDATION
          ),
        });
        return;
      }

      const removeQuantity = quantity ?? item.quantity;

      if (removeQuantity > item.quantity) {
        set({
          error: createStoreError(
            'Insufficient Quantity',
            `Cannot remove ${removeQuantity} items. Only ${item.quantity} available.`,
            ErrorType.VALIDATION
          ),
        });
        return;
      }

      if (removeQuantity === item.quantity) {
        // Remove entire item
        get().delete(itemId);
      } else {
        // Update quantity
        get().update(itemId, { quantity: item.quantity - removeQuantity });
      }
    },

    updateItemQuantity: (itemId: string, quantity: number) => {
      const item = get().items[itemId];

      if (!item) {
        set({
          error: createStoreError(
            'Item Not Found',
            'The specified item could not be found.',
            ErrorType.VALIDATION
          ),
        });
        return;
      }

      if (quantity <= 0) {
        set({
          error: createStoreError(
            'Invalid Quantity',
            'Item quantity must be greater than zero.',
            ErrorType.VALIDATION
          ),
        });
        return;
      }

      if (item.maxStack && quantity > item.maxStack) {
        set({
          error: createStoreError(
            'Stack Limit Exceeded',
            `Quantity cannot exceed maximum stack size of ${item.maxStack}.`,
            ErrorType.VALIDATION
          ),
        });
        return;
      }

      get().update(itemId, { quantity });
    },

    getCharacterItems: (characterId: string) => {
      const state = get();
      const itemIds = ensureCharacterInventory(characterId, state);
      return itemIds
        .map((id) => state.items[id])
        .filter((item): item is InventoryItem => Boolean(item));
    },

    clearCharacterInventory: (characterId: string) => {
      const itemIds = ensureCharacterInventory(characterId);
      itemIds.forEach((itemId) => get().delete(itemId));
    },
  };
};
