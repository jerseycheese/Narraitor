// src/utils/__tests__/skillCheckEvaluator.test.ts

import {
  evaluateSkillCheck,
  canPassSkillCheck,
  createSkillCheckFromDifficulty,
  SkillCheck
} from '../skillCheckEvaluator';
import { Character } from '@/types/character.types';
import { World } from '@/types/world.types';

// Test data setup
const mockCharacter: Character = {
  id: 'char-1',
  name: 'Test Character',
  description: 'A test character',
  worldId: 'world-1',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  attributes: [
    { attributeId: 'attr-strength', value: 15 },
    { attributeId: 'attr-intelligence', value: 20 },
    { attributeId: 'attr-dexterity', value: 12 }
  ],
  skills: [
    { skillId: 'skill-swordsmanship', level: 8, experience: 100, isActive: true },
    { skillId: 'skill-magic', level: 5, experience: 50, isActive: true },
    { skillId: 'skill-stealth', level: 3, experience: 25, isActive: true }
  ],
  background: {
    history: 'Test history',
    personality: 'Test personality',
    goals: [],
    fears: [],
    relationships: []
  },
  inventory: {
    items: [],
    capacity: 10,
    currentWeight: 0,
    maxWeight: 100
  },
  status: {
    health: 100,
    maxHealth: 100,
    conditions: [],
    location: 'Test Location'
  }
};

const mockWorld: World = {
  id: 'world-1',
  name: 'Test World',
  description: 'A test world',
  theme: 'Fantasy',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  attributes: [
    { id: 'attr-strength', name: 'Strength', description: 'Physical power', worldId: 'world-1', baseValue: 10, minValue: 1, maxValue: 20 },
    { id: 'attr-intelligence', name: 'Intelligence', description: 'Mental acuity', worldId: 'world-1', baseValue: 10, minValue: 1, maxValue: 20 },
    { id: 'attr-dexterity', name: 'Dexterity', description: 'Agility and coordination', worldId: 'world-1', baseValue: 10, minValue: 1, maxValue: 20 }
  ],
  skills: [
    { id: 'skill-swordsmanship', name: 'Swordsmanship', description: 'Combat with swords', worldId: 'world-1', linkedAttributeId: 'attr-strength', difficulty: 'medium', baseValue: 1, minValue: 1, maxValue: 10 },
    { id: 'skill-magic', name: 'Magic', description: 'Casting spells', worldId: 'world-1', linkedAttributeId: 'attr-intelligence', difficulty: 'hard', baseValue: 1, minValue: 1, maxValue: 10 },
    { id: 'skill-stealth', name: 'Stealth', description: 'Moving unseen', worldId: 'world-1', linkedAttributeId: 'attr-dexterity', difficulty: 'easy', baseValue: 1, minValue: 1, maxValue: 10 }
  ],
  settings: {
    maxAttributes: 6,
    maxSkills: 10,
    attributePointPool: 50,
    skillPointPool: 20
  }
};

