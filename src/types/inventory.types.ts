// src/types/inventory.types.ts

import { EntityID, NamedEntity, TimestampedEntity } from './common.types';

/**
 * Standard inventory category types for organizing items in any narrative genre.
 * Following the proven pattern from lore categorization (issue #183).
 *
 * Genre-agnostic categories that work across fantasy, sci-fi, modern, historical, etc.:
 * - equipment: Items used for tasks or carried regularly (tools, devices, gear)
 * - valuables: Currency, treasures, collectibles of monetary or sentimental value
 * - consumables: Single-use items that are depleted when used (food, medicine, fuel)
 * - documents: Written materials, data, maps, records, correspondence
 * - personal: Clothing, accessories, personal effects, mementos
 * - quest-items: Story-critical items that drive narrative forward
 * - miscellaneous: Items that don't fit other categories
 */
export type StandardInventoryCategory =
  | 'equipment'
  | 'valuables'
  | 'consumables'
  | 'documents'
  | 'personal'
  | 'quest-items'
  | 'miscellaneous';

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
export interface InventoryItem extends NamedEntity, TimestampedEntity {
  categoryId: EntityID;
  quantity: number;
  stackable: boolean; // Whether this item type can stack
  maxStack?: number; // Optional maximum stack size
}

/**
 * Represents a category for inventory organization
 */
export interface InventoryCategory extends NamedEntity {
  icon?: string;
  sortOrder: number;
  parentCategoryId?: EntityID;
}
