import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeText, NORM_NAME, NORM_DESC, getTimestamp } from '@/lib/utils';
import { UserFriendlyError, ErrorType, createStoreError } from '@/lib/utils/errorUtils';
import { InventoryItem } from '../types/inventory.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { createIndexedDBStorage } from './persistence';
import { CrudStore } from './createCrudStore';

export interface InventoryStore extends CrudStore<InventoryItem> {
  items: Record<EntityID, InventoryItem>;
  characterInventories: Record<EntityID, EntityID[]>;
  error: UserFriendlyError | null;
  loading: boolean;

  // Core CRUD operations
  createItem: (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => EntityID;
  updateItem: (itemId: EntityID, updates: Partial<InventoryItem>) => void;
  deleteItem: (itemId: EntityID) => void;

  // Inventory-specific operations
  addItem: (characterId: EntityID, itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => EntityID;
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

const getInitialState = () => ({
  items: {} as Record<EntityID, InventoryItem>,
  entities: {} as Record<EntityID, InventoryItem>,
  characterInventories: {} as Record<EntityID, EntityID[]>,
  currentEntityId: null as EntityID | null,
  error: null as UserFriendlyError | null,
  loading: false,
});

const validateItemData = (data: Partial<InventoryItem>): void => {
  const normalizedName = normalizeText(data.name || '', NORM_NAME);
  if (!normalizedName) {
    throw new Error('Item name is required');
  }

  if (data.quantity !== undefined && data.quantity <= 0) {
    throw new Error('Item quantity must be greater than zero');
  }

  if (!data.categoryId) {
    throw new Error('Category ID is required');
  }

  if (data.stackable === undefined) {
    throw new Error('Stackable property is required');
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
        validateItemData(itemData);

        const itemId = generateUniqueId('item');
        const now = getTimestamp();

        const normalizedName = normalizeText(itemData.name, NORM_NAME);
        const normalizedDescription = normalizeText(itemData.description || '', NORM_DESC);

        const newItem: InventoryItem = {
          ...itemData,
          id: itemId,
          name: normalizedName,
          description: normalizedDescription,
          quantity: itemData.quantity ?? 1,
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
          set({ error: createStoreError('Item Not Found', 'The specified item could not be found.', ErrorType.VALIDATION) });
          return;
        }

        const normalizedUpdates: Partial<InventoryItem> = { ...updates };

        if (updates.name) {
          normalizedUpdates.name = normalizeText(updates.name, NORM_NAME);
        }

        if (updates.description) {
          normalizedUpdates.description = normalizeText(updates.description, NORM_DESC);
        }

        if (updates.quantity !== undefined && updates.quantity < 0) {
          set({ error: createStoreError('Invalid Quantity', 'Item quantity cannot be negative.', ErrorType.VALIDATION) });
          return;
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

      createItem: (itemData) => get().create(itemData),
      updateItem: (itemId, updates) => get().update(itemId, updates),
      deleteItem: (itemId) => get().delete(itemId),

      addItem: (characterId, itemData) => {
        try {
          validateItemData(itemData);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Invalid item data';
          set({ error: createStoreError('Validation Error', errorMessage, ErrorType.VALIDATION) });
          return '';
        }

        const state = get();
        const characterItems = state.characterInventories[characterId] || [];

        // Check if item is stackable and if a similar item already exists
        if (itemData.stackable) {
          const existingItemId = characterItems.find((id) => {
            const item = state.items[id];
            return (
              item &&
              item.name === normalizeText(itemData.name, NORM_NAME) &&
              item.categoryId === itemData.categoryId &&
              item.stackable
            );
          });

          if (existingItemId) {
            const existingItem = state.items[existingItemId];
            const newQuantity = existingItem.quantity + (itemData.quantity ?? 1);

            // Check max stack limit - use existing item's maxStack or fall back to itemData
            const maxStack = existingItem.maxStack ?? itemData.maxStack;
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

            get().update(existingItemId, { quantity: newQuantity });
            return existingItemId;
          }
        }

        // Create new item
        const itemId = get().create(itemData);

        // Add to character inventory
        set((state) => ({
          characterInventories: {
            ...state.characterInventories,
            [characterId]: [...(state.characterInventories[characterId] || []), itemId],
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
