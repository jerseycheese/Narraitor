import { create } from 'zustand';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { safeTrim, getTimestamp } from '@/lib/utils';
import { UserFriendlyError, ErrorType } from '@/lib/utils/errorUtils';
import { CrudStore } from './createCrudStore';

export interface InventoryItem {
  id: EntityID;
  characterId: EntityID;
  name: string;
  category: string;
  quantity: number;
  weight: number;
  value: number;
  equipped: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryStore extends CrudStore<InventoryItem> {
  items: Record<EntityID, InventoryItem>;
  characterInventories: Record<EntityID, EntityID[]>;
  error: UserFriendlyError | null;
  loading: boolean;

  addItem: (characterId: EntityID, item: Omit<InventoryItem, 'id' | 'characterId' | 'createdAt' | 'updatedAt'>) => EntityID;
  updateItem: (itemId: EntityID, updates: Partial<Omit<InventoryItem, 'id' | 'createdAt'>> & { createdAt?: string }) => void;
  removeItem: (itemId: EntityID) => void;
  transferItem: (itemId: EntityID, toCharacterId: EntityID) => void;

  getCharacterItems: (characterId: EntityID) => InventoryItem[];
  getEquippedItems: (characterId: EntityID) => InventoryItem[];
  calculateTotalWeight: (characterId: EntityID) => number;
}

const getInitialState = () => ({
  items: {} as Record<EntityID, InventoryItem>,
  entities: {} as Record<EntityID, InventoryItem>,
  characterInventories: {} as Record<EntityID, EntityID[]>,
  currentEntityId: null as EntityID | null,
  error: null as UserFriendlyError | null,
  loading: false,
});

const createInventoryError = (
  title: string,
  message: string,
  type: ErrorType = ErrorType.VALIDATION,
  retryable = false
): UserFriendlyError => ({
  title,
  message,
  retryable,
  type,
});

export const useInventoryStore = create<InventoryStore>()((set, get) => ({
  ...getInitialState(),

  create: (data) => {
    if (!data.name || safeTrim(data.name) === '') {
      throw new Error('Item name is required');
    }

    const itemId = generateUniqueId('item');
    const now = getTimestamp();
    const characterId = data.characterId;

    const newItem: InventoryItem = {
      ...data,
      name: safeTrim(data.name),
      id: itemId,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const characterItems = state.characterInventories[characterId] || [];

      return {
        items: { ...state.items, [itemId]: newItem },
        entities: { ...state.entities, [itemId]: newItem },
        characterInventories: {
          ...state.characterInventories,
          [characterId]: [...characterItems, itemId],
        },
        error: null,
      };
    });

    return itemId;
  },

  update: (id, updates) => {
    const currentItem = get().items[id];
    if (!currentItem) {
      set({ error: createInventoryError('Item Not Found', 'The specified inventory item could not be found.') });
      return;
    }

    const normalizedUpdates: Partial<InventoryItem> = { ...updates };

    if (updates?.name) {
      normalizedUpdates.name = safeTrim(updates.name);
    }

    const now = getTimestamp();
    const newCharacterId = updates?.characterId ?? currentItem.characterId;
    const updatedItem: InventoryItem = {
      ...currentItem,
      ...normalizedUpdates,
      characterId: newCharacterId,
      updatedAt: now,
    };

    set((state) => {
      const nextCharacterInventories = { ...state.characterInventories };

      if (currentItem.characterId !== newCharacterId) {
        const fromList = nextCharacterInventories[currentItem.characterId] || [];
        nextCharacterInventories[currentItem.characterId] = fromList.filter((itemId) => itemId !== id);

        const toList = nextCharacterInventories[newCharacterId] || [];
        nextCharacterInventories[newCharacterId] = [...toList, id];
      }

      return {
        items: { ...state.items, [id]: updatedItem },
        entities: { ...state.entities, [id]: updatedItem },
        characterInventories: nextCharacterInventories,
        error: null,
      };
    });
  },

  delete: (id) => {
    const currentItem = get().items[id];
    if (!currentItem) {
      return;
    }

    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _removedItem, ...remainingItems } = state.items;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _removedEntity, ...remainingEntities } = state.entities;

      const characterItems = state.characterInventories[currentItem.characterId] || [];
      const updatedCharacterItems = characterItems.filter((itemId) => itemId !== id);

      const updatedInventories = {
        ...state.characterInventories,
        [currentItem.characterId]: updatedCharacterItems,
      };

      return {
        items: remainingItems,
        entities: remainingEntities,
        characterInventories: updatedInventories,
        currentEntityId: state.currentEntityId === id ? null : state.currentEntityId,
        error: null,
      };
    });
  },

  setCurrent: (id) => {
    if (id && !get().items[id]) {
      set({
        error: createInventoryError('Item Not Found', 'The specified inventory item could not be found.'),
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

  addItem: (characterId, itemData) => get().create({ ...itemData, characterId }),
  updateItem: (itemId, updates) => get().update(itemId, updates),
  removeItem: (itemId) => get().delete(itemId),

  transferItem: (itemId, toCharacterId) => {
    const item = get().items[itemId];
    if (!item) {
      set({ error: createInventoryError('Item Not Found', 'Unable to transfer a non-existent item.') });
      return;
    }

    get().update(itemId, { characterId: toCharacterId, equipped: false });
  },

  getCharacterItems: (characterId) => {
    const state = get();
    const itemIds = state.characterInventories[characterId] || [];
    return itemIds.map((itemId) => state.items[itemId]).filter(Boolean);
  },

  getEquippedItems: (characterId) => get().getCharacterItems(characterId).filter((item) => item.equipped),

  calculateTotalWeight: (characterId) =>
    get()
      .getCharacterItems(characterId)
      .reduce((total, item) => total + item.weight * item.quantity, 0),
}));
