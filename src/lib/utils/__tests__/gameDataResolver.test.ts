import { resolveSkillData, resolveAttributeData } from '../gameDataResolver';
import { WorldSkill, WorldAttribute } from '@/types/world.types';

describe('gameDataResolver', () => {
  const mockWorldSkills: WorldSkill[] = [
    {
      id: 'intimidation',
      name: 'Intimidation',
      description: 'Ability to intimidate others',
      worldId: 'world1',
      difficulty: 'medium',
      baseValue: 1,
      minValue: 1,
      maxValue: 10
    },
    {
      id: 'stealth',
      name: 'Stealth',
      description: 'Ability to move unseen',
      worldId: 'world1',
      difficulty: 'hard',
      baseValue: 1,
      minValue: 1,
      maxValue: 10
    }
  ];

  const mockWorldAttributes: WorldAttribute[] = [
    {
      id: 'strength',
      name: 'Strength',
      description: 'Physical power',
      worldId: 'world1',
      baseValue: 10,
      minValue: 1,
      maxValue: 20
    }
  ];

  describe('resolveSkillData', () => {
    it('returns skill data when skill exists', () => {
      const result = resolveSkillData('intimidation', mockWorldSkills);
      expect(result).toEqual(mockWorldSkills[0]);
    });

    it('returns undefined when skill does not exist', () => {
      const result = resolveSkillData('nonexistent', mockWorldSkills);
      expect(result).toBeUndefined();
    });
  });

  describe('resolveAttributeData', () => {
    it('returns attribute data when attribute exists', () => {
      const result = resolveAttributeData('strength', mockWorldAttributes);
      expect(result).toEqual(mockWorldAttributes[0]);
    });

    it('returns undefined when attribute does not exist', () => {
      const result = resolveAttributeData('nonexistent', mockWorldAttributes);
      expect(result).toBeUndefined();
    });
  });
});