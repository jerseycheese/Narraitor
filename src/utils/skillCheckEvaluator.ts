// Probabilistic d20-based skill check evaluation used by the narrative system.

import { CharacterSkill, CharacterAttribute } from '@/types/character.types';
import { WorldSkill } from '@/types/world.types';
import { SkillCheckRoll } from '@/types/narrative.types';

import Logger from '@/lib/utils/logger';
const logger = new Logger('SkillCheckEvaluator');

// Exported so tests can mock Math.random to control rolls.
export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export interface SkillCheck {
  /** Preferred lookup key. */
  skillId?: string;
  /** Fallback when ID is unavailable. */
  skillName?: string;
  difficulty: number;
}

export interface SkillCheckSubject {
  skills: (Pick<CharacterSkill, 'skillId' | 'level'> & { isActive?: boolean })[];
  attributes: Pick<CharacterAttribute, 'attributeId' | 'value'>[];
}

export function evaluateSkillCheck(
  character: SkillCheckSubject,
  skillCheck: SkillCheck,
  worldSkills: WorldSkill[]
): SkillCheckRoll {
  if (!skillCheck.skillId && !skillCheck.skillName) {
    throw new Error('Skill check must have skillId or skillName');
  }

  const worldSkill = findWorldSkill(skillCheck, worldSkills);
  if (!worldSkill) {
    // AI referenced a skill that doesn't exist in this world: auto-fail rather than throw.
    const attemptedSkillName = skillCheck.skillName || skillCheck.skillId || 'Unknown Skill';
    logger.warn(`Skill not found: ${attemptedSkillName} - treating as automatic failure`);
    return {
      skillId: skillCheck.skillId || '',
      skillName: attemptedSkillName,
      diceRoll: 1,
      skillLevel: 0,
      attributeBonus: 0,
      total: 1,
      dc: skillCheck.difficulty * 2,
      success: false,
      isCriticalSuccess: false,
      isCriticalFailure: true,
      timestamp: new Date().toISOString()
    };
  }

  // Untrained (skill level 0) is allowed: anyone can attempt.
  const characterSkill = character.skills.find(skill =>
    skill.skillId === worldSkill.id && skill.isActive !== false
  );
  const skillLevel = characterSkill?.level || 0;

  let attributeBonus = 0;
  if (worldSkill.attributeIds?.length && worldSkill.attributeIds.length > 0) {
    const primaryAttributeId = worldSkill.attributeIds[0];
    const linkedAttribute = character.attributes.find(attr =>
      attr.attributeId === primaryAttributeId
    );

    if (linkedAttribute) {
      attributeBonus = calculateAttributeBonus(linkedAttribute.value);
    }
  }

  const dc = skillCheck.difficulty * 2;

  const diceRoll = rollD20();
  const total = diceRoll + skillLevel + attributeBonus;

  // Criticals override the normal threshold.
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
    timestamp: new Date().toISOString()
  };
}

// 10% of the attribute value, rounded.
function calculateAttributeBonus(attributeValue: number): number {
  return Math.round(attributeValue * 0.1);
}

// ID lookup preferred, name lookup as fallback.
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
