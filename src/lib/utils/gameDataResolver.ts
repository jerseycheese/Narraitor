import { EntityID } from '@/types/common.types';
import { WorldSkill, WorldAttribute } from '@/types/world.types';

export const resolveSkillData = (
  skillId: EntityID,
  worldSkills: WorldSkill[]
): WorldSkill | undefined => {
  // First try exact ID match
  let skill = worldSkills.find(skill => skill.id === skillId);
  
  // If no exact match, try case-insensitive name match
  if (!skill) {
    const normalizedSkillId = skillId.toLowerCase();
    skill = worldSkills.find(skill => 
      skill.name.toLowerCase() === normalizedSkillId ||
      skill.id.toLowerCase() === normalizedSkillId
    );
  }
  
  return skill;
};

export const resolveAttributeData = (
  attributeId: EntityID,
  worldAttributes: WorldAttribute[]
): WorldAttribute | undefined => {
  return worldAttributes.find(attribute => attribute.id === attributeId);
};