// src/types/__tests__/type-guards-comprehensive.test.ts

import { 
  validateWorld, 
  validateCharacter, 
  isInventoryItem,
  isNarrativeSegment,
  isJournalEntry,
  isPlayerDecision,
  isPlayerDecisionArray
} from '../type-guards';

describe('Type Guards - Comprehensive Runtime Type Safety', () => {
  
  describe('Validation Result API Behavior', () => {
    test('validateWorld provides detailed validation for World objects', () => {
      const unknownData: unknown = {
        id: 'world-1',
        name: 'Test World',
        description: 'A test world',
        genre: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        },
        createdAt: '2025-01-13T10:00:00Z',
        updatedAt: '2025-01-13T10:00:00Z'
      };

      const result = validateWorld(unknownData);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('validateCharacter provides detailed validation for Character objects', () => {
      const unknownData: unknown = {
        id: 'char-1',
        worldId: 'world-1',
        name: 'Test Character',
        attributes: [{ attributeId: 'attr-1', value: 15 }],
        skills: [{ skillId: 'skill-1', level: 3, experience: 150, isActive: true }],
        background: {
          history: 'A brave warrior',
          personality: 'Courageous and loyal',
          goals: ['Protect the innocent'],
          fears: ['Losing friends'],
          relationships: []
        },
        inventory: {
          characterId: 'char-1',
          items: [],
          capacity: 10,
          categories: []
        },
        status: {
          health: 100,
          maxHealth: 100,
          conditions: []
        },
        createdAt: '2025-01-13T10:00:00Z',
        updatedAt: '2025-01-13T10:00:00Z'
      };

      const result = validateCharacter(unknownData);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('Legacy Type Guards Still Function', () => {
    test('isInventoryItem correctly identifies InventoryItem objects', () => {
      const validItem = {
        id: 'item-1',
        name: 'Test Item',
        categoryId: 'weapons',
        quantity: 1
      };

      const invalidItem = {
        id: 'item-1',
        name: 'Test Item',
        categoryId: 'weapons'
        // Missing quantity
      };

      expect(isInventoryItem(validItem)).toBe(true);
      expect(isInventoryItem(invalidItem)).toBe(false);
    });

    test('isNarrativeSegment correctly identifies NarrativeSegment objects', () => {
      const validSegment = {
        id: 'seg-1',
        worldId: 'world-1',
        sessionId: 'session-1',
        content: 'Test content',
        type: 'scene',
        characterIds: ['char-1'],
        metadata: { tags: [] },
        createdAt: '2025-01-13T10:00:00Z',
        updatedAt: '2025-01-13T10:00:00Z'
      };

      expect(isNarrativeSegment(validSegment)).toBe(true);
      expect(isNarrativeSegment({})).toBe(false);
    });

    test('isJournalEntry correctly identifies JournalEntry objects', () => {
      const validEntry = {
        id: 'journal-1',
        sessionId: 'session-1',
        worldId: 'world-1',
        characterId: 'char-1',
        type: 'combat',
        title: 'Great Battle',
        content: 'A fierce battle was fought',
        significance: 'major',
        isRead: false,
        relatedEntities: [],
        metadata: { tags: [] },
        createdAt: '2025-01-13T10:00:00Z',
        updatedAt: '2025-01-13T10:00:00Z'
      };

      expect(isJournalEntry(validEntry)).toBe(true);
      expect(isJournalEntry({})).toBe(false);
    });

    test('isPlayerDecision correctly identifies PlayerDecision objects', () => {
      const validDecision = {
        choiceText: 'Attack the enemy',
        choiceType: 'aggressive',
        context: { situation: 'combat' },
        timestamp: '2025-01-13T10:00:00Z'
      };

      expect(isPlayerDecision(validDecision)).toBe(true);
      expect(isPlayerDecision({})).toBe(false);
    });

    test('isPlayerDecisionArray correctly identifies arrays of PlayerDecision objects', () => {
      const validDecisions = [
        {
          choiceText: 'Talk peacefully',
          choiceType: 'diplomatic',
          context: { situation: 'negotiation' },
          timestamp: '2025-01-13T10:00:00Z'
        }
      ];

      expect(isPlayerDecisionArray(validDecisions)).toBe(true);
      expect(isPlayerDecisionArray([])).toBe(true);
      expect(isPlayerDecisionArray([{}])).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('validation handles null and undefined gracefully', () => {
      expect(validateWorld(null).valid).toBe(false);
      expect(validateWorld(undefined).valid).toBe(false);
      expect(validateCharacter(null).valid).toBe(false);
      expect(validateCharacter(undefined).valid).toBe(false);
      
      expect(validateWorld(null).errors).toContain('World object cannot be null or undefined');
      expect(validateCharacter(null).errors).toContain('Character object cannot be null or undefined');
    });

    test('validation handles primitive types gracefully', () => {
      const primitives = ['string', 123, true, false];
      
      primitives.forEach(primitive => {
        const worldResult = validateWorld(primitive);
        const characterResult = validateCharacter(primitive);
        
        expect(worldResult.valid).toBe(false);
        expect(characterResult.valid).toBe(false);
        expect(worldResult.errors[0]).toContain(`Expected object, got ${typeof primitive}`);
        expect(characterResult.errors[0]).toContain(`Expected object, got ${typeof primitive}`);
      });
    });

    test('validation handles empty objects', () => {
      const emptyObject = {};

      const worldResult = validateWorld(emptyObject);
      const characterResult = validateCharacter(emptyObject);

      expect(worldResult.valid).toBe(false);
      expect(characterResult.valid).toBe(false);
      
      expect(worldResult.errors.length).toBeGreaterThan(3); // Should list missing required properties
      expect(characterResult.errors.length).toBeGreaterThan(3);
    });
  });

  describe('Performance and Error Resilience', () => {
    test('validation performs efficiently with large objects', () => {
      const worldWithManyAttributes = {
        id: 'world-1',
        name: 'Large World',
        description: 'A world with many attributes',
        genre: 'fantasy',
        attributes: Array.from({ length: 50 }, (_, i) => ({
          id: `attr-${i}`,
          worldId: 'world-1',
          name: `Attribute ${i}`,
          description: `Description ${i}`,
          baseValue: 10,
          minValue: 1,
          maxValue: 20
        })),
        skills: [],
        settings: {
          maxAttributes: 50,
          maxSkills: 8,
          attributePointPool: 500,
          skillPointPool: 20
        },
        createdAt: '2025-01-13T10:00:00Z',
        updatedAt: '2025-01-13T10:00:00Z'
      };

      const startTime = performance.now();
      const result = validateWorld(worldWithManyAttributes);
      const endTime = performance.now();

      expect(result.valid).toBe(true);
      expect(endTime - startTime).toBeLessThan(50); // Should complete quickly
    });
  });
});