describe('evaluateSkillCheck', () => {
  describe('basic skill check evaluation', () => {
    it('should pass when character skill meets difficulty threshold', () => {
      const skillCheck: SkillCheck = {
        skillId: 'skill-swordsmanship',
        difficulty: 6,
        useAttributeModifier: false
      };

      const result = evaluateSkillCheck(mockCharacter, skillCheck);

      expect(result.success).toBe(true);
      expect(result.characterSkillValue).toBe(8);
      expect(result.attributeModifier).toBe(0);
      expect(result.totalValue).toBe(8);
      expect(result.difficultyThreshold).toBe(6);
      expect(result.details).toContain('Skill check passed');
    });

    it('should fail when character skill is below difficulty threshold', () => {
      const skillCheck: SkillCheck = {
        skillId: 'skill-stealth',
        difficulty: 5,
        useAttributeModifier: false
      };

      const result = evaluateSkillCheck(mockCharacter, skillCheck);

      expect(result.success).toBe(false);
      expect(result.characterSkillValue).toBe(3);
      expect(result.attributeModifier).toBe(0);
      expect(result.totalValue).toBe(3);
      expect(result.difficultyThreshold).toBe(5);
      expect(result.details).toContain('Skill check failed');
    });

    it('should pass when character skill exactly meets difficulty threshold', () => {
      const skillCheck: SkillCheck = {
        skillId: 'skill-magic',
        difficulty: 5,
        useAttributeModifier: false
      };

      const result = evaluateSkillCheck(mockCharacter, skillCheck);

      expect(result.success).toBe(true);
      expect(result.characterSkillValue).toBe(5);
      expect(result.totalValue).toBe(5);
      expect(result.difficultyThreshold).toBe(5);
    });
  });

  describe('attribute modifier calculation', () => {
    it('should include attribute modifier by default', () => {
      const skillCheck: SkillCheck = {
        skillId: 'skill-magic',
        difficulty: 7
      };

      const result = evaluateSkillCheck(mockCharacter, skillCheck, mockWorld);

      expect(result.success).toBe(true); // 5 skill + 2 modifier = 7, exactly meets threshold
      expect(result.characterSkillValue).toBe(5);
      expect(result.attributeModifier).toBe(2); // 10% of 20 intelligence = 2
      expect(result.totalValue).toBe(7);
    });

    it('should calculate attribute modifier as 10% of attribute value', () => {
      const skillCheck: SkillCheck = {
        skillId: 'skill-swordsmanship',
        difficulty: 10
      };

      const result = evaluateSkillCheck(mockCharacter, skillCheck, mockWorld);

      expect(result.attributeModifier).toBe(1); // 10% of 15 strength = 1.5, floored to 1
      expect(result.totalValue).toBe(9); // 8 skill + 1 modifier
    });

    it('should not include attribute modifier when explicitly disabled', () => {
      const skillCheck: SkillCheck = {
        skillId: 'skill-magic',
        difficulty: 6,
        useAttributeModifier: false
      };

      const result = evaluateSkillCheck(mockCharacter, skillCheck, mockWorld);

      expect(result.attributeModifier).toBe(0);
      expect(result.totalValue).toBe(5); // Only skill level, no modifier
    });

    it('should handle missing world gracefully when attribute modifier requested', () => {
      const skillCheck: SkillCheck = {
        skillId: 'skill-magic',
        difficulty: 6
      };

      const result = evaluateSkillCheck(mockCharacter, skillCheck);

      expect(result.attributeModifier).toBe(0);
      expect(result.totalValue).toBe(5);
    });

    it('should handle skill with no linked attribute', () => {
      const worldWithUnlinkedSkill: World = {
        ...mockWorld,
        skills: [
          { id: 'skill-unlinked', name: 'Unlinked Skill', description: 'No attribute', worldId: 'world-1', difficulty: 'medium', baseValue: 1, minValue: 1, maxValue: 10 }
        ]
      };

      const characterWithUnlinkedSkill: Character = {
        ...mockCharacter,
        skills: [
          { skillId: 'skill-unlinked', level: 4, experience: 30, isActive: true }
        ]
      };

      const skillCheck: SkillCheck = {
        skillId: 'skill-unlinked',
        difficulty: 4
      };

      const result = evaluateSkillCheck(characterWithUnlinkedSkill, skillCheck, worldWithUnlinkedSkill);

      expect(result.attributeModifier).toBe(0);
      expect(result.totalValue).toBe(4);
    });
  });

  describe('skill lookup by name', () => {
    it('should find skill by name when skill ID not matched', () => {
      const skillCheck: SkillCheck = {
        skillId: 'nonexistent-id',
        skillName: 'Magic',
        difficulty: 6
      };

      const result = evaluateSkillCheck(mockCharacter, skillCheck, mockWorld);

      expect(result.success).toBe(true); // 5 + 2 = 7, but difficulty is 6, so should pass
      expect(result.characterSkillValue).toBe(5);
      expect(result.attributeModifier).toBe(2);
    });

    it('should handle case-insensitive skill name lookup', () => {
      const skillCheck: SkillCheck = {
        skillId: 'nonexistent-id',
        skillName: 'SWORDSMANSHIP',
        difficulty: 8
      };

      const result = evaluateSkillCheck(mockCharacter, skillCheck, mockWorld);

      expect(result.success).toBe(true); // 8 + 1 = 9 >= 8
      expect(result.characterSkillValue).toBe(8);
    });

    it('should prioritize skillId match over skillName', () => {
      const skillCheck: SkillCheck = {
        skillId: 'skill-magic',
        skillName: 'Swordsmanship',
        difficulty: 6
      };

      const result = evaluateSkillCheck(mockCharacter, skillCheck, mockWorld);

      // Should use magic skill (id match) not swordsmanship (name match)
      expect(result.characterSkillValue).toBe(5); // Magic skill level
    });
  });

  describe('missing skills handling', () => {
    it('should fail gracefully when character lacks the skill', () => {
      const skillCheck: SkillCheck = {
        skillId: 'skill-nonexistent',
        difficulty: 5
      };

      const result = evaluateSkillCheck(mockCharacter, skillCheck);

      expect(result.success).toBe(false);
      expect(result.characterSkillValue).toBe(0);
      expect(result.attributeModifier).toBe(0);
      expect(result.totalValue).toBe(0);
      expect(result.details).toContain('Character does not have the required skill');
    });

    it('should include skill name in error message when provided', () => {
      const skillCheck: SkillCheck = {
        skillId: 'skill-nonexistent',
        skillName: 'NonexistentSkill',
        difficulty: 5
      };

      const result = evaluateSkillCheck(mockCharacter, skillCheck);

      expect(result.details).toContain('NonexistentSkill');
    });

    it('should fail when skill name lookup fails', () => {
      const skillCheck: SkillCheck = {
        skillId: 'nonexistent-id',
        skillName: 'NonexistentSkill',
        difficulty: 5
      };

      const result = evaluateSkillCheck(mockCharacter, skillCheck, mockWorld);

      expect(result.success).toBe(false);
      expect(result.details).toContain('Character does not have the required skill');
    });
  });
});

