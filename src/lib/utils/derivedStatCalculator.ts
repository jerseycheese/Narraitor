/**
 * Derived Stat Calculator
 *
 * Calculates derived stats from character attributes using world-defined formulas.
 * Follows the multiplier-based formula system for security and simplicity.
 *
 * Formula structure:
 * - result = baseValue + Σ(attribute.value × multiplier) for each attribute
 * - result clamped to [minValue, maxValue] if specified
 *
 * Example formulas:
 * - Vitality Pool = Constitution × 10 (min: 10)
 * - Defense Rating = 10 + (Dexterity × 0.5) + (Constitution × 0.3)
 * - Hack Pool = Interface × 5 + Tech × 2
 */

import { DerivedStatFormula } from '@/types/world.types';
import { CharacterAttribute } from '@/state/characterStore.types';

/**
 * Calculate a derived stat value from a formula and character attributes
 *
 * @param formula - The formula definition from world settings
 * @param characterAttributes - The character's current attributes
 * @returns The calculated stat value (rounded, clamped to min/max)
 */
export function calculateDerivedStat(
  formula: DerivedStatFormula,
  characterAttributes: CharacterAttribute[]
): number {
  // Start with base value (default to 0 if not specified)
  let total = formula.baseValue ?? 0;

  // Apply each attribute multiplier
  Object.entries(formula.attributeMultipliers).forEach(
    ([attrId, multiplier]) => {
      // Find the matching attribute by worldAttributeId or id
      const attribute = characterAttributes.find(
        (attr) => attr.worldAttributeId === attrId || attr.id === attrId
      );

      if (attribute) {
        // Use modifiedValue if available, fall back to baseValue
        const value = attribute.modifiedValue ?? attribute.baseValue;
        total += value * multiplier;
      }
      // If attribute not found, skip it (graceful handling)
    }
  );

  // Round to whole number
  let result = Math.round(total);

  // Apply min/max clamping if specified
  if (formula.minValue !== undefined) {
    result = Math.max(result, formula.minValue);
  }
  if (formula.maxValue !== undefined) {
    result = Math.min(result, formula.maxValue);
  }

  return result;
}
