/**
 * Inventory System - POST-MVP
 * Status: Implementation complete but not included in MVP
 * Reason: Deprioritized to focus on core narrative experience
 * Date: May 2025
 * 
 * Note: This store is fully functional and tested but will not be 
 * exposed in the UI until post-MVP. The narrative engine may still
 * reference inventory data for context.
 */

import { create } from 'zustand';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';

// Simplified inventory item for MVP implementation
interface InventoryItem {
  id: EntityID;
  characterId: EntityID;
  name: string;
  category: string;
  quantity: number;
  weight: number;
  value: number;
  equipped: boolean;
}

/**
 * Inventory store interface with state and actions
 */
interface InventoryStore {
  // State
  items: Record<EntityID, InventoryItem>;
  characterInventories: Record<EntityID, EntityID[]>;
  error: string | null;
  loading: boolean;

  // Actions
  addItem: (characterId: EntityID, item: Omit<InventoryItem, 'id' | 'characterId'>) => EntityID;
  updateItem: (itemId: EntityID, updates: Partial<InventoryItem>) => void;
  removeItem: (itemId: EntityID) => void;
  transferItem: (itemId: EntityID, toCharacterId: EntityID) => void;
  
  // Query actions
  getCharacterItems: (characterId: EntityID) => InventoryItem[];
  getEquippedItems: (characterId: EntityID) => InventoryItem[];
  calculateTotalWeight: (characterId: EntityID) => number;
  
  // State management
  reset: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Initial state
const initialState = {
  items: {},
  characterInventories: {},
  error: null,
  loading: false,
};

// Inventory Store implementation
export const inventoryStore = create<InventoryStore>()((set, get) => ({
  ...initialState,

  // Add item
  addItem: (characterId, itemData) => {
    if (!itemData.name || itemData.name.trim() === '') {
      throw new Error('Item name is required');
    }

    const itemId = generateUniqueId('item');
    
    const newItem: InventoryItem = {
      ...itemData,
      id: itemId,
      characterId,
    };

    set((state) => {
      // Initialize character inventory if not exists
      const characterItems = state.characterInventories[characterId] || [];
      
      return {
        items: {
          ...state.items,
          [itemId]: newItem,
        },
        characterInventories: {
          ...state.characterInventories,
          [characterId]: [...characterItems, itemId],
        },
      };
    });

    return itemId;
  },

  // Update item
  updateItem: (itemId, updates) => set((state) => {
    if (!state.items[itemId]) {
      return { error: 'Item not found' };
    }

    const updatedItem: InventoryItem = {
      ...state.items[itemId],
      ...updates,
    };

    return {
      items: {
        ...state.items,
        [itemId]: updatedItem,
      },
      error: null,
    };
  }),

  // Remove item
  removeItem: (itemId) => set((state) => {
    const item = state.items[itemId];
    if (!item) {
      return state;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [itemId]: _removedItem, ...remainingItems } = state.items;
    
    // Remove from character inventory
    const characterId = item.characterId;
    const updatedCharacterItems = state.characterInventories[characterId]?.filter(
      (id) => id !== itemId
    ) || [];

    return {
      items: remainingItems,
      characterInventories: {
        ...state.characterInventories,
        [characterId]: updatedCharacterItems,
      },
    };
  }),

  // Transfer item
  transferItem: (itemId, toCharacterId) => set((state) => {
    const item = state.items[itemId];
    if (!item) {
      return { error: 'Item not found' };
    }

    const fromCharacterId = item.characterId;
    
    // Update item's character ID and unequip it
    const updatedItem: InventoryItem = {
      ...item,
      characterId: toCharacterId,
      equipped: false,
    };

    // Remove from source character inventory
    const fromCharacterItems = state.characterInventories[fromCharacterId]?.filter(
      (id) => id !== itemId
    ) || [];

    // Add to target character inventory
    const toCharacterItems = state.characterInventories[toCharacterId] || [];

    return {
      items: {
        ...state.items,
        [itemId]: updatedItem,
      },
      characterInventories: {
        ...state.characterInventories,
        [fromCharacterId]: fromCharacterItems,
        [toCharacterId]: [...toCharacterItems, itemId],
      },
      error: null,
    };
  }),

  // Get character items
  getCharacterItems: (characterId) => {
    const state = get();
    const itemIds = state.characterInventories[characterId] || [];
    return itemIds.map((id) => state.items[id]).filter(Boolean);
  },

  // Get equipped items
  getEquippedItems: (characterId) => {
    const state = get();
    const items = state.getCharacterItems(characterId);
    return items.filter((item) => item.equipped);
  },

  // Calculate total weight
  calculateTotalWeight: (characterId) => {
    const state = get();
    const items = state.getCharacterItems(characterId);
    return items.reduce((total, item) => total + (item.weight * item.quantity), 0);
  },

  // State management actions
  reset: () => set(() => initialState),
  setError: (error) => set(() => ({ error })),
  clearError: () => set(() => ({ error: null })),
  setLoading: (loading) => set(() => ({ loading })),
}));
