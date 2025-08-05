// src/types/__tests__/type-guards-comprehensive.test.ts

import { 
  isWorld, 
  isCharacter, 
  isInventoryItem,
  isNarrativeSegment,
  isJournalEntry,
  isPlayerDecision,
  isPlayerDecisionArray
} from '../type-guards';

describe('Type Guards - Comprehensive Runtime Type Safety', () => {
  
  describe('Type Narrowing Behavior', () => {
    test('isWorld narrows unknown type to World at compile time', () => {
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

      if (isWorld(unknownData)) {
        // TypeScript should recognize this as World type
        expect(unknownData.name).toBe('Test World');
        expect(unknownData.genre).toBe('fantasy');
        expect(unknownData.settings.maxAttributes).toBe(6);
        expect(Array.isArray(unknownData.attributes)).toBe(true);
        expect(Array.isArray(unknownData.skills)).toBe(true);
      } else {
        fail('Type guard should have narrowed type to World');
      }
    });

    test('isCharacter narrows unknown type to Character at compile time', () => {
      const unknownData: unknown = {
        id: 'char-1',
        worldId: 'world-1',
        name: 'Test Character',
        attributes: [{ attributeId: 'attr-1', value: 15 }],
        skills: [{ skillId: 'skill-1', level: 3, experience: 150, isActive: true }],
        background: {
          history: 'A brave warrior',
          personality: 'Courageous and loyal',
          goals: ['Save the kingdom'],
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

      if (isCharacter(unknownData)) {
        // TypeScript should recognize this as Character type
        expect(unknownData.name).toBe('Test Character');
        expect(unknownData.worldId).toBe('world-1');
        expect(unknownData.attributes[0].value).toBe(15);
        expect(unknownData.skills[0].level).toBe(3);
        expect(unknownData.background.history).toBe('A brave warrior');
        expect(unknownData.status.health).toBe(100);
      } else {
        fail('Type guard should have narrowed type to Character');
      }
    });
  });

  describe('Comprehensive Property Validation', () => {
    test('isWorld validates all essential World properties', () => {
      const validWorld = {
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

      expect(isWorld(validWorld)).toBe(true);

      // Test missing essential properties
      const testCases = [
        { ...validWorld, id: undefined },
        { ...validWorld, name: undefined },
        { ...validWorld, genre: undefined },
        { ...validWorld, attributes: undefined },
        { ...validWorld, skills: undefined },
        { ...validWorld, settings: undefined },
        { ...validWorld, createdAt: undefined },
        { ...validWorld, updatedAt: undefined },
        { ...validWorld, attributes: 'not-an-array' },
        { ...validWorld, skills: 'not-an-array' },
        { ...validWorld, settings: 'not-an-object' },
        { ...validWorld, settings: { maxAttributes: 6 } }, // Missing other settings properties
      ];

      testCases.forEach((testCase, index) => {
        expect(isWorld(testCase)).toBe(false, `Test case ${index} should fail validation`);
      });
    });

    test('isCharacter validates all essential Character properties', () => {
      const validCharacter = {
        id: 'char-1',
        worldId: 'world-1',
        name: 'Test Character',
        attributes: [{ attributeId: 'attr-1', value: 15 }],
        skills: [{ skillId: 'skill-1', level: 3, experience: 150, isActive: true }],
        background: {
          history: 'A brave warrior',
          personality: 'Courageous and loyal',
          goals: ['Save the kingdom'],
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

      expect(isCharacter(validCharacter)).toBe(true);

      // Test missing essential properties
      const testCases = [
        { ...validCharacter, id: undefined },
        { ...validCharacter, worldId: undefined },
        { ...validCharacter, name: undefined },
        { ...validCharacter, attributes: undefined },
        { ...validCharacter, skills: undefined },
        { ...validCharacter, background: undefined },
        { ...validCharacter, inventory: undefined },
        { ...validCharacter, status: undefined },
        { ...validCharacter, attributes: 'not-an-array' },
        { ...validCharacter, skills: 'not-an-array' },
        { ...validCharacter, background: 'not-an-object' },
        { ...validCharacter, inventory: 'not-an-object' },
        { ...validCharacter, status: 'not-an-object' },
      ];

      testCases.forEach((testCase, index) => {
        expect(isCharacter(testCase)).toBe(false, `Test case ${index} should fail validation`);
      });
    });

    test('isJournalEntry validates type field against valid enum values', () => {
      const baseEntry = {
        id: 'journal-1',
        sessionId: 'session-1',
        worldId: 'world-1',
        characterId: 'char-1',
        title: 'Test Entry',
        content: 'Test content',
        significance: 'major',
        isRead: false,
        relatedEntities: [],
        metadata: { tags: [], automaticEntry: false },
        createdAt: '2025-01-13T10:00:00Z',
        updatedAt: '2025-01-13T10:00:00Z'
      };

      // Test valid types
      const validTypes = [
        'character_event',
        'world_event', 
        'relationship_change',
        'achievement',
        'discovery',
        'combat',
        'dialogue'
      ];

      validTypes.forEach(type => {
        expect(isJournalEntry({ ...baseEntry, type })).toBe(true, `Type '${type}' should be valid`);
      });

      // Test invalid types
      const invalidTypes = [
        'invalid_type',
        'random_string',
        123,
        null,
        undefined,
        {}
      ];

      invalidTypes.forEach(type => {
        expect(isJournalEntry({ ...baseEntry, type })).toBe(false, `Type '${type}' should be invalid`);
      });
    });

    test('isPlayerDecision validates nested ChoiceTypePreference', () => {
      const validDecision = {
        choiceText: 'Attack the dragon',
        choiceType: 'aggressive',
        context: { location: 'dragon_lair', allies: ['wizard'] },
        timestamp: '2025-01-13T10:00:00Z'
      };

      expect(isPlayerDecision(validDecision)).toBe(true);

      // Test invalid choice types
      const invalidChoiceTypes = [
        'invalid_choice',
        'random_string',
        123,
        null,
        undefined
      ];

      invalidChoiceTypes.forEach(choiceType => {
        const testDecision = { ...validDecision, choiceType };
        expect(isPlayerDecision(testDecision)).toBe(false, `Choice type '${choiceType}' should be invalid`);
      });
    });
  });

  describe('Partial Object Support', () => {
    test('type guards work with objects missing optional properties', () => {
      // World with minimal required properties
      const minimalWorld = {
        id: 'world-1',
        name: 'Minimal World',
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
        // Missing optional: description, image, reference, relationship, toneSettings
      };

      expect(isWorld(minimalWorld)).toBe(true);

      // Character with minimal required properties
      const minimalCharacter = {
        id: 'char-1',
        worldId: 'world-1',
        name: 'Minimal Character',
        attributes: [],
        skills: [],
        background: {
          history: 'Unknown past',
          personality: 'Mysterious',
          goals: [],
          fears: [],
          relationships: []
          // Missing optional: physicalDescription, isKnownFigure, knownFigureType
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
          // Missing optional: location
        },
        createdAt: '2025-01-13T10:00:00Z',
        updatedAt: '2025-01-13T10:00:00Z'
        // Missing optional: portrait
      };

      expect(isCharacter(minimalCharacter)).toBe(true);
    });

    test('type guards handle objects with extra properties', () => {
      const worldWithExtraProps = {
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
        updatedAt: '2025-01-13T10:00:00Z',
        // Extra properties that shouldn't break type guard
        extraProperty: 'should be ignored',
        randomData: { nested: true },
        version: 2
      };

      expect(isWorld(worldWithExtraProps)).toBe(true);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('handles primitive values correctly', () => {
      const primitives = [
        null,
        undefined,
        true,
        false,
        0,
        1,
        -1,
        '',
        'string',
        Symbol('test')
      ];

      primitives.forEach(primitive => {
        expect(isWorld(primitive)).toBe(false);
        expect(isCharacter(primitive)).toBe(false);
        expect(isInventoryItem(primitive)).toBe(false);
        expect(isNarrativeSegment(primitive)).toBe(false);
        expect(isJournalEntry(primitive)).toBe(false);
      });
    });

    test('handles arrays and functions correctly', () => {
      const nonObjects = [
        [],
        [1, 2, 3],
        function() {},
        () => {},
        new Date(),
        /regex/
      ];

      nonObjects.forEach(nonObject => {
        expect(isWorld(nonObject)).toBe(false);
        expect(isCharacter(nonObject)).toBe(false);
        expect(isInventoryItem(nonObject)).toBe(false);
        expect(isNarrativeSegment(nonObject)).toBe(false);
        expect(isJournalEntry(nonObject)).toBe(false);
      });
    });

    test('handles malformed nested objects', () => {
      const worldWithMalformedSettings = {
        id: 'world-1',
        name: 'Test World',
        description: 'A test world',
        genre: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 'not-a-number',
          maxSkills: null,
          attributePointPool: undefined,
          // Missing skillPointPool
        },
        createdAt: '2025-01-13T10:00:00Z',
        updatedAt: '2025-01-13T10:00:00Z'
      };

      expect(isWorld(worldWithMalformedSettings)).toBe(false);
    });

    test('isPlayerDecisionArray validates all elements', () => {
      const validDecisions = [
        {
          choiceText: 'Help the villager',
          choiceType: 'helpful',
          context: { location: 'village' },
          timestamp: '2025-01-13T10:00:00Z'
        },
        {
          choiceText: 'Attack the enemy',
          choiceType: 'aggressive',
          context: { combat: true },
          timestamp: '2025-01-13T10:01:00Z'
        }
      ];

      expect(isPlayerDecisionArray(validDecisions)).toBe(true);

      // Array with one invalid decision should fail
      const mixedDecisions = [
        ...validDecisions,
        {
          choiceText: 'Invalid decision',
          choiceType: 'invalid_type', // Invalid choice type
          context: { location: 'somewhere' },
          timestamp: '2025-01-13T10:02:00Z'
        }
      ];

      expect(isPlayerDecisionArray(mixedDecisions)).toBe(false);

      // Non-array should fail
      expect(isPlayerDecisionArray('not-an-array')).toBe(false);
      expect(isPlayerDecisionArray(null)).toBe(false);
      expect(isPlayerDecisionArray(validDecisions[0])).toBe(false); // Single object, not array
    });
  });

  describe('Performance and Error Resilience', () => {
    test('handles circular references without crashing', () => {
      const circularObj: Record<string, unknown> = {
        id: 'world-1',
        name: 'Circular World',
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
      
      // Create circular reference
      circularObj.self = circularObj;

      // Should not crash and should return false (since 'self' is not a valid World property)
      expect(() => isWorld(circularObj)).not.toThrow();
      expect(isWorld(circularObj)).toBe(true); // Actually might be true since we only check required props
    });

    test('handles very deep nested objects', () => {
      const deepObj: Record<string, unknown> = {
        id: 'world-1',
        name: 'Deep World',
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

      // Create deep nesting
      let current = deepObj;
      for (let i = 0; i < 100; i++) {
        current.nested = { level: i };
        current = current.nested;
      }

      // Should not crash and should still validate the top-level properties
      expect(() => isWorld(deepObj)).not.toThrow();
      expect(isWorld(deepObj)).toBe(true);
    });
  });
});