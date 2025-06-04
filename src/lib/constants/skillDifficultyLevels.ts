/**
 * skillDifficultyLevels.ts
 * 
 * This file defines the difficulty levels for skills in the world creation process.
 * These constants are used throughout the application to maintain consistency
 * in how skill difficulties are displayed and processed.
 */

export type SkillDifficulty = 'easy' | 'medium' | 'hard';

export interface SkillDifficultyDescription {
  value: SkillDifficulty;
  label: string;
  description: string;
}

/**
 * Default difficulty level for new skills
 */
export const DEFAULT_SKILL_DIFFICULTY: SkillDifficulty = 'medium';

/**
 * Descriptions for each skill difficulty level
 */
export const SKILL_DIFFICULTIES: SkillDifficultyDescription[] = [
  { 
    value: 'easy', 
    label: 'Easy', 
    description: 'Quick to learn and apply, even for beginners'
  },
  { 
    value: 'medium', 
    label: 'Medium', 
    description: 'Requires moderate practice to become proficient'
  },
  { 
    value: 'hard', 
    label: 'Hard', 
    description: 'Requires extensive practice and natural talent to master'
  }
];

/**
 * Get the skill difficulty description for a given difficulty value
 * @param difficulty The difficulty value (easy, medium, hard)
 * @returns The corresponding difficulty description or undefined if not found
 */
export const getSkillDifficultyDescription = (
  difficulty: SkillDifficulty
): SkillDifficultyDescription | undefined => {
  return SKILL_DIFFICULTIES.find(level => level.value === difficulty);
};
