/**
 * @fileoverview Tests for Skill Check Evaluator with D20 Rolls
 *
 * Tests covering:
 * - D20 roll mechanics and total calculation
 * - Critical successes (natural 20) and critical failures (natural 1)
 * - Untrained character attempts (skill level 0)
 * - DC calculation (required level × 2)
 * - Attribute bonus calculations
 * - Skill lookup by ID and name
 * - Error handling for missing skills
 *
 * @author Generated with Claude Code
 */

import { evaluateSkillCheck, rollD20 } from '../skillCheckEvaluator';
import {
  Character,
  CharacterSkill,
  CharacterAttribute,
} from '@/types/character.types';
import { WorldSkill } from '@/types/world.types';
import { SkillCheck } from '../skillCheckEvaluator';

// ============================================================================
// TEST DATA SETUP
// ============================================================================

/**
 * Mock character attributes for testing various attribute bonus scenarios
 */
const mockCharacterAttributes: CharacterAttribute[] = [
  { attributeId: 'strength', value: 20 },
  { attributeId: 'dexterity', value: 15 },
  { attributeId: 'intelligence', value: 18 },
];

/**
 * Mock character skills for testing skill evaluation logic
 */
const mockCharacterSkills: CharacterSkill[] = [
  { skillId: 'athletics', level: 8, experience: 0, isActive: true },
  { skillId: 'stealth', level: 5, experience: 0, isActive: true },
  { skillId: 'investigation', level: 12, experience: 0, isActive: true },
];

/**
 * Complete mock character with attributes and skills for comprehensive testing
 */
const mockCharacter: Partial<Character> = {
  id: 'test-character',
  name: 'Test Character',
  attributes: mockCharacterAttributes,
  skills: mockCharacterSkills,
};

/**
 * Mock world skills with different attribute links and difficulties for testing
 */
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
    maxValue: 20,
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
    maxValue: 20,
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
    maxValue: 20,
  },
];

// ============================================================================
// TEST SUITES
// ============================================================================

describe('rollD20', () => {
  it('should return a number between 1 and 20', () => {
    const results = new Set<number>();

    // Roll 1000 times to get good coverage
    for (let i = 0; i < 1000; i++) {
      const roll = rollD20();
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(20);
      results.add(roll);
    }

    // Should see variety (not all the same number)
    expect(results.size).toBeGreaterThan(10);
  });
});

