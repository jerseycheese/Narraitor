// src/lib/inventory/categories.ts

import type { StandardInventoryCategory } from '@/types/inventory.types';

/**
 * Array of all standard inventory categories.
 * Use this for iteration, validation, or displaying category options.
 */
export const STANDARD_CATEGORIES: StandardInventoryCategory[] = [
  'weapons',
  'armor',
  'consumables',
  'tools',
  'treasure',
  'quest-items',
  'materials',
];

/**
 * Category metadata for display and documentation purposes.
 */
export interface CategoryMetadata {
  name: string;
  description: string;
}

/**
 * Metadata mapping for all standard categories.
 */
const CATEGORY_METADATA: Record<StandardInventoryCategory, CategoryMetadata> = {
  weapons: {
    name: 'Weapons',
    description: 'Swords, bows, staffs, and other combat items',
  },
  armor: {
    name: 'Armor',
    description: 'Helmets, shields, chest pieces, and protective gear',
  },
  consumables: {
    name: 'Consumables',
    description: 'Potions, food, scrolls that are used up',
  },
  tools: {
    name: 'Tools',
    description: 'Keys, lockpicks, rope, and utility items',
  },
  treasure: {
    name: 'Treasure',
    description: 'Gems, coins, valuable collectibles',
  },
  'quest-items': {
    name: 'Quest Items',
    description: 'Story-critical items that cannot be discarded',
  },
  materials: {
    name: 'Materials',
    description: 'Crafting components, raw resources',
  },
};

/**
 * Validates whether a string is a valid standard inventory category.
 *
 * @param value - The value to validate
 * @returns True if the value is a valid StandardInventoryCategory
 *
 * @example
 * ```typescript
 * isValidCategory('weapons'); // true
 * isValidCategory('invalid'); // false
 * ```
 */
export function isValidCategory(value: string): value is StandardInventoryCategory {
  if (!value || typeof value !== 'string') {
    return false;
  }
  return STANDARD_CATEGORIES.includes(value as StandardInventoryCategory);
}

/**
 * Retrieves metadata for a specific category.
 *
 * @param category - The category to get metadata for
 * @returns Category metadata object or undefined if invalid
 *
 * @example
 * ```typescript
 * const metadata = getCategoryMetadata('weapons');
 * console.log(metadata.name); // "Weapons"
 * console.log(metadata.description); // "Swords, bows, staffs, and other combat items"
 * ```
 */
export function getCategoryMetadata(
  category: StandardInventoryCategory
): CategoryMetadata | undefined {
  return CATEGORY_METADATA[category];
}

/**
 * Returns all categories with their metadata.
 * Useful for building UI category selection lists.
 *
 * @returns Array of categories with id, name, and description
 *
 * @example
 * ```typescript
 * const categories = getAllCategories();
 * categories.forEach(cat => {
 *   console.log(`${cat.name}: ${cat.description}`);
 * });
 * ```
 */
export function getAllCategories(): Array<
  CategoryMetadata & { id: StandardInventoryCategory }
> {
  return STANDARD_CATEGORIES.map((category) => ({
    id: category,
    ...CATEGORY_METADATA[category],
  }));
}
