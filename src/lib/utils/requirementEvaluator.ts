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

export const evaluateRequirement = (
  requirement: DecisionRequirement,
  character: Character
): RequirementEvaluationResult => {
  // Requirements come from model-generated JSON and characters from persisted
  // IndexedDB records, so neither side is guaranteed to match its declared type.
  const targetId = (requirement.targetId || '').toLowerCase();

  if (requirement.type === 'skill') {
    // Try to find skill by worldSkillId first, then by name (case-insensitive)
    const skill = (character.skills || []).find(s =>
      s.worldSkillId === requirement.targetId ||
      s.name?.toLowerCase() === targetId
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
    const item = inventoryItems.find(i =>
      i.id === requirement.targetId ||
      i.name?.toLowerCase() === targetId
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