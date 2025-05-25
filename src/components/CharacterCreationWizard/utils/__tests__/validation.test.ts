import { validateCharacterName, validateAttributes, validateSkills, validateBackground } from '../validation';
import { characterStore } from '@/state/characterStore';

// Mock characterStore
jest.mock('@/state/characterStore');

describe('Character Creation Validation', () => {
  describe('validateCharacterName', () => {
    beforeEach(() => {
      const mockStore = {
        characters: {
          'char-1': { id: 'char-1', name: 'Existing Hero', worldId: 'world-1' },
          'char-2': { id: 'char-2', name: 'Another Hero', worldId: 'world-2' },
        },
        getState: jest.fn(() => ({
          characters: {
            'char-1': { id: 'char-1', name: 'Existing Hero', worldId: 'world-1' },
            'char-2': { id: 'char-2', name: 'Another Hero', worldId: 'world-2' },
          },
        })),
      };
      (characterStore as unknown as jest.Mock).mockReturnValue(mockStore);
      (characterStore as unknown as { getState: typeof mockStore.getState }).getState = mockStore.getState;
    });

    it('returns error when name is empty', () => {
      const result = validateCharacterName('', 'world-1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    it('returns error when name is too short', () => {
      const result = validateCharacterName('AB', 'world-1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name must be at least 3 characters');
    });

    it('returns error when name is too long', () => {
      const longName = 'A'.repeat(51);
      const result = validateCharacterName(longName, 'world-1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name must be less than 50 characters');
    });

    it('returns error when name already exists in same world', () => {
      const result = validateCharacterName('Existing Hero', 'world-1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('A character with this name already exists in this world');
    });

    it('allows same name in different world', () => {
      const result = validateCharacterName('Existing Hero', 'world-3');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates successfully for valid unique name', () => {
      const result = validateCharacterName('New Hero', 'world-1');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateAttributes', () => {
    const mockAttributes = [
      { attributeId: 'attr-1', name: 'Strength', value: 5, minValue: 1, maxValue: 10 },
      { attributeId: 'attr-2', name: 'Intelligence', value: 5, minValue: 1, maxValue: 10 },
      { attributeId: 'attr-3', name: 'Dexterity', value: 5, minValue: 1, maxValue: 10 },
    ];

    it('returns error when points spent does not match pool', () => {
      const result = validateAttributes(mockAttributes, 20); // 15 spent, 20 required
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must spend exactly 20 points (15 spent)');
    });

    it('validates successfully when points match pool', () => {
      const result = validateAttributes(mockAttributes, 15); // 15 spent, 15 required
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('handles empty attributes array', () => {
      const result = validateAttributes([], 20);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must spend exactly 20 points (0 spent)');
    });
  });

  describe('validateSkills', () => {
    const mockSkills = [
      { skillId: 'skill-1', name: 'Swordsmanship', level: 3, isSelected: true },
      { skillId: 'skill-2', name: 'Magic', level: 2, isSelected: true },
      { skillId: 'skill-3', name: 'Stealth', level: 1, isSelected: false },
    ];

    it('returns error when no skills selected', () => {
      const noSelectedSkills = mockSkills.map(s => ({ ...s, isSelected: false }));
      const result = validateSkills(noSelectedSkills);
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
      const result = validateSkills(manySkills);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Maximum 8 skills allowed');
    });

    it('validates successfully with valid skill selection', () => {
      const result = validateSkills(mockSkills);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
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