describe('evaluateSkillCheck with d20 rolls', () => {
  beforeEach(() => {
    // Mock Math.random for deterministic tests
    jest.spyOn(Math, 'random');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('basic roll mechanics', () => {
    it('should roll d20 and calculate total correctly', () => {
      (Math.random as jest.Mock).mockReturnValue(0.95); // Returns 20

      const skillCheck: SkillCheck = {
        skillId: 'athletics',
        difficulty: 5, // DC will be 10
      };

      const result = evaluateSkillCheck(
        mockCharacter as Character,
        skillCheck,
        mockWorldSkills
      );

      expect(result.diceRoll).toBe(20);
      expect(result.skillLevel).toBe(8);
      expect(result.attributeBonus).toBe(2); // strength 20 * 0.1 = 2
      expect(result.total).toBe(30); // 20 + 8 + 2
      expect(result.dc).toBe(10); // difficulty 5 * 2
      expect(result.success).toBe(true);
      expect(result.isCriticalSuccess).toBe(true);
      expect(result.isCriticalFailure).toBe(false);
    });

    it('should calculate DC as required level × 2', () => {
      (Math.random as jest.Mock).mockReturnValue(0.5); // Returns 11

      const skillCheck: SkillCheck = {
        skillId: 'athletics',
        difficulty: 7, // DC should be 14
      };

      const result = evaluateSkillCheck(
        mockCharacter as Character,
        skillCheck,
        mockWorldSkills
      );

      expect(result.dc).toBe(14);
      expect(result.total).toBe(21); // 11 + 8 + 2
      expect(result.success).toBe(true); // 21 >= 14
    });

    it('should return serialization-safe ISO timestamp', () => {
      (Math.random as jest.Mock).mockReturnValue(0.5);

      const skillCheck: SkillCheck = {
        skillId: 'athletics',
        difficulty: 5,
      };

      const result = evaluateSkillCheck(
        mockCharacter as Character,
        skillCheck,
        mockWorldSkills
      );

      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
      expect(typeof result.timestamp).toBe('string');
    });
  });

  describe('critical successes', () => {
    it('should auto-succeed on natural 20 even if total < DC', () => {
      (Math.random as jest.Mock).mockReturnValue(0.95); // Returns 20

      const weakCharacter: Partial<Character> = {
        ...mockCharacter,
        skills: [], // No skills
        attributes: [{ attributeId: 'strength', value: 1 }], // Minimal attribute
      };

      const skillCheck: SkillCheck = {
        skillId: 'athletics',
        difficulty: 25, // DC 50 - impossible without crit
      };

      const result = evaluateSkillCheck(
        weakCharacter as Character,
        skillCheck,
        mockWorldSkills
      );

      expect(result.diceRoll).toBe(20);
      expect(result.skillLevel).toBe(0);
      expect(result.attributeBonus).toBe(0);
      expect(result.total).toBe(20); // 20 + 0 + 0
      expect(result.dc).toBe(50);
      expect(result.success).toBe(true); // Auto-success despite 20 < 50
      expect(result.isCriticalSuccess).toBe(true);
      expect(result.isCriticalFailure).toBe(false);
    });
  });

  describe('critical failures', () => {
    it('should auto-fail on natural 1 even if total >= DC', () => {
      (Math.random as jest.Mock).mockReturnValue(0.0); // Returns 1

      const expertCharacter: Partial<Character> = {
        ...mockCharacter,
        skills: [
          { skillId: 'athletics', level: 20, experience: 0, isActive: true },
        ],
        derivedStats: [],
        attributes: [{ attributeId: 'strength', value: 30 }],
      };

      const skillCheck: SkillCheck = {
        skillId: 'athletics',
        difficulty: 1, // DC 2 - should be trivial
      };

      const result = evaluateSkillCheck(
        expertCharacter as Character,
        skillCheck,
        mockWorldSkills
      );

      expect(result.diceRoll).toBe(1);
      expect(result.skillLevel).toBe(20);
      expect(result.attributeBonus).toBe(3); // 30 * 0.1 = 3
      expect(result.total).toBe(24); // 1 + 20 + 3
      expect(result.dc).toBe(2);
      expect(result.success).toBe(false); // Auto-fail despite 24 >= 2
      expect(result.isCriticalSuccess).toBe(false);
      expect(result.isCriticalFailure).toBe(true);
    });
  });

  describe('untrained character attempts', () => {
    it('should allow untrained characters (skill level 0) to attempt', () => {
      (Math.random as jest.Mock).mockReturnValue(0.9); // Returns 19

      const untrainedCharacter: Partial<Character> = {
        ...mockCharacter,
        skills: [], // No athletics skill
      };

      const skillCheck: SkillCheck = {
        skillId: 'athletics',
        difficulty: 5, // DC 10
      };

      const result = evaluateSkillCheck(
        untrainedCharacter as Character,
        skillCheck,
        mockWorldSkills
      );

      expect(result.skillLevel).toBe(0);
      expect(result.attributeBonus).toBe(2); // Still gets attribute bonus
      expect(result.total).toBe(21); // 19 + 0 + 2
      expect(result.success).toBe(true); // Can succeed with good roll
    });
  });

  describe('unknown skill handling', () => {
    it('should handle unknown skills gracefully with automatic critical failure', () => {
      const skillCheck: SkillCheck = {
        skillName: 'tunneling', // Skill that doesn't exist in world
        difficulty: 5,
      };

      const result = evaluateSkillCheck(
        mockCharacter as Character,
        skillCheck,
        mockWorldSkills
      );

      expect(result.skillName).toBe('tunneling');
      expect(result.diceRoll).toBe(1);
      expect(result.skillLevel).toBe(0);
      expect(result.attributeBonus).toBe(0);
      expect(result.total).toBe(1);
      expect(result.success).toBe(false);
      expect(result.isCriticalFailure).toBe(true);
    });

    it('should handle unknown skill IDs gracefully', () => {
      const skillCheck: SkillCheck = {
        skillId: 'nonexistent-skill-id',
        difficulty: 3,
      };

      const result = evaluateSkillCheck(
        mockCharacter as Character,
        skillCheck,
        mockWorldSkills
      );

      expect(result.skillId).toBe('nonexistent-skill-id');
      expect(result.success).toBe(false);
      expect(result.isCriticalFailure).toBe(true);
    });
  });

  describe('attribute bonus calculation', () => {
    it('should apply 10% attribute bonus rounded correctly', () => {
      (Math.random as jest.Mock).mockReturnValue(0.5); // Returns 11

      // Investigation: skill 12 + intelligence bonus (18 * 0.1 = 1.8 rounded to 2) = 14 + roll
      const skillCheck: SkillCheck = {
        skillId: 'investigation',
        difficulty: 7, // DC 14
      };

      const result = evaluateSkillCheck(
        mockCharacter as Character,
        skillCheck,
        mockWorldSkills
      );

      expect(result.attributeBonus).toBe(2); // Math.round(18 * 0.1) = 2
      expect(result.total).toBe(25); // 11 + 12 + 2
    });
  });

  describe('error handling', () => {
    it('should throw error when no skill identifier provided', () => {
      (Math.random as jest.Mock).mockReturnValue(0.5);

      const skillCheck: SkillCheck = {
        difficulty: 10,
      };

      expect(() => {
        evaluateSkillCheck(
          mockCharacter as Character,
          skillCheck,
          mockWorldSkills
        );
      }).toThrow('Skill check must have skillId or skillName');
    });
  });

  describe('standard success and failure', () => {
    it('should succeed when total >= DC (not critical)', () => {
      (Math.random as jest.Mock).mockReturnValue(0.5); // Returns 11

      const skillCheck: SkillCheck = {
        skillId: 'athletics',
        difficulty: 5, // DC 10
      };

      const result = evaluateSkillCheck(
        mockCharacter as Character,
        skillCheck,
        mockWorldSkills
      );

      expect(result.diceRoll).toBe(11);
      expect(result.total).toBe(21); // 11 + 8 + 2
      expect(result.dc).toBe(10);
      expect(result.success).toBe(true);
      expect(result.isCriticalSuccess).toBe(false);
      expect(result.isCriticalFailure).toBe(false);
    });

    it('should fail when total < DC (not critical)', () => {
      (Math.random as jest.Mock).mockReturnValue(0.05); // Returns 2

      const skillCheck: SkillCheck = {
        skillId: 'stealth',
        difficulty: 10, // DC 20
      };

      const result = evaluateSkillCheck(
        mockCharacter as Character,
        skillCheck,
        mockWorldSkills
      );

      expect(result.diceRoll).toBe(2);
      expect(result.skillLevel).toBe(5);
      expect(result.attributeBonus).toBe(2); // dex 15 * 0.1 rounded
      expect(result.total).toBe(9); // 2 + 5 + 2
      expect(result.dc).toBe(20);
      expect(result.success).toBe(false); // 9 < 20
      expect(result.isCriticalSuccess).toBe(false);
      expect(result.isCriticalFailure).toBe(false);
    });
  });
});
