import { normalizeText, NORM_NAME, NORM_DESC, getTimestamp } from '@/lib/utils';
import { ErrorType, createStoreError } from '@/lib/utils/errorUtils';
import {
  InventoryItem,
  InventoryItemCategorization,
  InventoryAcquisitionRecord,
} from '@/types/inventory.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { isValidCategory } from '@/lib/inventory/categories';
import { validateNewItemData } from './inventoryStore.helpers';
import type {
  InventoryItemCreatePayload,
  InventoryStoreSet,
  InventoryStoreGet,
} from './inventoryStore.types';

/**
 * Core CRUD action factory: the generic create/update/delete/query
 * operations required by CrudStore<InventoryItem>, plus the domain-named
 * createItem/updateItem/deleteItem wrappers and image-generation tracking.
 */
export const createInventoryCrudActions = (
  set: InventoryStoreSet,
  get: InventoryStoreGet
) => ({
  create: (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const itemId = generateUniqueId('item');
    const now = getTimestamp();

    const normalizedName = normalizeText(itemData.name, NORM_NAME);
    const normalizedDescription = normalizeText(
      itemData.description || '',
      NORM_DESC
    );

    const newItem: InventoryItem = {
      ...itemData,
      id: itemId,
      name: normalizedName,
      description: normalizedDescription,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      items: { ...state.items, [itemId]: newItem },
      entities: { ...state.entities, [itemId]: newItem },
      error: null,
    }));

    return itemId;
  },

  update: (itemId: string, updates: Partial<InventoryItem>) => {
    const existingItem = get().items[itemId];
    if (!existingItem) {
      set({
        error: createStoreError(
          'Item Not Found',
          'The specified item could not be found.',
          ErrorType.VALIDATION
        ),
      });
      return;
    }

    const normalizedUpdates: Partial<InventoryItem> = {};

    if (updates.name) {
      normalizedUpdates.name = normalizeText(updates.name, NORM_NAME);
    }

    if (updates.description) {
      normalizedUpdates.description = normalizeText(
        updates.description,
        NORM_DESC
      );
    }

    if (updates.maxStack !== undefined && updates.maxStack <= 0) {
      set({
        error: createStoreError(
          'Invalid Max Stack',
          'Max stack size must be greater than zero.',
          ErrorType.VALIDATION
        ),
      });
      return;
    } else if (updates.maxStack !== undefined) {
      normalizedUpdates.maxStack = updates.maxStack;
    }

    if (updates.quantity !== undefined) {
      if (updates.quantity < 0) {
        set({
          error: createStoreError(
            'Invalid Quantity',
            'Item quantity cannot be negative.',
            ErrorType.VALIDATION
          ),
        });
        return;
      }

      const maxStack = updates.maxStack ?? existingItem.maxStack;
      if (maxStack && updates.quantity > maxStack) {
        set({
          error: createStoreError(
            'Stack Limit Exceeded',
            `Quantity cannot exceed maximum stack size of ${maxStack}.`,
            ErrorType.VALIDATION
          ),
        });
        return;
      }

      normalizedUpdates.quantity = updates.quantity;
    }

    if (updates.categorization) {
      if (!isValidCategory(updates.categorization.categoryId)) {
        set({
          error: createStoreError(
            'Invalid Category',
            'Categorization must use a standard inventory category.',
            ErrorType.VALIDATION
          ),
        });
        return;
      }

      normalizedUpdates.categorization = {
        ...existingItem.categorization,
        ...updates.categorization,
        classifiedAt:
          updates.categorization.classifiedAt ?? getTimestamp(),
      };
      normalizedUpdates.categoryId =
        normalizedUpdates.categorization.categoryId;
    } else if (updates.categoryId) {
      if (!isValidCategory(updates.categoryId)) {
        set({
          error: createStoreError(
            'Invalid Category',
            'Categorization must use a standard inventory category.',
            ErrorType.VALIDATION
          ),
        });
        return;
      }
      normalizedUpdates.categoryId = updates.categoryId;
      normalizedUpdates.categorization = {
        ...existingItem.categorization,
        categoryId: updates.categoryId,
        classifiedAt: getTimestamp(),
        source: 'manual',
      };
    }

    if (updates.acquisitionHistory) {
      normalizedUpdates.acquisitionHistory = updates.acquisitionHistory;
    }

    if ('image' in updates) {
      normalizedUpdates.image = updates.image;
    }

    if ('equipped' in updates) {
      normalizedUpdates.equipped = updates.equipped;
    }

    const now = getTimestamp();
    const updatedItem: InventoryItem = {
      ...existingItem,
      ...normalizedUpdates,
      updatedAt: now,
    };

    set((state) => ({
      items: { ...state.items, [itemId]: updatedItem },
      entities: { ...state.entities, [itemId]: updatedItem },
      error: null,
    }));
  },

  delete: (itemId: string) => {
    const existingItem = get().items[itemId];
    if (!existingItem) {
      return;
    }

    set((state) => {
      const { [itemId]: _removedItem, ...remainingItems } = state.items;
      const { [itemId]: _removedEntity, ...remainingEntities } =
        state.entities;

      // Remove item from all character inventories
      const updatedCharacterInventories = {
        ...state.characterInventories,
      };
      Object.keys(updatedCharacterInventories).forEach((characterId) => {
        updatedCharacterInventories[characterId] =
          updatedCharacterInventories[characterId].filter(
            (id) => id !== itemId
          );
        if (updatedCharacterInventories[characterId].length === 0) {
          delete updatedCharacterInventories[characterId];
        }
      });

      return {
        items: remainingItems,
        entities: remainingEntities,
        characterInventories: updatedCharacterInventories,
        currentEntityId:
          state.currentEntityId === itemId ? null : state.currentEntityId,
        error: null,
      };
    });
  },

  setCurrent: (id: string | null) => {
    if (id && !get().items[id]) {
      set({
        error: createStoreError(
          'Item Not Found',
          'The specified item could not be found.',
          ErrorType.VALIDATION
        ),
        currentEntityId: null,
      });
      return;
    }

    set({ currentEntityId: id ?? null, error: null });
  },

  getById: (id: string) => get().items[id],
  getAll: () => Object.values(get().items),

  setGeneratingImage: (itemId: string, isGenerating: boolean) => {
    set((state) => {
      const newGeneratingSet = new Set(state.generatingImageFor);
      if (isGenerating) {
        newGeneratingSet.add(itemId);
      } else {
        newGeneratingSet.delete(itemId);
      }
      return { generatingImageFor: newGeneratingSet };
    });
  },

  setImageGenerationError: (itemId: string, error: string | null) => {
    set((state) => {
      const newErrorsMap = new Map(state.imageGenerationErrors);
      if (error) {
        newErrorsMap.set(itemId, error);
      } else {
        newErrorsMap.delete(itemId);
      }
      return { imageGenerationErrors: newErrorsMap };
    });
  },

  createItem: (itemData: InventoryItemCreatePayload) => {
    try {
      validateNewItemData(itemData);
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

    const now = getTimestamp();
    const acquisitionRecord: InventoryAcquisitionRecord = {
      ...itemData.acquisition,
      acquiredAt: itemData.acquisition.acquiredAt ?? now,
      quantity: itemData.acquisition.quantity ?? itemData.quantity ?? 1,
    };

    const categorization: InventoryItemCategorization = {
      ...itemData.categorization,
      classifiedAt: itemData.categorization.classifiedAt ?? now,
    };

    const itemDraft: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'> = {
      name: itemData.name,
      description: itemData.description ?? '',
      quantity: itemData.quantity ?? acquisitionRecord.quantity,
      stackable: itemData.stackable,
      maxStack: itemData.maxStack,
      categoryId: categorization.categoryId,
      acquisitionHistory: [acquisitionRecord],
      categorization,
      ...(itemData.image && { image: itemData.image }), // Include image if present
    };

    return get().create(itemDraft);
  },
  updateItem: (itemId: string, updates: Partial<InventoryItem>) =>
    get().update(itemId, updates),
  deleteItem: (itemId: string) => get().delete(itemId),
});
