import { DecisionRequirement } from '@/types/narrative.types';

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
}

export interface RequirementEvaluationResult {
  success: boolean;
  current: number;
  required: number | string;
  skillName?: string;
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
  
  return {
    success: false,
    current: 0,
    required: requirement.value
  };
};