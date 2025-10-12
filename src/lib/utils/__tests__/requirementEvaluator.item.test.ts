import { evaluateRequirement } from '../requirementEvaluator';
import { DecisionRequirement } from '@/types/narrative.types';
import { InventoryItem } from '@/types/inventory.types';

// Character interface with inventory support
interface Character {
  skills: Array<{
    id: string;
    characterId: string;
    worldSkillId?: string;
    name: string;
    level: number;
    category?: string;
  }>;
  inventory: {
    items: InventoryItem[];
  };
}

describe('requirementEvaluator - Item Requirements', () => {
  const createMockItem = (
    name: string,
    quantity: number,
    itemId?: string
  ): InventoryItem => ({
    id: itemId || `item-${name.toLowerCase()}`,
    name,
    description: '',
    quantity,
    stackable: true,
    categoryId: 'equipment',
    acquisitionHistory: [],
    categorization: {
      categoryId: 'equipment',
      source: 'manual',
      classifiedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const mockCharacter: Character = {
    skills: [],
    inventory: {
      items: [
        createMockItem('Lockpick', 1),
        createMockItem('Healing Potion', 3),
        createMockItem('Gold Coins', 50),
        createMockItem('rope', 1), // lowercase for case-insensitive testing
      ],
    },
  };

  describe('item possession checks', () => {
    it('should pass when character has the required item', () => {
      const requirement: DecisionRequirement = {
        type: 'item',
        targetId: 'Lockpick',
        operator: 'gte',
        value: 1,
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(true);
      expect(result.current).toBe(1);
      expect(result.required).toBe(1);
    });

    it('should fail when character does not have the required item', () => {
      const requirement: DecisionRequirement = {
        type: 'item',
        targetId: 'Magic Key',
        operator: 'gte',
        value: 1,
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(false);
      expect(result.current).toBe(0);
      expect(result.required).toBe(1);
    });

    it('should be case-insensitive for item name matching', () => {
      const requirement: DecisionRequirement = {
        type: 'item',
        targetId: 'ROPE',
        operator: 'gte',
        value: 1,
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(true);
      expect(result.current).toBe(1);
    });
  });

  describe('item quantity requirements', () => {
    it('should pass when character has exact quantity required', () => {
      const requirement: DecisionRequirement = {
        type: 'item',
        targetId: 'Healing Potion',
        operator: 'gte',
        value: 3,
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(true);
      expect(result.current).toBe(3);
      expect(result.required).toBe(3);
    });

    it('should pass when character exceeds quantity required', () => {
      const requirement: DecisionRequirement = {
        type: 'item',
        targetId: 'Gold Coins',
        operator: 'gte',
        value: 25,
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(true);
      expect(result.current).toBe(50);
      expect(result.required).toBe(25);
    });

    it('should fail when character has insufficient quantity', () => {
      const requirement: DecisionRequirement = {
        type: 'item',
        targetId: 'Healing Potion',
        operator: 'gte',
        value: 5,
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(false);
      expect(result.current).toBe(3);
      expect(result.required).toBe(5);
    });

    it('should handle exact quantity match with eq operator', () => {
      const requirement: DecisionRequirement = {
        type: 'item',
        targetId: 'Healing Potion',
        operator: 'eq',
        value: 3,
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(true);
      expect(result.current).toBe(3);
      expect(result.required).toBe(3);
    });
  });

  describe('operator support', () => {
    it('should support gt (greater than) operator', () => {
      const requirement: DecisionRequirement = {
        type: 'item',
        targetId: 'Gold Coins',
        operator: 'gt',
        value: 49,
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(true);
      expect(result.current).toBe(50);
    });

    it('should support lt (less than) operator', () => {
      const requirement: DecisionRequirement = {
        type: 'item',
        targetId: 'Lockpick',
        operator: 'lt',
        value: 2,
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(true);
      expect(result.current).toBe(1);
    });

    it('should support lte (less than or equal) operator', () => {
      const requirement: DecisionRequirement = {
        type: 'item',
        targetId: 'Healing Potion',
        operator: 'lte',
        value: 3,
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(true);
      expect(result.current).toBe(3);
    });

    it('should support neq (not equal) operator', () => {
      const requirement: DecisionRequirement = {
        type: 'item',
        targetId: 'Lockpick',
        operator: 'neq',
        value: 5,
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(true);
      expect(result.current).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty inventory gracefully', () => {
      const emptyCharacter: Character = {
        skills: [],
        inventory: {
          items: [],
        },
      };

      const requirement: DecisionRequirement = {
        type: 'item',
        targetId: 'Lockpick',
        operator: 'gte',
        value: 1,
      };

      const result = evaluateRequirement(requirement, emptyCharacter);

      expect(result.success).toBe(false);
      expect(result.current).toBe(0);
      expect(result.required).toBe(1);
    });

    it('should handle matching by item ID when name is not found', () => {
      const requirement: DecisionRequirement = {
        type: 'item',
        targetId: 'item-lockpick', // ID instead of name
        operator: 'gte',
        value: 1,
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.success).toBe(true);
      expect(result.current).toBe(1);
    });

    it('should return item name in metadata when available', () => {
      const requirement: DecisionRequirement = {
        type: 'item',
        targetId: 'Lockpick',
        operator: 'gte',
        value: 1,
      };

      const result = evaluateRequirement(requirement, mockCharacter);

      expect(result.itemName).toBe('Lockpick');
    });
  });
});
