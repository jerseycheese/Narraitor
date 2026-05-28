// src/lib/inventory/equippable.ts

import type { InventoryItem, StandardInventoryCategory } from '@/types/inventory.types';
import { getCategoryMetadata } from './categories';

/**
 * Categories whose items can be worn, wielded, or otherwise equipped.
 * Everything else (consumables, valuables, documents, quest-items, etc.)
 * is carried but not "equipped" in a loadout sense.
 */
export const EQUIPPABLE_CATEGORIES: StandardInventoryCategory[] = [
  'equipment',
  'personal',
];

export function isEquippableCategory(
  categoryId: StandardInventoryCategory
): boolean {
  return EQUIPPABLE_CATEGORIES.includes(categoryId);
}

export interface EquipEligibility {
  allowed: boolean;
  reason?: string;
}

/**
 * Decides whether an item can be equipped and, if not, gives a player-facing
 * reason. Only equipment and personal items are equippable for now.
 */
export function canEquipItem(item: InventoryItem): EquipEligibility {
  if (isEquippableCategory(item.categoryId)) {
    return { allowed: true };
  }

  const label = getCategoryMetadata(item.categoryId)?.name ?? item.categoryId;
  return {
    allowed: false,
    reason: `${item.name} can't be equipped — ${label} items are carried, not worn or wielded.`,
  };
}
