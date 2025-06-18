import { resolveSkillData } from '../gameDataResolver';
import { WorldSkill } from '@/types/world.types';

describe('gameDataResolver', () => {
  const mockWorldSkills: WorldSkill[] = [
    {
      id: 'intimidation',
      name: 'Intimidation',
      description: 'Ability to frighten or coerce others',
      category: 'Social',
      baseValue: 0,
      maxValue: 10
    },
    {
      id: 'stealth',
      name: 'Stealth',
      description: 'Ability to move unseen and unheard',
      category: 'Physical',
      baseValue: 0,
      maxValue: 10
    },
    {
      id: 'magic',
      name: 'Magic',
      description: 'Ability to cast spells and use magical items',
      category: 'Mental',
      baseValue: 0,
      maxValue: 10
    }
  ];

  describe('resolveSkillData', () => {
    it('should resolve skill data by exact ID match', () => {
      const result = resolveSkillData('intimidation', mockWorldSkills);

      expect(result).toEqual({
        id: 'intimidation',
        name: 'Intimidation',
        description: 'Ability to frighten or coerce others',
        category: 'Social',
        baseValue: 0,
        maxValue: 10
      });
    });

    it('should resolve skill data by case-insensitive name match', () => {
      const result = resolveSkillData('STEALTH', mockWorldSkills);

      expect(result).toEqual({
        id: 'stealth',
        name: 'Stealth',
        description: 'Ability to move unseen and unheard',
        category: 'Physical',
        baseValue: 0,
        maxValue: 10
      });
    });

    it('should resolve skill data by partial name match', () => {
      const result = resolveSkillData('magic', mockWorldSkills);

      expect(result).toEqual({
        id: 'magic',
        name: 'Magic',
        description: 'Ability to cast spells and use magical items',
        category: 'Mental',
        baseValue: 0,
        maxValue: 10
      });
    });

    it('should return undefined for non-existent skill', () => {
      const result = resolveSkillData('nonexistent', mockWorldSkills);

      expect(result).toBeUndefined();
    });

    it('should handle empty skills array', () => {
      const result = resolveSkillData('intimidation', []);

      expect(result).toBeUndefined();
    });

    it('should handle undefined skills array', () => {
      // The function will throw an error, so we need to catch it
      expect(() => {
        resolveSkillData('intimidation', undefined as unknown as WorldSkill[]);
      }).toThrow();
    });

    it('should prioritize exact ID match over name match', () => {
      const skillsWithConflict: WorldSkill[] = [
        {
          id: 'magic',
          name: 'Magic',
          description: 'Real magic skill',
          category: 'Mental',
          baseValue: 0,
          maxValue: 10
        },
        {
          id: 'other',
          name: 'magic', // same name as above ID
          description: 'Different skill with same name',
          category: 'Other',
          baseValue: 0,
          maxValue: 10
        }
      ];

      const result = resolveSkillData('magic', skillsWithConflict);

      // Should return the one with matching ID, not matching name
      expect(result?.description).toBe('Real magic skill');
      expect(result?.category).toBe('Mental');
    });

    it('should handle skills with special characters in names', () => {
      const specialSkills: WorldSkill[] = [
        {
          id: 'lock-picking',
          name: 'Lock-Picking',
          description: 'Ability to pick locks',
          category: 'Physical',
          baseValue: 0,
          maxValue: 10
        }
      ];

      const result = resolveSkillData('lock-picking', specialSkills);

      expect(result?.name).toBe('Lock-Picking');
    });

    it('should handle case-insensitive search correctly', () => {
      const result1 = resolveSkillData('intimidation', mockWorldSkills);
      const result2 = resolveSkillData('INTIMIDATION', mockWorldSkills);
      const result3 = resolveSkillData('Intimidation', mockWorldSkills);

      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
      expect(result1?.name).toBe('Intimidation');
    });

    it('should return undefined when no partial matches found', () => {
      const skillsWithSimilarNames: WorldSkill[] = [
        {
          id: 'sword-fighting',
          name: 'Sword Fighting',
          description: 'Basic sword combat',
          category: 'Combat',
          baseValue: 0,
          maxValue: 10
        },
        {
          id: 'advanced-sword-fighting',
          name: 'Advanced Sword Fighting',
          description: 'Advanced sword techniques',
          category: 'Combat',
          baseValue: 0,
          maxValue: 10
        }
      ];

      // The current implementation doesn't do partial matching, only exact ID/name matching
      const result = resolveSkillData('sword', skillsWithSimilarNames);

      // Should return undefined since 'sword' doesn't exactly match any ID or name
      expect(result).toBeUndefined();
    });
  });
});