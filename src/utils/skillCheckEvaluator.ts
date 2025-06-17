// src/utils/skillCheckEvaluator.ts
//
// MANUAL VERIFICATION STEPS:
// 1. Create a test character with Athletics skill level 8, Strength attribute 20
// 2. Test basic skill check: evaluateSkillCheck(character, {skillId: 'athletics', difficulty: 8}, worldSkills) → should return true
// 3. Test with attribute bonus: evaluateSkillCheck(character, {skillId: 'athletics', difficulty: 10}, worldSkills) → should return true (8 + 2 bonus = 10)
// 4. Test failure: evaluateSkillCheck(character, {skillId: 'athletics', difficulty: 12}, worldSkills) → should return false
// 5. Test skill name lookup: evaluateSkillCheck(character, {skillName: 'Athletics', difficulty: 8}, worldSkills) → should return true
// 6. Test missing skill: evaluateSkillCheck(character, {skillId: 'nonexistent', difficulty: 1}, worldSkills) → should return false
// 7. Test helper: findWorldSkill({skillName: 'Athletics'}, worldSkills) → should return the athletics WorldSkill object

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

  // Find the world skill using helper function
  const worldSkill = findWorldSkill(skillCheck, worldSkills);
  if (!worldSkill) {
    return false;
  }

  // Find the character's skill level using the world skill ID
  const characterSkill = character.skills.find(skill => 
    skill.skillId === worldSkill.id && skill.isActive
  );

  // If character doesn't have the skill or it's inactive, they fail the check
  if (!characterSkill) {
    return false;
  }

  // Start with base skill level
  let totalSkillValue = characterSkill.level;
  
  // Apply attribute bonus if skill has linked attributes
  if (worldSkill?.attributeIds && worldSkill.attributeIds.length > 0) {
    // Use the first linked attribute for bonus calculation (MVP approach)
    const primaryAttributeId = worldSkill.attributeIds[0];
    const linkedAttribute = character.attributes.find(attr => 
      attr.attributeId === primaryAttributeId
    );
    
    if (linkedAttribute) {
      const attributeBonus = calculateAttributeBonus(linkedAttribute.value);
      totalSkillValue += attributeBonus;
    }
  }

  // Return true if total skill value meets or exceeds difficulty
  return totalSkillValue >= skillCheck.difficulty;
}

/**
 * Calculates the attribute bonus for a skill check
 * @param attributeValue - The character's attribute value
 * @returns The bonus amount (10% of attribute value, rounded)
 */
function calculateAttributeBonus(attributeValue: number): number {
  return Math.round(attributeValue * 0.1);
}

/**
 * Helper function to find a world skill by ID or name
 * @param skillIdentifier - Object with skillId or skillName
 * @param worldSkills - Array of world skills for lookup
 * @returns The WorldSkill if found, null otherwise
 */
export function findWorldSkill(
  skillIdentifier: { skillId?: string; skillName?: string }, 
  worldSkills: WorldSkill[]
): WorldSkill | null {
  return skillIdentifier.skillId 
    ? worldSkills.find(ws => ws.id === skillIdentifier.skillId) || null
    : worldSkills.find(ws => ws.name === skillIdentifier.skillName) || null;
}