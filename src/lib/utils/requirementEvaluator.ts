import { DecisionRequirement } from '@/types/narrative.types';
import { InventoryItem } from '@/types/inventory.types';

// Local character interface matching the store structure
interface Character {
  skills: Array<{
    id: string;
    characterId: string;
    worldSkillId?: string;
    name: string;
    level: number;
    category?: string;
  }>;
  inventory?: {
    items: InventoryItem[];
  };
}

export interface RequirementEvaluationResult {
  success: boolean;
  current: number;
  required: number | string;
  skillName?: string;
  itemName?: string;
}

/**
 * Compare two values using a comparison operator
 */
const compareValues = (current: number, required: number, operator: string): boolean => {
  switch (operator) {
    case 'gte': return current >= required;
    case 'gt': return current > required;
    case 'lte': return current <= required;
    case 'lt': return current < required;
    case 'eq': return current === required;
    case 'neq': return current !== required;
    default: return false;
  }
};

/**
 * Lowercase a value only when it really is a string. Requirements come from
 * model-generated JSON and characters from persisted IndexedDB records, so a
 * field typed as string can arrive as a number, and a bare optional-chain still
 * throws on one.
 */
const lowerString = (value: unknown): string =>
  typeof value === 'string' ? value.toLowerCase() : '';

export const evaluateRequirement = (
  requirement: DecisionRequirement,
  character: Character
): RequirementEvaluationResult => {
  // An absent targetId must not match: `undefined === undefined` would pair the
  // requirement with any skill that has no worldSkillId.
  const rawTargetId = requirement.targetId;
  const hasTargetId = rawTargetId !== undefined && rawTargetId !== null && rawTargetId !== '';
  const targetId = lowerString(rawTargetId);

  if (requirement.type === 'skill') {
    // Try to find skill by worldSkillId first, then by name (case-insensitive)
    const skill = !hasTargetId ? undefined : (character.skills || []).find(s =>
      s.worldSkillId === rawTargetId ||
      (targetId !== '' && lowerString(s.name) === targetId)
    );
    const currentLevel = skill ? skill.level : 0;
    const requiredValue = typeof requirement.value === 'number' ? requirement.value : 0;

    return {
      success: true,
      current: currentLevel,
      required: requiredValue,
      skillName: skill?.name
    };
  }

  if (requirement.type === 'item') {
    // Try to find item by ID first, then by name (case-insensitive)
    const inventoryItems = character.inventory?.items || [];
    const item = !hasTargetId ? undefined : inventoryItems.find(i =>
      i.id === rawTargetId ||
      (targetId !== '' && lowerString(i.name) === targetId)
    );
    const currentQuantity = item ? item.quantity : 0;
    const requiredValue = typeof requirement.value === 'number' ? requirement.value : 0;

    return {
      success: compareValues(currentQuantity, requiredValue, requirement.operator),
      current: currentQuantity,
      required: requiredValue,
      itemName: item?.name
    };
  }

  return {
    success: false,
    current: 0,
    required: requirement.value
  };
};