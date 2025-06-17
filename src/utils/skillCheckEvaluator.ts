// src/utils/skillCheckEvaluator.ts

import { Character } from '@/types/character.types';
import { WorldSkill } from '@/types/world.types';

/**
 * Represents a skill check to be evaluated against a character
 */
export interface SkillCheck {
  /** The ID of the skill to check */
  skillId?: string;
  /** The name of the skill to check (alternative to skillId) */
  skillName?: string;
  /** The difficulty level to check against (1-10 scale) */
  difficulty: number;
}

/**
 * Evaluates whether a character passes a skill check
 * 
 * @param character - The character to evaluate
 * @param skillCheck - The skill check to perform
 * @param worldSkills - Array of world skills for skill definition lookup
 * @returns true if the character meets or exceeds the skill difficulty, false otherwise
 */
export function evaluateSkillCheck(
  character: Character,
  skillCheck: SkillCheck,
  worldSkills: WorldSkill[]
): boolean {
  // Handle missing skill identifier
  if (!skillCheck.skillId && !skillCheck.skillName) {
    return false;
  }

  // Find the skill definition in world skills
  let targetSkillId: string;
  if (skillCheck.skillId) {
    targetSkillId = skillCheck.skillId;
  } else if (skillCheck.skillName) {
    const worldSkill = worldSkills.find(ws => ws.name === skillCheck.skillName);
    if (!worldSkill) {
      return false;
    }
    targetSkillId = worldSkill.id;
  } else {
    return false;
  }

  // Find the character's skill level
  const characterSkill = character.skills.find(skill => 
    skill.skillId === targetSkillId && skill.isActive
  );

  // If character doesn't have the skill or it's inactive, they fail the check
  if (!characterSkill) {
    return false;
  }

  // Start with base skill level
  let totalSkillValue = characterSkill.level;

  // Find the world skill definition to get linked attribute
  const worldSkill = worldSkills.find(ws => ws.id === targetSkillId);
  
  // Apply attribute bonus if skill has a linked attribute
  if (worldSkill?.linkedAttributeId) {
    const linkedAttribute = character.attributes.find(attr => 
      attr.attributeId === worldSkill.linkedAttributeId
    );
    
    if (linkedAttribute) {
      // Apply 10% of attribute value as bonus (rounded to nearest integer)
      const attributeBonus = Math.round(linkedAttribute.value * 0.1);
      totalSkillValue += attributeBonus;
    }
  }

  // Return true if total skill value meets or exceeds difficulty
  return totalSkillValue >= skillCheck.difficulty;
}

/**
 * Helper function to resolve skill name to skill ID
 * 
 * @param skillName - The name of the skill to resolve
 * @param worldSkills - Array of world skills for lookup
 * @returns The skill ID if found, null otherwise
 */
export function resolveSkillNameToId(skillName: string, worldSkills: WorldSkill[]): string | null {
  const worldSkill = worldSkills.find(ws => ws.name === skillName);
  return worldSkill ? worldSkill.id : null;
}