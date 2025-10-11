import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeText, NORM_NAME, NORM_DESC, getTimestamp } from '@/lib/utils';
import { UserFriendlyError, ErrorType, createStoreError } from '@/lib/utils/errorUtils';
import {
  InventoryItem,
  InventoryItemCategorization,
  InventoryAcquisitionRecord,
} from '@/types/inventory.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { createIndexedDBStorage } from './persistence';
import { CrudStore } from './createCrudStore';
import { isValidCategory } from '@/lib/inventory/categories';

export interface InventoryStore extends CrudStore<InventoryItem> {
  items: Record<EntityID, InventoryItem>;
  characterInventories: Record<EntityID, EntityID[]>;
  error: UserFriendlyError | null;
  loading: boolean;

  // Core CRUD operations
  createItem: (itemData: InventoryItemCreatePayload) => EntityID;
  updateItem: (itemId: EntityID, updates: Partial<InventoryItem>) => void;
  deleteItem: (itemId: EntityID) => void;

  // Inventory-specific operations
  addItem: (characterId: EntityID, itemData: InventoryItemAddPayload) => EntityID;
  removeItem: (characterId: EntityID, itemId: EntityID, quantity?: number) => void;
  updateItemQuantity: (itemId: EntityID, quantity: number) => void;
  getCharacterItems: (characterId: EntityID) => InventoryItem[];
  clearCharacterInventory: (characterId: EntityID) => void;

  // State management
  reset: () => void;
  setError: (error: UserFriendlyError | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export interface InventoryItemCreatePayload {
  name: string;
  description?: string;
  quantity?: number;
  stackable: boolean;
  maxStack?: number;
  categorization: InventoryItemCategorization;
  acquisition: InventoryAcquisitionRecord;
}

export type InventoryItemAddPayload = Omit<InventoryItemCreatePayload, 'categorization'> & {
  categorization?: InventoryItemCategorization;
};

const getInitialState = () => ({
  items: {} as Record<EntityID, InventoryItem>,
  // `entities` mirrors `items` so stores sharing the CrudStore interface keep IndexedDB migrations intact.
  // See migrate() below where we recompute entities after persistence rehydration.
  entities: {} as Record<EntityID, InventoryItem>,
  characterInventories: {} as Record<EntityID, EntityID[]>,
  currentEntityId: null as EntityID | null,
  error: null as UserFriendlyError | null,
  loading: false,
});

const validateNewItemData = (data: InventoryItemCreatePayload): void => {
  const normalizedName = normalizeText(data.name || '', NORM_NAME);
  if (!normalizedName) {
    throw new Error('Item name is required');
  }

  const quantity = data.quantity ?? data.acquisition.quantity ?? 1;
  if (quantity <= 0) {
    throw new Error('Item quantity must be greater than zero');
  }

  if (!data.stackable && quantity > 1) {
    throw new Error('Non-stackable items cannot have quantity greater than one');
  }

  if (!data.categorization) {
    throw new Error('Categorization metadata is required');
  }

  if (!isValidCategory(data.categorization.categoryId)) {
    throw new Error('Categorization must resolve to a standard inventory category');
  }

  if (!data.acquisition) {
    throw new Error('Acquisition metadata is required');
  }

  const acquisitionQuantity = data.acquisition.quantity ?? quantity;
  if (acquisitionQuantity <= 0) {
    throw new Error('Acquisition quantity must be greater than zero');
  }

  if (data.maxStack !== undefined && data.maxStack <= 0) {
    throw new Error('Max stack size must be greater than zero');
  }
};

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      create: (itemData) => {
        const itemId = generateUniqueId('item');
        const now = getTimestamp();

        const normalizedName = normalizeText(itemData.name, NORM_NAME);
        const normalizedDescription = normalizeText(itemData.description || '', NORM_DESC);

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

      update: (itemId, updates) => {
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
          normalizedUpdates.description = normalizeText(updates.description, NORM_DESC);
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
            classifiedAt: updates.categorization.classifiedAt ?? getTimestamp(),
          };
          normalizedUpdates.categoryId = normalizedUpdates.categorization.categoryId;
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

      delete: (itemId) => {
        const existingItem = get().items[itemId];
        if (!existingItem) {
          return;
        }

        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [itemId]: _removedItem, ...remainingItems } = state.items;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [itemId]: _removedEntity, ...remainingEntities } = state.entities;

          // Remove item from all character inventories
          const updatedCharacterInventories = { ...state.characterInventories };
          Object.keys(updatedCharacterInventories).forEach((characterId) => {
            updatedCharacterInventories[characterId] = updatedCharacterInventories[characterId].filter(
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
            currentEntityId: state.currentEntityId === itemId ? null : state.currentEntityId,
            error: null,
          };
        });
      },

