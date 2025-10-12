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

export const evaluateRequirement = (
  requirement: DecisionRequirement,
  character: Character
): RequirementEvaluationResult => {
  if (requirement.type === 'skill') {
    // Try to find skill by worldSkillId first, then by name (case-insensitive)
    const skill = character.skills.find(s =>
      s.worldSkillId === requirement.targetId ||
      s.name.toLowerCase() === requirement.targetId.toLowerCase()
    );
    const currentLevel = skill ? skill.level : 0;
    const requiredValue = typeof requirement.value === 'number' ? requirement.value : 0;

    let success = false;
    switch (requirement.operator) {
      case 'gte':
        success = currentLevel >= requiredValue;
        break;
      case 'gt':
        success = currentLevel > requiredValue;
        break;
      case 'lte':
        success = currentLevel <= requiredValue;
        break;
      case 'lt':
        success = currentLevel < requiredValue;
        break;
      case 'eq':
        success = currentLevel === requiredValue;
        break;
      case 'neq':
        success = currentLevel !== requiredValue;
        break;
    }

    return {
      success,
      current: currentLevel,
      required: requiredValue
    };
  }

  if (requirement.type === 'item') {
    // Try to find item by ID first, then by name (case-insensitive)
    const inventoryItems = character.inventory?.items || [];
    const item = inventoryItems.find(i =>
      i.id === requirement.targetId ||
      i.name.toLowerCase() === requirement.targetId.toLowerCase()
    );
    const currentQuantity = item ? item.quantity : 0;
    const requiredValue = typeof requirement.value === 'number' ? requirement.value : 0;

    let success = false;
    switch (requirement.operator) {
      case 'gte':
        success = currentQuantity >= requiredValue;
        break;
      case 'gt':
        success = currentQuantity > requiredValue;
        break;
      case 'lte':
        success = currentQuantity <= requiredValue;
        break;
      case 'lt':
        success = currentQuantity < requiredValue;
        break;
      case 'eq':
        success = currentQuantity === requiredValue;
        break;
      case 'neq':
        success = currentQuantity !== requiredValue;
        break;
    }

    return {
      success,
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