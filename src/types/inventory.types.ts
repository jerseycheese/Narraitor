// src/types/inventory.types.ts

import { EntityID, NamedEntity, TimestampedEntity } from './common.types';

/**
 * Standard inventory category types for common game items.
 * Following the proven pattern from lore categorization (issue #183).
 *
 * Categories:
 * - weapons: Swords, bows, staffs, and other combat items
 * - armor: Helmets, shields, chest pieces, and protective gear
 * - consumables: Potions, food, scrolls that are used up
 * - tools: Keys, lockpicks, rope, and utility items
 * - treasure: Gems, coins, valuable collectibles
 * - quest-items: Story-critical items that cannot be discarded
 * - materials: Crafting components, raw resources
 */
export type StandardInventoryCategory =
  | 'weapons'
  | 'armor'
  | 'consumables'
  | 'tools'
  | 'treasure'
  | 'quest-items'
  | 'materials';

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
