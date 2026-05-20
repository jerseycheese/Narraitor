import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeText, NORM_NAME, NORM_DESC, getTimestamp } from '@/lib/utils';
import {
  UserFriendlyError,
  ErrorType,
  createStoreError,
} from '@/lib/utils/errorUtils';
import { logInventoryGuardSanitized } from '@/lib/inventory/inventoryTelemetry';
import {
  InventoryItem,
  InventoryItemCategorization,
  InventoryAcquisitionRecord,
  ItemUsageResult,
} from '@/types/inventory.types';
import { EntityID, GeneratedImage } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { createIndexedDBStorage } from './persistence';
import { CrudStore } from './createCrudStore';
import { isValidCategory } from '@/lib/inventory/categories';
import { createAcquisitionJournalEntry } from '@/lib/inventory/journalIntegration';
import {
  storeEvents,
  StoreEventTypes,
  type CharacterDeletedEvent,
} from '@/lib/state/storePubSub';

import Logger from '@/lib/utils/logger';
const logger = new Logger('InventoryStore');

export interface InventoryStore extends CrudStore<InventoryItem> {
  items: Record<EntityID, InventoryItem>;
  characterInventories: Record<EntityID, EntityID[]>;
  error: UserFriendlyError | null;
  loading: boolean;
  generatingImageFor: Set<EntityID>; // Track items with images being generated
  imageGenerationErrors: Map<EntityID, string>; // Track generation errors by item ID

  // Core CRUD operations
  createItem: (itemData: InventoryItemCreatePayload) => EntityID;
  updateItem: (itemId: EntityID, updates: Partial<InventoryItem>) => void;
  deleteItem: (itemId: EntityID) => void;

  // Inventory-specific operations
  addItem: (
    characterId: EntityID,
    itemData: InventoryItemAddPayload
  ) => EntityID;
  removeItem: (
    characterId: EntityID,
    itemId: EntityID,
    quantity?: number
  ) => void;
  updateItemQuantity: (itemId: EntityID, quantity: number) => void;
  getCharacterItems: (characterId: EntityID) => InventoryItem[];
  clearCharacterInventory: (characterId: EntityID) => void;
  useItem: (characterId: EntityID, itemId: EntityID) => ItemUsageResult;

  // Image generation tracking
  setGeneratingImage: (itemId: EntityID, isGenerating: boolean) => void;
  setImageGenerationError: (itemId: EntityID, error: string | null) => void;

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
  image?: GeneratedImage; // Optional AI-generated visual asset
}

export type InventoryItemAddPayload = Omit<
  InventoryItemCreatePayload,
  'categorization'
> & {
  categorization?: InventoryItemCategorization;
};

const getInitialState = () => ({
  items: {} as Record<EntityID, InventoryItem>,
  entities: {} as Record<EntityID, InventoryItem>,
  characterInventories: {} as Record<EntityID, EntityID[]>,
  currentEntityId: null as EntityID | null,
  error: null as UserFriendlyError | null,
  loading: false,
  generatingImageFor: new Set<EntityID>(),
  imageGenerationErrors: new Map<EntityID, string>(),
});

export const createInventoryInitialState = (): ReturnType<
  typeof getInitialState
> => getInitialState();

const sanitizeInventoryValue = (
  characterId: EntityID,
  value: unknown
): {
  ids: EntityID[];
  shouldPatch: boolean;
  shouldDelete: boolean;
} => {
  if (value === undefined) {
    return {
      ids: [],
      shouldPatch: false,
      shouldDelete: false,
    };
  }

  if (!Array.isArray(value)) {
    logInventoryGuardSanitized({
      characterId,
      reason: 'non-array',
      removedCount: 0,
    });
    return {
      ids: [],
      shouldPatch: true,
      shouldDelete: true,
    };
  }

  const filtered = value.filter(
    (id): id is EntityID => typeof id === 'string' && id.length > 0
  );
  const removedCount = value.length - filtered.length;

  if (removedCount > 0) {
    logInventoryGuardSanitized({
      characterId,
      reason: 'invalid-entries',
      removedCount,
    });
  }

  return {
    ids: filtered,
    shouldPatch: removedCount > 0,
    shouldDelete: false,
  };
};

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
    throw new Error(
      'Non-stackable items cannot have quantity greater than one'
    );
  }

  if (!data.categorization) {
    throw new Error('Categorization metadata is required');
  }

  if (!isValidCategory(data.categorization.categoryId)) {
    throw new Error(
      'Categorization must resolve to a standard inventory category'
    );
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

  // Validate optional image field if present
  if (data.image !== undefined) {
    if (typeof data.image !== 'object' || data.image === null) {
      throw new Error('Image must be a GeneratedImage object');
    }
    if (!data.image.type || (data.image.type !== 'ai-generated' && data.image.type !== 'placeholder')) {
      throw new Error('Image type must be "ai-generated" or "placeholder"');
    }
    if (data.image.url !== null && typeof data.image.url !== 'string') {
      throw new Error('Image URL must be a string or null');
    }
  }
};

