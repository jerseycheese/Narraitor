/**
 * @fileoverview Skill Check Evaluator Utility
 *
 * Provides probabilistic d20-based skill check evaluation for character abilities.
 * This utility is used by the narrative system to determine skill check outcomes.
 *
 * Key Features:
 * - D20 roll-based probabilistic evaluation
 * - Critical success (natural 20) and critical failure (natural 1)
 * - 10% attribute bonus calculation
 * - Support for skill ID or name lookup
 * - Untrained characters (skill level 0) can attempt checks
 *
 * @author Generated with Claude Code
 * @since v1.0.0
 */

import { Character } from '@/types/character.types';
import { WorldSkill } from '@/types/world.types';
import { SkillCheckRoll } from '@/types/narrative.types';

import Logger from '@/lib/utils/logger';
const logger = new Logger('SkillCheckEvaluator');

// ============================================================================
// DICE ROLLER
// ============================================================================

/**
 * Roll a d20 (1-20). Exported for testing.
 * In tests, mock Math.random to control rolls.
 */
export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

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
 * Performs a d20-based skill check evaluation for a character.
 *
 * This is the main entry point for skill check evaluation in the narrative system.
 * The evaluation is probabilistic and follows these steps:
 * 1. Find the skill in the world definition
 * 2. Get character's skill level (0 if untrained - anyone can attempt)
 * 3. Calculate attribute bonus (10% of linked attribute)
 * 4. Roll d20 and calculate total (roll + skill + attribute bonus)
 * 5. Evaluate success (criticals override, otherwise total >= DC)
 *
 * @param character - The character whose skills are being evaluated
 * @param skillCheck - The skill check parameters (skill identifier + difficulty)
 * @param worldSkills - Array of world skill definitions for lookup and bonus calculation
 * @returns SkillCheckRoll object with complete roll data and outcome
 *
 * @example
 * ```typescript
 * const character = {
 *   skills: [{ skillId: 'athletics', level: 8, isActive: true }],
 *   attributes: [{ attributeId: 'strength', value: 20 }]
 * };
 *
 * const skillCheck = { skillId: 'athletics', difficulty: 5 };  // DC will be 10
 *
 * const worldSkills = [{
 *   id: 'athletics',
 *   name: 'Athletics',
 *   attributeIds: ['strength']
 * }];
 *
 * // Returns SkillCheckRoll: { diceRoll: 12, skillLevel: 8, attributeBonus: 2, total: 22, dc: 10, success: true, ... }
 * const result = evaluateSkillCheck(character, skillCheck, worldSkills);
 * ```
 */
export function evaluateSkillCheck(
  character: Character,
  skillCheck: SkillCheck,
  worldSkills: WorldSkill[]
): SkillCheckRoll {
  // Step 1: Validate skill identifier
  if (!skillCheck.skillId && !skillCheck.skillName) {
    throw new Error('Skill check must have skillId or skillName');
  }

  // Step 2: Find skill definition in world
  const worldSkill = findWorldSkill(skillCheck, worldSkills);
  if (!worldSkill) {
    // AI generated a skill check for a skill that doesn't exist in this world
    // Return automatic failure instead of throwing
    const attemptedSkillName = skillCheck.skillName || skillCheck.skillId || 'Unknown Skill';
    logger.warn(`Skill not found: ${attemptedSkillName} - treating as automatic failure`);
    return {
      skillId: skillCheck.skillId || '',
      skillName: attemptedSkillName,
      diceRoll: 1, // Minimum roll
      skillLevel: 0,
      attributeBonus: 0,
      total: 1,
      dc: skillCheck.difficulty * 2, // Use standard DC calculation
      success: false,
      isCriticalSuccess: false,
      isCriticalFailure: true, // Unknown skill = critical failure
      timestamp: new Date().toISOString()
    };
  }

  // Step 3: Find character's skill level (0 if untrained)
  const characterSkill = character.skills.find(skill =>
    skill.skillId === worldSkill.id && skill.isActive
  );
  const skillLevel = characterSkill?.level || 0;  // Changed: allow 0

  // Step 4: Calculate attribute bonus (reuse existing helper)
  let attributeBonus = 0;
  if (worldSkill.attributeIds?.length && worldSkill.attributeIds.length > 0) {
    // Use primary attribute for bonus calculation (MVP: first attribute)
    const primaryAttributeId = worldSkill.attributeIds[0];
    const linkedAttribute = character.attributes.find(attr =>
      attr.attributeId === primaryAttributeId
    );

    if (linkedAttribute) {
      attributeBonus = calculateAttributeBonus(linkedAttribute.value);
    }
  }

  // Step 5: Calculate DC (no mutation, local const)
  const dc = skillCheck.difficulty * 2;

  // Step 6: Roll the dice!
  const diceRoll = rollD20();
  const total = diceRoll + skillLevel + attributeBonus;

  // Step 7: Evaluate outcome (criticals override normal)
  const isCriticalSuccess = diceRoll === 20;
  const isCriticalFailure = diceRoll === 1;
  const success = isCriticalSuccess || (!isCriticalFailure && total >= dc);

  return {
    diceRoll,
    skillLevel,
    attributeBonus,
    total,
    dc,
    success,
    isCriticalSuccess,
    isCriticalFailure,
    skillId: worldSkill.id,
    skillName: worldSkill.name,
    timestamp: new Date().toISOString()  // Serialization-safe
  };
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
 *
 * @internal This function is only used internally within this module
 */
function findWorldSkill(
  skillIdentifier: { skillId?: string; skillName?: string },
  worldSkills: WorldSkill[]
): WorldSkill | null {
  if (skillIdentifier.skillId) {
    const found = worldSkills.find(ws => ws.id === skillIdentifier.skillId) || null;
    if (!found) {
      logger.warn(`[findWorldSkill] No match for skillId: "${skillIdentifier.skillId}". Available skill IDs:`, worldSkills.map(ws => ws.id));
    }
    return found;
  }

  if (skillIdentifier.skillName) {
    const found = worldSkills.find(ws => ws.name === skillIdentifier.skillName) || null;
    if (!found) {
      logger.warn(`[findWorldSkill] No match for skillName: "${skillIdentifier.skillName}". Available skill names:`, worldSkills.map(ws => ws.name));
    }
    return found;
  }

  return null;
}