/**
 * Skill level descriptions for the 1-5 scale
 */
export const SKILL_LEVEL_DESCRIPTIONS = [
  { value: 1, label: 'Novice', description: 'Beginner understanding with limited skill' },
  { value: 2, label: 'Apprentice', description: 'Basic proficiency with room for improvement' },
  { value: 3, label: 'Competent', description: 'Solid performance in most situations' },
  { value: 4, label: 'Expert', description: 'Advanced mastery with consistent results' },
  { value: 5, label: 'Master', description: 'Complete mastery at professional level' },
];

/**
 * The fixed minimum value for skills
 */
export const SKILL_MIN_VALUE = 1;

/**
 * The fixed maximum value for skills
 */
export const SKILL_MAX_VALUE = 5;

/**
 * The default value for skills
 */
export const SKILL_DEFAULT_VALUE = 3;

/**
 * Gets the skill level description for a given value
 * @param value The skill value
 * @returns The level description or undefined if not found
 */
export function getSkillLevelDescription(value: number) {
  return SKILL_LEVEL_DESCRIPTIONS.find(level => level.value === value);
}