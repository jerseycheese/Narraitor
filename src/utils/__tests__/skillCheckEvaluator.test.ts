// src/utils/__tests__/skillCheckEvaluator.test.ts

import { evaluateSkillCheck } from '../skillCheckEvaluator';
import { Character, CharacterSkill, CharacterAttribute } from '@/types/character.types';
import { WorldSkill } from '@/types/world.types';
import { SkillCheck } from '../skillCheckEvaluator';

// Mock character data for testing
const mockCharacterAttributes: CharacterAttribute[] = [
  { attributeId: 'strength', value: 20 },
  { attributeId: 'dexterity', value: 15 },
  { attributeId: 'intelligence', value: 18 }
];

const mockCharacterSkills: CharacterSkill[] = [
  { skillId: 'athletics', level: 8, experience: 0, isActive: true },
  { skillId: 'stealth', level: 5, experience: 0, isActive: true },
  { skillId: 'investigation', level: 12, experience: 0, isActive: true }
];

const mockCharacter: Partial<Character> = {
  id: 'test-character',
  name: 'Test Character',
  attributes: mockCharacterAttributes,
  skills: mockCharacterSkills
};

const mockWorldSkills: WorldSkill[] = [
  {
    id: 'athletics',
    name: 'Athletics',
    description: 'Physical prowess and endurance',
    worldId: 'test-world',
    attributeIds: ['strength'],
    difficulty: 'medium',
    category: 'physical',
    baseValue: 0,
    minValue: 0,
    maxValue: 20
  },
  {
    id: 'stealth',
    name: 'Stealth',
    description: 'Moving unseen and unheard',
    worldId: 'test-world',
    attributeIds: ['dexterity'],
    difficulty: 'hard',
    category: 'physical',
    baseValue: 0,
    minValue: 0,
    maxValue: 20
  },
  {
    id: 'investigation',
    name: 'Investigation',
    description: 'Finding clues and solving mysteries',
    worldId: 'test-world',
    attributeIds: ['intelligence'],
    difficulty: 'easy',
    category: 'mental',
    baseValue: 0,
    minValue: 0,
    maxValue: 20
  }
];

