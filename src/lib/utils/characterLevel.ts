import { World } from '@/types/world.types';

/**
 * Represents an attribute-like object that can be used for level calculation.
 * Flexible type to support both character attributes and world attributes.
 */
type AttributeLike = {
  id?: string;
  attributeId?: string;
  value?: number;
  baseValue?: number;
};

/**
 * Calculate a character's level based on their total attribute points relative to the world's possible range.
 *
 * The level is calculated by normalizing the character's total attribute points against the world's
 * minimum and maximum possible totals, then mapping to a 1-5 scale:
 * - Level 1: At or near minimum attributes (weakest possible character)
 * - Level 3: Approximately halfway between min and max
 * - Level 5: At or near maximum attributes (strongest possible character)
 *
 * This approach allows characters with unspent attribute points to have appropriately lower levels,
 * giving players agency to create "rookie" or deliberately weaker characters.
 *
 * @param world - The world definition containing attribute min/max ranges
 * @param attributes - Array of character attributes with values (supports multiple ID field names)
 * @returns Character level from 1 to 5, defaults to 1 if validation fails
 *
 * @example
 * ```ts
 * const world = {
 *   attributes: [
 *     { id: 'str', minValue: 1, maxValue: 10 },
 *     { id: 'int', minValue: 1, maxValue: 10 }
 *   ]
 * };
 * const attributes = [
 *   { attributeId: 'str', value: 5 },
 *   { attributeId: 'int', value: 5 }
 * ];
 * // minSum = 2, maxSum = 20, total = 10
 * // normalized = (10 - 2) / (20 - 2) = 0.44
 * // level = 1 + floor(0.44 * 4) = 2
 * calculateCharacterLevel(world, attributes); // Returns 2
 * ```
 */
export function calculateCharacterLevel(world: World, attributes: AttributeLike[]): number {
  if (!world?.attributes?.length || attributes.length === 0) {
    return 1;
  }

  const minSum = world.attributes.reduce((sum, attr) => sum + attr.minValue, 0);
  const maxSum = world.attributes.reduce((sum, attr) => sum + attr.maxValue, 0);

  if (maxSum <= minSum) {
    return 1;
  }

  const total = world.attributes.reduce((sum, worldAttr) => {
    const match = attributes.find((attr) =>
      (attr.id ?? attr.attributeId) === worldAttr.id
    );
    const value = typeof match?.value === 'number'
      ? match.value
      : typeof match?.baseValue === 'number'
      ? match.baseValue
      : worldAttr.minValue;
    return sum + value;
  }, 0);

  const normalized = Math.max(0, Math.min(1, (total - minSum) / (maxSum - minSum)));
  return 1 + Math.floor(normalized * 4);
}
