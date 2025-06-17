// src/utils/skillCheckEvaluator.ts

import { EntityID } from '@/types/common.types';
import { Character, CharacterSkill } from '@/types/character.types';
import { World } from '@/types/world.types';
import { SkillDifficulty } from '@/lib/constants/skillDifficultyLevels';

/**
 * Represents a skill check requirement
 */
export interface SkillCheck {
  /** The skill ID to check against */
  skillId: EntityID;
  /** Alternative skill name for lookup */
  skillName?: string;
  /** The difficulty level required to pass the check */
  difficulty: number;
  /** Optional attribute modifier to include */
  useAttributeModifier?: boolean;
}

/**
 * Result of a skill check evaluation
 */
export interface SkillCheckResult {
  /** Whether the character passed the skill check */
  success: boolean;
  /** The character's effective skill value used in the check */
  characterSkillValue: number;
  /** The attribute modifier applied (if any) */
  attributeModifier: number;
  /** The total value used for comparison */
  totalValue: number;
  /** The difficulty threshold that was checked against */
  difficultyThreshold: number;
  /** Details about why the check failed or succeeded */
  details: string;
}

/**
 * Skill difficulty to numeric value mapping
 */
const DIFFICULTY_VALUES: Record<SkillDifficulty, number> = {
  easy: 3,
  medium: 6,
  hard: 9
};

/**
 * Evaluates a skill check against a character's abilities
 * 
 * @param character - The character to evaluate
 * @param skillCheck - The skill check requirements
 * @param world - The world context for skill and attribute lookups
 * @returns SkillCheckResult indicating success/failure and details
 */
export function evaluateSkillCheck(
  character: Character,
  skillCheck: SkillCheck,
  world?: World
): SkillCheckResult {
  // Find the character's skill
  const characterSkill = findCharacterSkill(character, skillCheck.skillId, skillCheck.skillName, world);
  
  if (!characterSkill) {
    return {
      success: false,
      characterSkillValue: 0,
      attributeModifier: 0,
      totalValue: 0,
      difficultyThreshold: skillCheck.difficulty,
      details: `Character does not have the required skill: ${skillCheck.skillName || skillCheck.skillId}`
    };
  }

  // Calculate attribute modifier if requested
  let attributeModifier = 0;
  if (skillCheck.useAttributeModifier !== false) { // Default to true
    attributeModifier = calculateAttributeModifier(character, characterSkill.skillId, world);
  }

  // Calculate total value
  const totalValue = characterSkill.level + attributeModifier;
  
  // Determine success
  const success = totalValue >= skillCheck.difficulty;
  
  return {
    success,
    characterSkillValue: characterSkill.level,
    attributeModifier,
    totalValue,
    difficultyThreshold: skillCheck.difficulty,
    details: success 
      ? `Skill check passed: ${totalValue} >= ${skillCheck.difficulty}`
      : `Skill check failed: ${totalValue} < ${skillCheck.difficulty}`
  };
}

/**
 * Finds a character's skill by ID or name
 */
function findCharacterSkill(
  character: Character,
  skillId: EntityID,
  skillName?: string,
  world?: World
): CharacterSkill | null {
  // First try to find by exact skillId match
  let characterSkill = character.skills.find(skill => skill.skillId === skillId);
  
  if (characterSkill) {
    return characterSkill;
  }

  // If not found and we have a skill name, try to resolve the name to an ID
  if (skillName && world) {
    const worldSkill = world.skills.find(skill => 
      skill.name.toLowerCase() === skillName.toLowerCase()
    );
    
    if (worldSkill) {
      characterSkill = character.skills.find(skill => skill.skillId === worldSkill.id);
    }
  }

  return characterSkill || null;
}

/**
 * Calculates the attribute modifier for a skill (10% of linked attribute value)
 */
function calculateAttributeModifier(
  character: Character,
  skillId: EntityID,
  world?: World
): number {
  if (!world) {
    return 0;
  }

  // Find the world skill to get its linked attribute
  const worldSkill = world.skills.find(skill => skill.id === skillId);
  if (!worldSkill || !worldSkill.linkedAttributeId) {
    return 0;
  }

  // Find the character's attribute value
  const characterAttribute = character.attributes.find(
    attr => attr.attributeId === worldSkill.linkedAttributeId
  );
  
  if (!characterAttribute) {
    return 0;
  }

  // Return 10% of attribute value, rounded down
  return Math.floor(characterAttribute.value * 0.1);
}

/**
 * Helper function to create a skill check from a skill difficulty enum
 */
export function createSkillCheckFromDifficulty(
  skillId: EntityID,
  difficulty: SkillDifficulty,
  skillName?: string
): SkillCheck {
  return {
    skillId,
    skillName,
    difficulty: DIFFICULTY_VALUES[difficulty],
    useAttributeModifier: true
  };
}

/**
 * Helper function to check if a character can pass a skill check
 * Simplified version that just returns boolean
 */
export function canPassSkillCheck(
  character: Character,
  skillCheck: SkillCheck,
  world?: World
): boolean {
  const result = evaluateSkillCheck(character, skillCheck, world);
  return result.success;
}