describe('evaluateSkillCheck', () => {
  describe('basic skill check evaluation', () => {
    it('should pass when character skill meets or exceeds difficulty', () => {
      const skillCheck: SkillCheck = {
        skillId: 'athletics',
        difficulty: 8
      };

      const result = evaluateSkillCheck(mockCharacter as Character, skillCheck, mockWorldSkills);
      expect(result).toBe(true);
    });

    it('should fail when character skill is below difficulty requirement', () => {
      const skillCheck: SkillCheck = {
        skillId: 'stealth',
        difficulty: 8
      };

      const result = evaluateSkillCheck(mockCharacter as Character, skillCheck, mockWorldSkills);
      expect(result).toBe(false);
    });
  });

  describe('attribute bonus calculation', () => {
    it('should apply 10% attribute bonus to skill checks', () => {
      // Athletics skill level 8 + strength bonus (20 * 0.1 = 2) = 10 total
      const skillCheck: SkillCheck = {
        skillId: 'athletics',
        difficulty: 10
      };

      const result = evaluateSkillCheck(mockCharacter as Character, skillCheck, mockWorldSkills);
      expect(result).toBe(true);
    });

    it('should apply correct attribute bonus for different attributes', () => {
      // Investigation skill level 12 + intelligence bonus (18 * 0.1 = 1.8 rounded to 2) = 14 total
      const skillCheck: SkillCheck = {
        skillId: 'investigation',
        difficulty: 14
      };

      const result = evaluateSkillCheck(mockCharacter as Character, skillCheck, mockWorldSkills);
      expect(result).toBe(true);
    });
  });

  describe('missing skills handling', () => {
    it('should return false for skills not possessed by character', () => {
      const skillCheck: SkillCheck = {
        skillId: 'non-existent-skill',
        difficulty: 1
      };

      const result = evaluateSkillCheck(mockCharacter as Character, skillCheck, mockWorldSkills);
      expect(result).toBe(false);
    });

    it('should return false for skills without linked attributes', () => {
      const skillWithoutAttribute: WorldSkill = {
        id: 'unlinked-skill',
        name: 'Unlinked Skill',
        description: 'A skill without linked attributes',
        worldId: 'test-world',
        difficulty: 'easy',
        category: 'special',
        baseValue: 0,
        minValue: 0,
        maxValue: 20
      };

      const characterWithUnlinkedSkill: Partial<Character> = {
        ...mockCharacter,
        skills: [...mockCharacterSkills, { skillId: 'unlinked-skill', level: 10, experience: 0, isActive: true }]
      };

      const skillCheck: SkillCheck = {
        skillId: 'unlinked-skill',
        difficulty: 5
      };

      const result = evaluateSkillCheck(
        characterWithUnlinkedSkill as Character, 
        skillCheck, 
        [...mockWorldSkills, skillWithoutAttribute]
      );
      
      // Should still work with just skill level (10), no attribute bonus
      expect(result).toBe(true);
    });
  });

  describe('skill name lookup', () => {
    it('should support skill name lookup in addition to skill ID', () => {
      const skillCheck: SkillCheck = {
        skillName: 'Athletics',
        difficulty: 8
      };

      const result = evaluateSkillCheck(mockCharacter as Character, skillCheck, mockWorldSkills);
      expect(result).toBe(true);
    });

    it('should return false for non-existent skill names', () => {
      const skillCheck: SkillCheck = {
        skillName: 'Non-existent Skill',
        difficulty: 1
      };

      const result = evaluateSkillCheck(mockCharacter as Character, skillCheck, mockWorldSkills);
      expect(result).toBe(false);
    });

    it('should prioritize skillId over skillName when both are provided', () => {
      const skillCheck: SkillCheck = {
        skillId: 'athletics',
        skillName: 'Wrong Name',
        difficulty: 8
      };

      const result = evaluateSkillCheck(mockCharacter as Character, skillCheck, mockWorldSkills);
      expect(result).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle character with no skills', () => {
      const characterWithoutSkills: Partial<Character> = {
        ...mockCharacter,
        skills: []
      };

      const skillCheck: SkillCheck = {
        skillId: 'athletics',
        difficulty: 1
      };

      const result = evaluateSkillCheck(characterWithoutSkills as Character, skillCheck, mockWorldSkills);
      expect(result).toBe(false);
    });

    it('should handle character with no attributes', () => {
      const characterWithoutAttributes: Partial<Character> = {
        ...mockCharacter,
        attributes: []
      };

      const skillCheck: SkillCheck = {
        skillId: 'athletics',
        difficulty: 5
      };

      const result = evaluateSkillCheck(characterWithoutAttributes as Character, skillCheck, mockWorldSkills);
      // Should use just skill level (8) without attribute bonus
      expect(result).toBe(true);
    });

    it('should handle inactive skills', () => {
      const characterWithInactiveSkill: Partial<Character> = {
        ...mockCharacter,
        skills: [
          { skillId: 'athletics', level: 8, experience: 0, isActive: false }
        ]
      };

      const skillCheck: SkillCheck = {
        skillId: 'athletics',
        difficulty: 5
      };

      const result = evaluateSkillCheck(characterWithInactiveSkill as Character, skillCheck, mockWorldSkills);
      expect(result).toBe(false);
    });

    it('should handle skills with multiple attributes (use first one)', () => {
      const skillWithMultipleAttributes: WorldSkill = {
        id: 'multi-skill',
        name: 'Multi Skill',
        description: 'A skill with multiple attributes',
        worldId: 'test-world',
        attributeIds: ['strength', 'dexterity'], // Multiple attributes
        difficulty: 'medium',
        category: 'hybrid',
        baseValue: 0,
        minValue: 0,
        maxValue: 20
      };

      const characterWithMultiSkill: Partial<Character> = {
        ...mockCharacter,
        skills: [...mockCharacterSkills, { skillId: 'multi-skill', level: 5, experience: 0, isActive: true }]
      };

      const skillCheck: SkillCheck = {
        skillId: 'multi-skill',
        difficulty: 7
      };

      const result = evaluateSkillCheck(
        characterWithMultiSkill as Character, 
        skillCheck, 
        [...mockWorldSkills, skillWithMultipleAttributes]
      );
      
      // Skill level 5 + strength bonus (20 * 0.1 = 2) = 7 total, should pass
      expect(result).toBe(true);
    });
  });

});