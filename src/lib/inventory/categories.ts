// src/lib/inventory/categories.ts

import type { StandardInventoryCategory } from '@/types/inventory.types';

/**
 * Array of all standard inventory categories.
 * Use this for iteration, validation, or displaying category options.
 */
export const STANDARD_CATEGORIES: StandardInventoryCategory[] = [
  'equipment',
  'valuables',
  'consumables',
  'documents',
  'personal',
  'quest-items',
  'miscellaneous',
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
  equipment: {
    name: 'Equipment',
    description: 'Items used for tasks or carried regularly (tools, devices, gear)',
  },
  valuables: {
    name: 'Valuables',
    description: 'Currency, treasures, collectibles of monetary or sentimental value',
  },
  consumables: {
    name: 'Consumables',
    description: 'Single-use items that are depleted when used (food, medicine, fuel)',
  },
  documents: {
    name: 'Documents',
    description: 'Written materials, data, maps, records, correspondence',
  },
  personal: {
    name: 'Personal',
    description: 'Clothing, accessories, personal effects, mementos',
  },
  'quest-items': {
    name: 'Quest Items',
    description: 'Story-critical items that drive narrative forward',
  },
  miscellaneous: {
    name: 'Miscellaneous',
    description: 'Items that don\'t fit other categories',
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
 * isValidCategory('equipment'); // true
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
 * const metadata = getCategoryMetadata('equipment');
 * console.log(metadata.name); // "Equipment"
 * console.log(metadata.description); // "Items used for tasks or carried regularly (tools, devices, gear)"
 * ```
 */
export function getCategoryMetadata(
  category: StandardInventoryCategory
): CategoryMetadata | undefined {
  return CATEGORY_METADATA[category];
}