      setCurrent: (id) => {
        if (id && !get().items[id]) {
          set({
            error: createStoreError('Item Not Found', 'The specified item could not be found.', ErrorType.VALIDATION),
            currentEntityId: null,
          });
          return;
        }

        set({ currentEntityId: id ?? null, error: null });
      },

      getById: (id) => get().items[id],
      getAll: () => Object.values(get().items),

      reset: () => set(getInitialState()),

      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ loading }),

      createItem: (itemData) => {
        try {
          validateNewItemData(itemData);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Invalid item data';
          set({
            error: createStoreError('Validation Error', errorMessage, ErrorType.VALIDATION),
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
        };

        return get().create(itemDraft);
      },
      updateItem: (itemId, updates) => get().update(itemId, updates),
      deleteItem: (itemId) => get().delete(itemId),

      addItem: (characterId, itemData) => {
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
        const quantityToAdd =
          itemData.quantity ?? acquisition.quantity ?? 1;

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
        const characterItems = state.characterInventories[characterId] || [];

        if (itemData.stackable) {
          const existingItemId = characterItems.find((id) => {
            const item = state.items[id];
            if (!item) {
              return false;
            }

            if (item.name !== normalizedName) {
              return false;
            }

            if (itemData.categorization && item.categoryId !== itemData.categorization.categoryId) {
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
                acquisitionHistory: [...targetItem.acquisitionHistory, acquisitionRecord],
                categorization: nextCategorization,
                categoryId: nextCategorization.categoryId,
              };

              return {
                items: { ...currentState.items, [existingItemId]: nextItem },
                entities: { ...currentState.entities, [existingItemId]: nextItem },
                error: null,
              };
            });

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
        };

        try {
          validateNewItemData(newItemPayload);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Invalid item data';
          set({
            error: createStoreError('Validation Error', errorMessage, ErrorType.VALIDATION),
          });
          return '';
        }

        const acquisitionRecord: InventoryAcquisitionRecord = {
          ...acquisition,
          acquiredAt: acquisition.acquiredAt ?? now,
          quantity: acquisition.quantity ?? quantityToAdd,
        };

        const categorization: InventoryItemCategorization = {
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
        };

        const itemId = get().create(itemDraft);

        set((currentState) => ({
          characterInventories: {
            ...currentState.characterInventories,
            [characterId]: [...(currentState.characterInventories[characterId] || []), itemId],
          },
        }));

        return itemId;
      },

      removeItem: (characterId, itemId, quantity) => {
        const state = get();
        const item = state.items[itemId];

        if (!item) {
          set({ error: createStoreError('Item Not Found', 'The specified item could not be found.', ErrorType.VALIDATION) });
          return;
        }

        const characterItems = state.characterInventories[characterId] || [];
        if (!characterItems.includes(itemId)) {
          set({
            error: createStoreError(
              'Item Not In Inventory',
              'The specified item is not in this character\'s inventory.',
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

      updateItemQuantity: (itemId, quantity) => {
        const item = get().items[itemId];

        if (!item) {
          set({ error: createStoreError('Item Not Found', 'The specified item could not be found.', ErrorType.VALIDATION) });
          return;
        }

        if (quantity <= 0) {
          set({ error: createStoreError('Invalid Quantity', 'Item quantity must be greater than zero.', ErrorType.VALIDATION) });
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

      getCharacterItems: (characterId) => {
        const state = get();
        const itemIds = state.characterInventories[characterId] || [];
        return itemIds
          .map((id) => state.items[id])
          .filter((item): item is InventoryItem => Boolean(item));
      },

      clearCharacterInventory: (characterId) => {
        const itemIds = get().characterInventories[characterId] || [];
        itemIds.forEach((itemId) => get().delete(itemId));
      },
    }),
    {
      name: 'narraitor-inventory-store',
      storage: createIndexedDBStorage(),
      version: 1,
      partialize: (state) => ({
        items: state.items,
        entities: state.entities,
        characterInventories: state.characterInventories,
      }),
      onRehydrateStorage: () => (state) => {
        // Ensure entities is always in sync with items after hydration
        if (state && state.items) {
          state.entities = { ...state.items };
        }
      },
      migrate: (persistedState: unknown) => {
        if (persistedState && typeof persistedState === 'object' && 'items' in persistedState) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const state = persistedState as any;
          if (state.items && typeof state.items === 'object') {
            state.entities = { ...state.items };
          }
          if (typeof state.error === 'string') {
            state.error = createStoreError(state.error, state.error, ErrorType.UNKNOWN);
          }
          if (typeof state.loading !== 'boolean') {
            state.loading = false;
          }
        }
        return persistedState as InventoryStore;
      },
    }
  )
);
