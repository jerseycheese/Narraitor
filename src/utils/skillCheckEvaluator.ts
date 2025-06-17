/**
 * @fileoverview Skill Check Evaluator Utility
 * 
 * Provides deterministic skill check evaluation for character abilities against skill requirements.
 * This utility is used by the narrative system to determine choice availability based on character skills.
 * 
 * Key Features:
 * - Deterministic evaluation (no RNG for MVP)
 * - 10% attribute bonus calculation
 * - Support for skill ID or name lookup
 * - Graceful handling of missing skills
 * 
 * @author Generated with Claude Code
 * @since v1.0.0
 */

import { Character } from '@/types/character.types';
import { WorldSkill } from '@/types/world.types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents a skill check to be evaluated against a character's abilities.
 * 
 * @interface SkillCheck
 * @example
 * ```typescript
 * // Using skill ID (preferred)
 * const skillCheck: SkillCheck = {
 *   skillId: 'athletics',
 *   difficulty: 8
 * };
 * 
 * // Using skill name (fallback)
 * const skillCheck: SkillCheck = {
 *   skillName: 'Athletics',
 *   difficulty: 8
 * };
 * ```
 */
export interface SkillCheck {
  /** The unique ID of the skill to check (preferred method) */
  skillId?: string;
  /** The name of the skill to check (fallback when ID unavailable) */
  skillName?: string;
  /** 
   * The difficulty level to check against.
   * Typically ranges from 1-20, with higher values being more difficult.
   */
  difficulty: number;
}

// ============================================================================
// CORE EVALUATION FUNCTION
// ============================================================================

/**
 * Evaluates whether a character passes a skill check based on their abilities and attributes.
 * 
 * This is the main entry point for skill check evaluation in the narrative system.
 * The evaluation is deterministic and follows these steps:
 * 1. Find the skill in the world definition
 * 2. Check if character has the skill and it's active
 * 3. Calculate total skill value (base skill + attribute bonus)
 * 4. Compare against difficulty threshold
 * 
 * @param character - The character whose skills are being evaluated
 * @param skillCheck - The skill check parameters (skill identifier + difficulty)
 * @param worldSkills - Array of world skill definitions for lookup and bonus calculation
 * @returns true if character meets or exceeds the skill difficulty, false otherwise
 * 
 * @example
 * ```typescript
 * const character = {
 *   skills: [{ skillId: 'athletics', level: 8, isActive: true }],
 *   attributes: [{ attributeId: 'strength', value: 20 }]
 * };
 * 
 * const skillCheck = { skillId: 'athletics', difficulty: 10 };
 * 
 * const worldSkills = [{
 *   id: 'athletics',
 *   name: 'Athletics', 
 *   attributeIds: ['strength']
 * }];
 * 
 * // Returns true: 8 (skill) + 2 (20 * 0.1 strength bonus) = 10 >= 10
 * const result = evaluateSkillCheck(character, skillCheck, worldSkills);
 * ```
 */
export function evaluateSkillCheck(
  character: Character,
  skillCheck: SkillCheck,
  worldSkills: WorldSkill[]
): boolean {
  // Step 1: Validate skill identifier
  if (!skillCheck.skillId && !skillCheck.skillName) {
    return false;
  }

  // Step 2: Find skill definition in world
  const worldSkill = findWorldSkill(skillCheck, worldSkills);
  if (!worldSkill) {
    return false;
  }

  // Step 3: Find character's skill level
  const characterSkill = character.skills.find(skill => 
    skill.skillId === worldSkill.id && skill.isActive
  );

  if (!characterSkill) {
    return false;
  }

  // Step 4: Calculate total skill value (base + attribute bonus)
  let totalSkillValue = characterSkill.level;
  
  if (worldSkill.attributeIds?.length && worldSkill.attributeIds.length > 0) {
    // Use primary attribute for bonus calculation (MVP: first attribute)
    const primaryAttributeId = worldSkill.attributeIds[0];
    const linkedAttribute = character.attributes.find(attr => 
      attr.attributeId === primaryAttributeId
    );
    
    if (linkedAttribute) {
      totalSkillValue += calculateAttributeBonus(linkedAttribute.value);
    }
  }

  // Step 5: Compare against difficulty threshold
  return totalSkillValue >= skillCheck.difficulty;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculates the attribute bonus applied to skill checks.
 * 
 * The bonus is 10% of the attribute value, rounded to the nearest integer.
 * This provides a meaningful but not overwhelming bonus from high attributes.
 * 
 * @param attributeValue - The character's attribute value
 * @returns The bonus amount (10% of attribute value, rounded)
 * 
 * @example
 * ```typescript
 * calculateAttributeBonus(20); // Returns 2
 * calculateAttributeBonus(15); // Returns 2 (1.5 rounded up)
 * calculateAttributeBonus(14); // Returns 1 (1.4 rounded down)
 * ```
 * 
 * @internal This function is not exported as it's an implementation detail
 */
function calculateAttributeBonus(attributeValue: number): number {
  return Math.round(attributeValue * 0.1);
}

/**
 * Finds a world skill definition by ID or name.
 * 
 * This helper implements the standard lookup pattern used throughout the codebase:
 * ID lookup is preferred for performance and reliability, with name lookup as fallback.
 * 
 * @param skillIdentifier - Object containing either skillId or skillName
 * @param worldSkills - Array of world skill definitions to search
 * @returns The matching WorldSkill if found, null otherwise
 * 
 * @example
 * ```typescript
 * // Preferred: lookup by ID
 * const skill1 = findWorldSkill({ skillId: 'athletics' }, worldSkills);
 * 
 * // Fallback: lookup by name
 * const skill2 = findWorldSkill({ skillName: 'Athletics' }, worldSkills);
 * 
 * // Invalid: no identifier
 * const skill3 = findWorldSkill({}, worldSkills); // Returns null
 * ```
 */
export function findWorldSkill(
  skillIdentifier: { skillId?: string; skillName?: string }, 
  worldSkills: WorldSkill[]
): WorldSkill | null {
  if (skillIdentifier.skillId) {
    return worldSkills.find(ws => ws.id === skillIdentifier.skillId) || null;
  }
  
  if (skillIdentifier.skillName) {
    return worldSkills.find(ws => ws.name === skillIdentifier.skillName) || null;
  }
  
  return null;
}