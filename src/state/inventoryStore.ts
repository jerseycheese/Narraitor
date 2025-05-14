import { create } from 'zustand';
import { Inventory } from '../types/inventory.types';

/**
 * Inventory store for managing inventory state in the Narraitor application.
 * Implements MVP functionality with basic state initialization only.
 */

// Define the initial state for the inventory store
const initialInventoryState: Inventory = {
  characterId: '',
  items: [],
  capacity: 0,
  categories: [],
};

// Define the Inventory Store
export const inventoryStore = create<Inventory>()(() => ({
  ...initialInventoryState,
}));