describe('canPassSkillCheck', () => {
  it('should return true for passing skill checks', () => {
    const skillCheck: SkillCheck = {
      skillId: 'skill-swordsmanship',
      difficulty: 6,
      useAttributeModifier: false
    };

    const result = canPassSkillCheck(mockCharacter, skillCheck);
    expect(result).toBe(true);
  });

  it('should return false for failing skill checks', () => {
    const skillCheck: SkillCheck = {
      skillId: 'skill-stealth',
      difficulty: 5,
      useAttributeModifier: false
    };

    const result = canPassSkillCheck(mockCharacter, skillCheck);
    expect(result).toBe(false);
  });
});

describe('createSkillCheckFromDifficulty', () => {
  it('should create skill check with easy difficulty', () => {
    const skillCheck = createSkillCheckFromDifficulty('skill-test', 'easy', 'Test Skill');

    expect(skillCheck.skillId).toBe('skill-test');
    expect(skillCheck.skillName).toBe('Test Skill');
    expect(skillCheck.difficulty).toBe(3);
    expect(skillCheck.useAttributeModifier).toBe(true);
  });

  it('should create skill check with medium difficulty', () => {
    const skillCheck = createSkillCheckFromDifficulty('skill-test', 'medium');

    expect(skillCheck.difficulty).toBe(6);
  });

  it('should create skill check with hard difficulty', () => {
    const skillCheck = createSkillCheckFromDifficulty('skill-test', 'hard');

    expect(skillCheck.difficulty).toBe(9);
  });

  it('should work without skill name', () => {
    const skillCheck = createSkillCheckFromDifficulty('skill-test', 'medium');

    expect(skillCheck.skillId).toBe('skill-test');
    expect(skillCheck.skillName).toBeUndefined();
  });
});

describe('edge cases', () => {
  it('should handle character with no skills', () => {
    const emptyCharacter: Character = {
      ...mockCharacter,
      skills: []
    };

    const skillCheck: SkillCheck = {
      skillId: 'skill-any',
      difficulty: 1
    };

    const result = evaluateSkillCheck(emptyCharacter, skillCheck);

    expect(result.success).toBe(false);
    expect(result.characterSkillValue).toBe(0);
  });

  it('should handle character with no attributes', () => {
    const noAttributesCharacter: Character = {
      ...mockCharacter,
      attributes: []
    };

    const skillCheck: SkillCheck = {
      skillId: 'skill-swordsmanship',
      difficulty: 5
    };

    const result = evaluateSkillCheck(noAttributesCharacter, skillCheck, mockWorld);

    expect(result.attributeModifier).toBe(0);
    expect(result.totalValue).toBe(8); // Only skill level
  });

  it('should handle zero difficulty threshold', () => {
    const skillCheck: SkillCheck = {
      skillId: 'skill-stealth',
      difficulty: 0,
      useAttributeModifier: false
    };

    const result = evaluateSkillCheck(mockCharacter, skillCheck);

    expect(result.success).toBe(true);
    expect(result.totalValue).toBe(3);
    expect(result.difficultyThreshold).toBe(0);
  });

  it('should handle very high difficulty threshold', () => {
    const skillCheck: SkillCheck = {
      skillId: 'skill-swordsmanship',
      difficulty: 100
    };

    const result = evaluateSkillCheck(mockCharacter, skillCheck, mockWorld);

    expect(result.success).toBe(false);
    expect(result.totalValue).toBe(9); // 8 skill + 1 modifier
    expect(result.difficultyThreshold).toBe(100);
  });
});