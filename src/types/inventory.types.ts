// src/types/inventory.types.ts

import { EntityID, NamedEntity } from './common.types';

/**
 * Represents a character's inventory
 */
export interface Inventory {
  characterId: EntityID;
  items: InventoryItem[];
  capacity: number;
  categories: InventoryCategory[];
}

/**
 * Represents an item in the inventory (simplified for MVP)
 */
export interface InventoryItem extends NamedEntity {
  categoryId: EntityID;
  quantity: number;
}

/**
 * Represents a category for inventory organization
 */
export interface InventoryCategory extends NamedEntity {
  icon?: string;
  sortOrder: number;
  parentCategoryId?: EntityID;
}
