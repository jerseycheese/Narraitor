import { useCharacterStore, type StoreCharacter } from '@/state/characterStore';
import { EntityID } from '@/types/common.types';
import {
  validateText,
  validateSelectionCount,
  ValidationResult
} from '@/lib/utils/validationUtils';
import {
  calculateSkillPointPool,
  getMaxSkillSelections,
  getSkillBounds,
  type SkillRulesWorld,
} from './skillAllocation';

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

/**
 * Validates the wizard's skill step: selection count against the world's limit,
 * per-skill bounds, and point spend against the pool. Bounds and spend come
 * from skillAllocation so every surface counts them the same way.
 */
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
  world: SkillRulesWorld | undefined
): ValidationResult => {
  const selections = skills.map(skill => skill.isSelected);
  const result = validateSelectionCount(selections, {
    minSelections: 1,
    maxSelections: getMaxSkillSelections(world),
    fieldName: 'skills'
  });

  const errors = result.errors.map(error =>
    error === 'Select at least 1 skills' ? 'Select at least one skill' : error
  );

  const selectedSkills = skills.filter(skill => skill.isSelected);
  selectedSkills.forEach(skill => {
    const { minLevel, maxLevel } = getSkillBounds(skill, world);
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

  const { spent } = calculateSkillPointPool(skills, world, skillPointPool);
  if (skillPointPool >= 0 && spent > skillPointPool) {
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

  const fieldErrors: Record<string, string> = {};
  if (historyValidation.errors[0]) fieldErrors.history = historyValidation.errors[0];
  if (personalityValidation.errors[0]) fieldErrors.personality = personalityValidation.errors[0];

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    fieldErrors,
  };
};
