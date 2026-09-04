import { useCharacterStore, type StoreCharacter } from '@/state/characterStore';
import { EntityID } from '@/types/common.types';
import {
  validateText,
  validateSelectionCount,
  ValidationResult
} from '@/lib/utils/validationUtils';

export const isCharacterNameUnique = (name: string, worldId: EntityID): boolean => {
  // Check uniqueness within world
  const state = useCharacterStore.getState();
  const characters = state.characters || {};
  const existingCharacters = (Object.values(characters) as StoreCharacter[]).filter(c => c.worldId === worldId);
  return !existingCharacters.some(c => c.name === name);
};

export const validateAttributes = (
  attributes: Array<{ value: number; maxValue?: number }>,
  totalPoints: number
): ValidationResult => {
  const values = attributes.map(attr => attr.value);
  if (attributes.length === 0) {
    return {
      valid: false,
      errors: ['At least one attribute is required.'],
    };
  }

  const pointsSpent = values.reduce((sum, value) => sum + value, 0);
  if (pointsSpent > totalPoints) {
    return {
      valid: false,
      errors: ['You have allocated more attribute points than available.'],
    };
  }

  return { valid: true, errors: [] };
};

export const validateSkills = (
  skills: Array<{
    skillId: EntityID;
    isSelected: boolean;
    level: number;
    name?: string;
    minLevel?: number;
    maxLevel?: number;
  }>,
  skillPointPool: number,
  worldSkills: Array<{ id: EntityID; minValue: number; maxValue: number }> = []
): ValidationResult => {
  const selections = skills.map(skill => skill.isSelected);
  const result = validateSelectionCount(selections, {
    minSelections: 1,
    maxSelections: 8,
    fieldName: 'skills'
  });
  
  // Update error messages to match existing test expectations
  const updatedErrors = result.errors.map(error => {
    if (error === 'Select at least 1 skills') {
      return 'Select at least one skill';
    }
    if (error === 'Maximum 8 skills allowed') {
      return 'Maximum 8 skills allowed';
    }
    return error;
  });
  
  const errors = [...updatedErrors];

  const getBounds = (skill: { minLevel?: number; maxLevel?: number; skillId: EntityID }) => {
    const worldSkill = worldSkills.find(ws => ws.id === skill.skillId);
    const minLevel = skill.minLevel ?? worldSkill?.minValue ?? 1;
    const maxLevel = skill.maxLevel ?? worldSkill?.maxValue ?? minLevel;
    return { minLevel, maxLevel };
  };

  const selectedSkills = skills.filter(skill => skill.isSelected);
  const totalAllocated = selectedSkills.reduce((sum, skill) => {
    const { minLevel } = getBounds(skill);
    return sum + Math.max(0, (skill.level ?? minLevel) - minLevel);
  }, 0);
  selectedSkills.forEach(skill => {
    const { minLevel, maxLevel } = getBounds(skill);
    const skillLabel = skill.name || skill.skillId;
    if (maxLevel === minLevel) {
      errors.push(`Skill ${skillLabel} cannot be leveled because its configuration has no available range.`);
    }
    if (skill.level < minLevel) {
      errors.push(`Skill ${skillLabel} is below its minimum level of ${minLevel}.`);
    }
    if (skill.level > maxLevel) {
      errors.push(`Skill ${skillLabel} exceeds its maximum level of ${maxLevel}.`);
    }
  });

  if (skillPointPool >= 0 && totalAllocated > skillPointPool) {
    errors.push('You have allocated more skill points than available.');
  }

  const uniqueErrors = Array.from(new Set(errors));

  return {
    valid: uniqueErrors.length === 0,
    errors: uniqueErrors
  };
};

export const validateBackground = (background: {
  history: string;
  personality: string;
  goals: string[];
  motivation: string;
}): ValidationResult => {
  const historyValidation = validateText(background.history, {
    minLength: 50,
    fieldName: 'Character history'
  });
  
  const personalityValidation = validateText(background.personality, {
    minLength: 20,
    fieldName: 'Personality description'
  });
  
  const allErrors = [...historyValidation.errors, ...personalityValidation.errors];
  
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
};
