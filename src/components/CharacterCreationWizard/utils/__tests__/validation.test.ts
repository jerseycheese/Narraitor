import { isCharacterNameUnique, validateAttributes, validateSkills, validateBackground } from '../validation';
import { useCharacterStore } from '@/state/characterStore';
import { mockZustandStore, createMockCharacterStore } from '@/lib/test-utils';

// Mock useCharacterStore
jest.mock('@/state/characterStore');

describe('Character Creation Validation', () => {
  describe('isCharacterNameUnique', () => {
    beforeEach(() => {
      mockZustandStore(useCharacterStore as jest.MockedFunction<typeof useCharacterStore>, createMockCharacterStore({
        characters: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          'char-1': { id: 'char-1', name: 'Existing Hero', worldId: 'world-1' } as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          'char-2': { id: 'char-2', name: 'Another Hero', worldId: 'world-2' } as any,
        },
      }));
    });

    it('returns false when name already exists in same world', () => {
      expect(isCharacterNameUnique('Existing Hero', 'world-1')).toBe(false);
    });

    it('allows same name in different world', () => {
      expect(isCharacterNameUnique('Existing Hero', 'world-3')).toBe(true);
    });

    it('allows a unique name', () => {
      expect(isCharacterNameUnique('New Hero', 'world-1')).toBe(true);
    });
  });

  describe('validateAttributes', () => {
    const mockAttributes = [
      { attributeId: 'attr-1', name: 'Strength', value: 5, minValue: 1, maxValue: 10 },
      { attributeId: 'attr-2', name: 'Intelligence', value: 5, minValue: 1, maxValue: 10 },
      { attributeId: 'attr-3', name: 'Dexterity', value: 5, minValue: 1, maxValue: 10 },
    ];

    it('allows under-spending attribute points', () => {
      const result = validateAttributes(mockAttributes, 20); // 15 spent, 20 available
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates successfully when points match pool', () => {
      const result = validateAttributes(mockAttributes, 15); // 15 spent, 15 required
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns error when points exceed the pool', () => {
      const result = validateAttributes(mockAttributes, 10); // 15 spent, 10 available
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('You have allocated more attribute points than available.');
    });

    it('handles empty attributes array', () => {
      const result = validateAttributes([], 20);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one attribute is required.');
    });

    it('allows progression when pool exceeds total attribute capacity', () => {
      const cappedAttributes = [
        { attributeId: 'attr-1', name: 'Strength', value: 4, minValue: 1, maxValue: 5 },
        { attributeId: 'attr-2', name: 'Intelligence', value: 4, minValue: 1, maxValue: 5 },
        { attributeId: 'attr-3', name: 'Dexterity', value: 4, minValue: 1, maxValue: 5 },
      ];
      const result = validateAttributes(cappedAttributes, 30);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateSkills', () => {
    const mockSkills = [
      { skillId: 'skill-1', name: 'Swordsmanship', level: 3, isSelected: true },
      { skillId: 'skill-2', name: 'Magic', level: 2, isSelected: true },
      { skillId: 'skill-3', name: 'Stealth', level: 1, isSelected: false },
    ];
    const mockWorldSkills = mockSkills.map(skill => ({
      id: skill.skillId,
      minValue: 1,
      maxValue: 5,
    }));

    it('returns error when no skills selected', () => {
      const noSelectedSkills = mockSkills.map(s => ({ ...s, isSelected: false }));
      const result = validateSkills(noSelectedSkills, 3, mockWorldSkills);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Select at least one skill');
    });

    it('returns error when too many skills selected', () => {
      const manySkills = Array.from({ length: 10 }, (_, i) => ({
        skillId: `skill-${i}`,
        name: `Skill ${i}`,
        level: 1,
        isSelected: true,
      }));
      const result = validateSkills(manySkills, 0, mockWorldSkills);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Maximum 8 skills allowed');
    });

    it('validates successfully with valid skill selection', () => {
      const result = validateSkills(mockSkills, 3, mockWorldSkills);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('allows under-spending skill points within the pool', () => {
      const result = validateSkills(mockSkills, 6, mockWorldSkills);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns error when skill points exceed the pool', () => {
      const result = validateSkills(mockSkills, 2, mockWorldSkills);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('You have allocated more skill points than available.');
    });

    it('flags skills that cannot be leveled due to identical bounds', () => {
      const stagnantSkill = [{ skillId: 'skill-locked', name: 'Locked Skill', level: 1, isSelected: true }];
      const worldMeta = [{ id: 'skill-locked', minValue: 1, maxValue: 1 }];
      const result = validateSkills(stagnantSkill, 0, worldMeta);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Skill Locked Skill cannot be leveled because its configuration has no available range.'
      );
    });

    it('allows progression when pool exceeds total capacity but skills are maxed out', () => {
      const highPoolSkills = [
        { skillId: 'skill-1', name: 'Blade', level: 5, isSelected: true, minLevel: 1, maxLevel: 5 },
        { skillId: 'skill-2', name: 'Bow', level: 5, isSelected: true, minLevel: 1, maxLevel: 5 },
      ];
      const worldMeta = [
        { id: 'skill-1', minValue: 1, maxValue: 5 },
        { id: 'skill-2', minValue: 1, maxValue: 5 },
      ];
      const result = validateSkills(highPoolSkills, 20, worldMeta);

      expect(result.valid).toBe(true);
    });

    it('allows progression when pool exceeds total capacity even if points remain unspent', () => {
      const highPoolSkills = [
        { skillId: 'skill-1', name: 'Blade', level: 3, isSelected: true, minLevel: 1, maxLevel: 5 },
        { skillId: 'skill-2', name: 'Bow', level: 3, isSelected: true, minLevel: 1, maxLevel: 5 },
      ];
      const worldMeta = [
        { id: 'skill-1', minValue: 1, maxValue: 5 },
        { id: 'skill-2', minValue: 1, maxValue: 5 },
      ];
      const result = validateSkills(highPoolSkills, 20, worldMeta);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateBackground', () => {
    const mockBackground = {
      history: 'A long and detailed history about the character that meets the minimum length requirement.',
      personality: 'A cheerful and brave soul',
      goals: ['Become a hero', 'Save the world'],
      motivation: 'To protect the innocent',
    };

    it('returns error when history is too short', () => {
      const shortHistory = { ...mockBackground, history: 'Too short' };
      const result = validateBackground(shortHistory);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Character history must be at least 50 characters');
    });

    it('returns error when personality is too short', () => {
      const shortPersonality = { ...mockBackground, personality: 'Short' };
      const result = validateBackground(shortPersonality);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Personality description must be at least 20 characters');
    });

    it('validates successfully with valid background', () => {
      const result = validateBackground(mockBackground);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('allows empty goals and motivation', () => {
      const minimalBackground = {
        ...mockBackground,
        goals: [],
        motivation: '',
      };
      const result = validateBackground(minimalBackground);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
