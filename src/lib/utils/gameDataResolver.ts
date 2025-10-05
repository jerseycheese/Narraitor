import { EntityID } from '@/types/common.types';
import { WorldSkill } from '@/types/world.types';

export const resolveSkillData = (
  skillId: EntityID,
  worldSkills: WorldSkill[]
): WorldSkill | undefined => {
  // Handle undefined/null skillId
  if (!skillId) {
    return undefined;
  }

  // First try exact ID match
  let skill = worldSkills.find(skill => skill.id === skillId);

  // If no exact match, try case-insensitive name match
  if (!skill) {
    const normalizedSkillId = String(skillId).toLowerCase();
    skill = worldSkills.find(skill => {
      const nameMatches = typeof (skill as Partial<WorldSkill>).name === 'string'
        ? (skill as Partial<WorldSkill>).name!.toLowerCase() === normalizedSkillId
        : false;
      const idMatches = typeof (skill as Partial<WorldSkill>).id === 'string'
        ? (skill as Partial<WorldSkill>).id!.toLowerCase() === normalizedSkillId
        : false;
      return nameMatches || idMatches;
    });
  }

  return skill;
};
