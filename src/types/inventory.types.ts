// src/types/inventory.types.ts

import { EntityID, NamedEntity, TimestampedEntity, ISODateString, GeneratedImage } from './common.types';

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
  itemOrder: EntityID[];
}

/**
 * Represents an item in the inventory (simplified for MVP)
 */
export type InventoryAcquisitionMethod =
  | 'loot'
  | 'quest'
  | 'purchase'
  | 'craft'
  | 'reward'
  | 'gift'
  | 'manual'
  | 'unknown';

export interface InventoryAcquisitionRecord {
  acquiredAt: ISODateString;
  method: InventoryAcquisitionMethod;
  quantity: number;
  description?: string;
  sourceId?: EntityID;
  sessionId?: EntityID;
  recordedBy?: EntityID;
}

type InventoryCategorizationSource =
  | 'ai'
  | 'manual'
  | 'system'
  | 'fallback'
  | 'narrative-context';

export interface InventoryItemCategorization {
  categoryId: StandardInventoryCategory;
  source: InventoryCategorizationSource;
  classifiedAt: ISODateString;
  confidence?: number;
  model?: string;
  rationale?: string;
}

export interface InventoryItem extends NamedEntity, TimestampedEntity {
  categoryId: StandardInventoryCategory;
  quantity: number;
  stackable: boolean;
  maxStack?: number;
  acquisitionHistory: InventoryAcquisitionRecord[];
  categorization: InventoryItemCategorization;
  image?: GeneratedImage; // AI-generated visual asset for the item
}

/**
 * Represents a category for inventory organization
 */
export interface InventoryCategory extends NamedEntity {
  icon?: string;
  sortOrder: number;
  parentCategoryId?: EntityID;
}

/**
 * Result of using an item
 */
export interface ItemUsageResult {
  success: boolean;
  itemName?: string;
  categoryId?: StandardInventoryCategory;
  wasConsumed?: boolean;
  remainingQuantity?: number;
  previousQuantity?: number;
  narrative?: string;
  segmentId?: EntityID;
  error?: {
    type: string;
    title: string;
    message: string;
  };
}
