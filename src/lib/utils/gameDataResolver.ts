import { EntityID } from '@/types/common.types';
import { WorldSkill, WorldAttribute } from '@/types/world.types';

export const resolveSkillData = (
  skillId: EntityID,
  worldSkills: WorldSkill[]
): WorldSkill | undefined => {
  return worldSkills.find(skill => skill.id === skillId);
};

export const resolveAttributeData = (
  attributeId: EntityID,
  worldAttributes: WorldAttribute[]
): WorldAttribute | undefined => {
  return worldAttributes.find(attribute => attribute.id === attributeId);
};