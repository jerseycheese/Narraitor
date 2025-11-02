import { evaluateRequirement } from '../requirementEvaluator';
import { DecisionRequirement } from '@/types/narrative.types';
import { InventoryItem } from '@/types/inventory.types';

// Character interface matching the actual store structure
interface Character {
  id: string;
  name: string;
  description: string;
  worldId: string;
  level: number;
  attributes: Array<{
    id: string;
    characterId: string;
    worldAttributeId?: string;
    name: string;
    baseValue: number;
    modifiedValue: number;
    category?: string;
  }>;
  skills: Array<{
    id: string;
    characterId: string;
    worldSkillId?: string;
    name: string;
    level: number;
    category?: string;
  }>;
  background: {
    history: string;
    personality: string;
    goals: string[];
    fears: string[];
    relationships: unknown[];
  };
  isPlayer: boolean;
  status: {
    health: number;
    maxHealth: number;
    conditions: string[];
  };
  inventory: {
    characterId: string;
    items: InventoryItem[];
    capacity: number;
    categories: string[];
  };
}

describe('requirementEvaluator', () => {
  const mockCharacter: Character = {
    id: 'char-1',
    name: 'Test Character',
    description: 'A test character',
    worldId: 'world-1',
    level: 5,
    attributes: [
      {
        id: 'attr-1',
        characterId: 'char-1',
        worldAttributeId: 'strength',
        name: 'Strength',
        baseValue: 15,
        modifiedValue: 17,
        category: 'physical'
      },
      {
        id: 'attr-2',
        characterId: 'char-1',
        worldAttributeId: 'intelligence',
        name: 'Intelligence',
        baseValue: 12,
        modifiedValue: 12,
        category: 'mental'
      }
    ],
    skills: [
      {
        id: 'skill-1',
        characterId: 'char-1',
        worldSkillId: 'intimidation',
        name: 'Intimidation',
        level: 8,
        category: 'social'
      },
      {
        id: 'skill-2',
        characterId: 'char-1',
        worldSkillId: 'stealth',
        name: 'Stealth',
        level: 3,
        category: 'physical'
      },
      {
        id: 'skill-3',
        characterId: 'char-1',
        name: 'persuasion', // lowercase name for case-insensitive testing
        level: 6,
        category: 'social'
      }
    ],
    background: {
      history: 'Test history',
      personality: 'Test personality',
      goals: ['Test goal'],
      fears: ['Test fear'],
      relationships: []
    },
    isPlayer: true,
    status: {
      health: 100,
      maxHealth: 100,
      conditions: []
    },
    inventory: {
      characterId: 'char-1',
      items: [],
      capacity: 10,
      categories: []
    }
  };

  describe('skill requirements', () => {
    it('should pass when character meets skill requirement exactly', () => {
      const requirement: DecisionRequirement = {
        type: 'skill',
        targetId: 'intimidation',
        operator: 'gte',
        value: 8
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(true);
      expect(result.current).toBe(8);
      expect(result.required).toBe(8);
    });

    it('should pass when character exceeds skill requirement', () => {
      const requirement: DecisionRequirement = {
        type: 'skill',
        targetId: 'intimidation',
        operator: 'gte',
        value: 6
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(true);
      expect(result.current).toBe(8);
      expect(result.required).toBe(6);
    });

    it('should fail when character does not meet skill requirement', () => {
      const requirement: DecisionRequirement = {
        type: 'skill',
        targetId: 'stealth',
        operator: 'gte',
        value: 5
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(false);
      expect(result.current).toBe(3);
      expect(result.required).toBe(5);
    });

    it('should be case-insensitive for skill matching', () => {
      const requirement: DecisionRequirement = {
        type: 'skill',
        targetId: 'PERSUASION', // uppercase
        operator: 'gte',
        value: 5
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(true);
      expect(result.current).toBe(6);
    });

    it('should fail gracefully for non-existent skills', () => {
      const requirement: DecisionRequirement = {
        type: 'skill',
        targetId: 'nonexistent',
        operator: 'gte',
        value: 1
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(false);
      expect(result.current).toBe(0);
      expect(result.required).toBe(1);
    });

    it('should handle worldSkillId matching', () => {
      const requirement: DecisionRequirement = {
        type: 'skill',
        targetId: 'intimidation', // matches worldSkillId
        operator: 'gte',
        value: 7
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(true);
      expect(result.current).toBe(8);
    });
  });

  describe('non-skill requirements', () => {
    it('should fail gracefully for non-skill requirement types', () => {
      const requirement: DecisionRequirement = {
        type: 'attribute',
        targetId: 'strength',
        operator: 'gte',
        value: 15
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      // Current implementation only supports skill requirements
      expect(result.success).toBe(false);
      expect(result.current).toBe(0);
      expect(result.required).toBe(15);
    });
  });

  describe('edge cases', () => {
    it('should handle empty character gracefully', () => {
      const emptyCharacter: Character = {
        ...mockCharacter,
        skills: [],
        attributes: [],
        level: 1
      };

      const requirement: DecisionRequirement = {
        type: 'skill',
        targetId: 'intimidation',
        operator: 'gte',
        value: 5
      };

      const result = evaluateRequirement(requirement, emptyCharacter);

      expect(result.success).toBe(false);
      expect(result.current).toBe(0);
    });

    it('should handle unknown requirement types gracefully', () => {
      const requirement: DecisionRequirement = {
        type: 'unknown' as 'skill',
        targetId: 'test',
        operator: 'gte',
        value: 5
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(false);
      expect(result.current).toBe(0);
      expect(result.required).toBe(5);
    });
  });
});