/**
 * Creates a journal entry for an item acquisition.
 * Requires sessionId to be present in the acquisition record.
 * Gets worldId from the session store.
 */
const createJournalEntryForAcquisition = async (
  item: InventoryItem,
  sessionId: EntityID,
  characterId: EntityID
): Promise<void> => {
  try {
    // Dynamically import stores to avoid circular dependencies
    const { useJournalStore } = await import('./journalStore');
    const { useSessionStore } = await import('./sessionStore');

    const sessionStore = useSessionStore.getState();
    const journalStore = useJournalStore.getState();

    // Get worldId from session store
    const worldId = sessionStore.worldId;

    if (!worldId) {
      // No worldId available - skip journal entry creation
      return;
    }

    // Create journal entry using the helper
    const journalEntry = createAcquisitionJournalEntry(
      item,
      worldId,
      characterId
    );

    // Add entry to journal store
    journalStore.addEntry(sessionId, journalEntry);
  } catch (error) {
    // Silently fail journal entry creation - don't block inventory operations
    logger.warn('Failed to create journal entry for item acquisition:', error);
  }
};

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => {
      const ensureCharacterInventory = (
        characterId: EntityID,
        snapshot = get()
      ): EntityID[] => {
        const raw = snapshot.characterInventories[characterId];
        const { ids, shouldPatch, shouldDelete } = sanitizeInventoryValue(
          characterId,
          raw
        );

        if (shouldPatch) {
          set((state) => {
            const nextInventories = { ...state.characterInventories };
            if (shouldDelete) {
              delete nextInventories[characterId];
            } else {
              nextInventories[characterId] = ids;
            }
            return { characterInventories: nextInventories };
          });
        }

        if (shouldDelete) {
          return [];
        }

        return ids;
      };

      return {
        ...getInitialState(),
        create: (itemData) => {
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

        setCurrent: (id) => {
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

        getById: (id) => get().items[id],
        getAll: () => Object.values(get().items),

        reset: () => set(getInitialState()),

        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        setLoading: (loading) => set({ loading }),

        setGeneratingImage: (itemId, isGenerating) => {
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

        setImageGenerationError: (itemId, error) => {
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

        createItem: (itemData) => {
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

          const itemDraft: Omit<
            InventoryItem,
            'id' | 'createdAt' | 'updatedAt'
          > = {
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

          const categorization: InventoryItemCategorization = {
            ...itemData.categorization,
            classifiedAt: itemData.categorization.classifiedAt ?? now,
          };

          const itemDraft: Omit<
            InventoryItem,
            'id' | 'createdAt' | 'updatedAt'
          > = {
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

        removeItem: (characterId, itemId, quantity) => {
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

        updateItemQuantity: (itemId, quantity) => {
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

        getCharacterItems: (characterId) => {
          const state = get();
          const itemIds = ensureCharacterInventory(characterId, state);
          return itemIds
            .map((id) => state.items[id])
            .filter((item): item is InventoryItem => Boolean(item));
        },

        clearCharacterInventory: (characterId) => {
          const itemIds = ensureCharacterInventory(characterId);
          itemIds.forEach((itemId) => get().delete(itemId));
        },

        useItem: (characterId, itemId) => {
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
      };
    },
    {
      name: 'narraitor-inventory-store',
      storage: createIndexedDBStorage(),
      version: 3, // Incremented to clear old migrated data
      partialize: (state) => ({
        items: state.items,
        entities: state.entities,
        characterInventories: state.characterInventories,
      }),
      migrate: (persistedState) => persistedState || getInitialState(), // Preserve data, only clear if null
    }
  )
);

// Expose store globally in development for easier debugging & manual seeding
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  window.useInventoryStore = useInventoryStore;
}

// Subscribe to store events
storeEvents.subscribe<CharacterDeletedEvent>(
  StoreEventTypes.CHARACTER_DELETED,
  ({ characterId }) => {
    useInventoryStore.getState().clearCharacterInventory(characterId);
  }
);
