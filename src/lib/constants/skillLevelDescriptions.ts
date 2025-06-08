/**
 * skillLevelDescriptions.ts
 * 
 * This file contains constants and utility functions for skill level descriptions
 * used throughout the application when displaying skill levels to users.
 */

export interface SkillLevelDescription {
  value: number;
  label: string;
  description: string;
}

export const MIN_SKILL_VALUE = 1;
export const MAX_SKILL_VALUE = 5;
export const SKILL_DEFAULT_VALUE = 3;

/**
 * Skill level descriptions for a 1-5 scale, used to provide meaningful
 * feedback when users are setting skill values.
 */
export const SKILL_LEVEL_DESCRIPTIONS: SkillLevelDescription[] = [
  { 
    value: 1, 
    label: 'Novice', 
    description: 'Beginner understanding with limited skill'
  },
  { 
    value: 2, 
    label: 'Apprentice', 
    description: 'Basic proficiency with room for improvement'
  },
  { 
    value: 3, 
    label: 'Competent', 
    description: 'Solid performance in most situations'
  },
  { 
    value: 4, 
    label: 'Expert', 
    description: 'Advanced mastery with consistent results'
  },
  { 
    value: 5, 
    label: 'Master', 
    description: 'Complete mastery at professional level'
  },
];

/**
 * Get the skill level description for a given value
 * @param value The numeric skill value (1-5)
 * @returns The corresponding skill level description or undefined if not found
 */
export const getSkillLevelDescription = (value: number): SkillLevelDescription | undefined => {
  return SKILL_LEVEL_DESCRIPTIONS.find(level => level.value === value);
};
