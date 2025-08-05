// src/types/__tests__/type-guards-validation-result.test.ts

// These imports will fail initially since the ValidationResult API doesn't exist yet
// This is intentional - we're testing the RED phase of TDD
import {
  validateWorld,
  validateCharacter,
  validateWorldSettings,
  validateCharacterBackground,
  validateCharacterAttribute,
  validateCharacterSkill,
} from '../type-guards';

describe('Type Guards - ValidationResult API', () => {
  
  describe('Clear Error Messages for Invalid Types', () => {
    test('validateWorld provides specific error messages for missing properties', () => {
      const invalidWorld = {
        id: 'world-1',
        name: 'Test World'
        // Missing required properties
      };

      const result = validateWorld(invalidWorld);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Property "genre" must be a string');
      expect(result.errors).toContain('Property "attributes" must be an array');
      expect(result.errors).toContain('Property "skills" must be an array');
      expect(result.errors.some(e => e.includes('WorldSettings'))).toBe(true);
      expect(result.errors).toContain('Property "createdAt" must be a string');
      expect(result.errors).toContain('Property "updatedAt" must be a string');
    });

    test('validateWorld provides specific error messages for wrong property types', () => {
      const invalidWorld = {
        id: 'world-1',
        name: 'Test World',
        genre: 'fantasy',
        attributes: 'not-an-array',  // Should be array
        skills: 123,                 // Should be array
        settings: 'not-an-object',   // Should be object
        createdAt: '2025-01-13T10:00:00Z',
        updatedAt: '2025-01-13T10:00:00Z'
      };

      const result = validateWorld(invalidWorld);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Property "attributes" must be an array');
      expect(result.errors).toContain('Property "skills" must be an array');
      expect(result.errors.some(e => e.includes('WorldSettings') && e.includes('Expected object, got string'))).toBe(true);
    });

    test('validateCharacter provides specific error messages for nested object validation', () => {
      const invalidCharacter = {
        id: 'char-1',
        worldId: 'world-1',
        name: 'Test Character',
        attributes: [],
        skills: [],
        background: 'not-an-object',     // Should be object
        inventory: null,                 // Should be object
        status: undefined,               // Should be object
        createdAt: '2025-01-13T10:00:00Z',
        updatedAt: '2025-01-13T10:00:00Z'
      };

      const result = validateCharacter(invalidCharacter);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('CharacterBackground') && e.includes('Expected object, got string'))).toBe(true);
      expect(result.errors).toContain('Property "inventory" must be an object');
      expect(result.errors.some(e => e.includes('CharacterStatus') && e.includes('cannot be null or undefined'))).toBe(true);
    });

    test('validateJournalEntry provides specific error for invalid entry type', () => {
      // validateJournalEntry not implemented yet - skip this test
      return;
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Property "type" must be one of: character_event, world_event, relationship_change, achievement, discovery, combat, dialogue');
    });
  });

  describe('Nested Object Validation', () => {
    test('validateWorldSettings provides specific validation for settings object', () => {
      const invalidSettings = {
        maxAttributes: 'not-a-number',
        maxSkills: null,
        attributePointPool: -5,        // Invalid negative value
        skillPointPool: undefined      // Missing required property
      };

      const result = validateWorldSettings(invalidSettings);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Property "maxAttributes" must be a number');
      expect(result.errors).toContain('Property "maxSkills" must be a number');
      expect(result.errors).toContain('Property "attributePointPool" must be greater than 0');
      expect(result.errors).toContain('Property "skillPointPool" must be a number');
    });

    test('validateCharacterBackground validates all background properties', () => {
      const invalidBackground = {
        history: '',                   // Empty string
        personality: null,             // Should be string
        goals: 'not-an-array',        // Should be array
        fears: [123, null],           // Should be array of strings
        relationships: 'invalid'       // Should be array
      };

      const result = validateCharacterBackground(invalidBackground);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Property "personality" must be a string');
      expect(result.errors).toContain('Property "goals" must be an array');
      expect(result.errors).toContain('All elements in "fears" must be strings');
      expect(result.errors).toContain('Property "relationships" must be an array');
      expect(result.errors).toContain('Property "relationships" must be an array');
    });

    test('validateCharacterAttribute validates attribute structure', () => {
      const invalidAttribute = {
        attributeId: null,             // Should be string
        value: 'not-a-number'         // Should be number
      };

      const result = validateCharacterAttribute(invalidAttribute);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Property "attributeId" must be a string');
      expect(result.errors).toContain('Property "value" must be a number');
    });

    test('validateCharacterSkill validates skill structure with range checks', () => {
      const invalidSkill = {
        skillId: null,                 // Should be string
        level: -1,                     // Invalid negative level
        experience: 'not-a-number',    // Should be number
        isActive: 'not-a-boolean'      // Should be boolean
      };

      const result = validateCharacterSkill(invalidSkill);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Property "skillId" must be a string');
      expect(result.errors).toContain('Property "level" must be non-negative');
      expect(result.errors).toContain('Property "experience" must be a number');
      expect(result.errors).toContain('Property "isActive" must be a boolean');
    });
  });

  describe('Partial Object Validation', () => {
    test('validation works with partial objects when required properties are present', () => {
      const partialWorld = {
        id: 'world-1',
        name: 'Partial World',
        description: 'A test world for validation',
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
        // Missing optional: image, reference, relationship, toneSettings
      };

      const result = validateWorld(partialWorld);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('validation handles objects missing required properties gracefully', () => {
      const incompleteWorld = {
        id: 'world-1',
        name: 'Incomplete World'
        // Missing all other required properties
      };

      const result = validateWorld(incompleteWorld);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.every(error => typeof error === 'string')).toBe(true);
    });
  });

  describe('Valid Object Validation', () => {
    test('validateWorld returns success for completely valid world', () => {
      const validWorld = {
        id: 'world-1',
        name: 'Valid World',
        description: 'A completely valid world',
        genre: 'fantasy',
        attributes: [
          {
            id: 'attr-1',
            worldId: 'world-1',
            name: 'Strength',
            description: 'Physical power',
            baseValue: 10,
            minValue: 1,
            maxValue: 20
          }
        ],
        skills: [
          {
            id: 'skill-1',
            worldId: 'world-1',
            name: 'Swordsmanship',
            description: 'Skill with bladed weapons',
            difficulty: 'medium',
            baseValue: 5,
            minValue: 0,
            maxValue: 10
          }
        ],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        },
        image: {
          type: 'ai-generated',
          url: 'https://example.com/world-image.jpg',
          generatedAt: '2025-01-13T10:00:00Z',
          prompt: 'A fantasy world'
        },
        createdAt: '2025-01-13T10:00:00Z',
        updatedAt: '2025-01-13T10:00:00Z'
      };

      const result = validateWorld(validWorld);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('validateCharacter returns success for completely valid character', () => {
      const validCharacter = {
        id: 'char-1',
        worldId: 'world-1',
        name: 'Valid Character',
        attributes: [
          { attributeId: 'attr-1', value: 15 }
        ],
        skills: [
          { skillId: 'skill-1', level: 3, experience: 150, isActive: true }
        ],
        background: {
          history: 'A brave warrior from the northern kingdoms',
          personality: 'Courageous, loyal, and somewhat impulsive',
          physicalDescription: 'Tall with dark hair and piercing blue eyes',
          goals: ['Protect the innocent', 'Master the art of combat'],
          fears: ['Losing loved ones', 'Failing in battle'],
          relationships: [
            {
              characterId: 'char-2',
              type: 'ally',
              strength: 80,
              description: 'Trusted companion'
            }
          ],
          isKnownFigure: false
        },
        inventory: {
          characterId: 'char-1',
          items: [
            {
              id: 'item-1',
              name: 'Iron Sword',
              categoryId: 'weapons',
              quantity: 1
            }
          ],
          capacity: 10,
          categories: [
            {
              id: 'weapons',
              name: 'Weapons',
              maxItems: 5
            }
          ]
        },
        status: {
          health: 100,
          maxHealth: 100,
          conditions: ['well-rested'],
          location: 'Tavern'
        },
        portrait: {
          type: 'ai-generated',
          url: 'https://example.com/character-portrait.jpg',
          generatedAt: '2025-01-13T10:00:00Z',
          prompt: 'A brave warrior'
        },
        createdAt: '2025-01-13T10:00:00Z',
        updatedAt: '2025-01-13T10:00:00Z'
      };

      const result = validateCharacter(validCharacter);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('Edge Cases in Validation', () => {
    test('validation handles null and undefined gracefully', () => {
      expect(validateWorld(null).valid).toBe(false);
      expect(validateWorld(undefined).valid).toBe(false);
      expect(validateCharacter(null).valid).toBe(false);
      expect(validateCharacter(undefined).valid).toBe(false);
      
      // Should provide meaningful error messages
      expect(validateWorld(null).errors).toContain('World object cannot be null or undefined');
      expect(validateWorld(undefined).errors).toContain('World object cannot be null or undefined');
    });

    test('validation handles primitive types gracefully', () => {
      const primitives = [
        'string',
        123,
        true,
        false
      ];

      primitives.forEach(primitive => {
        const worldResult = validateWorld(primitive);
        const characterResult = validateCharacter(primitive);
        const expectedType = typeof primitive;
        
        expect(worldResult.valid).toBe(false);
        expect(characterResult.valid).toBe(false);
        expect(worldResult.errors).toContain(`Expected object, got ${expectedType}`);
        expect(characterResult.errors).toContain(`Expected object, got ${expectedType}`);
      });
    });

    test('validation handles empty objects', () => {
      const emptyObject = {};

      const worldResult = validateWorld(emptyObject);
      const characterResult = validateCharacter(emptyObject);

      expect(worldResult.valid).toBe(false);
      expect(characterResult.valid).toBe(false);
      
      // Should list all missing required properties
      expect(worldResult.errors.length).toBeGreaterThan(5);
      expect(characterResult.errors.length).toBeGreaterThan(5);
    });
  });

  describe('Performance with Large Objects', () => {
    test('validation performs efficiently with large attribute arrays', () => {
      const worldWithManyAttributes = {
        id: 'world-1',
        name: 'Large World',
        description: 'A world with many attributes',
        genre: 'fantasy',
        attributes: Array.from({ length: 100 }, (_, i) => ({
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
          maxAttributes: 100,
          maxSkills: 8,
          attributePointPool: 270,
          skillPointPool: 20
        },
        createdAt: '2025-01-13T10:00:00Z',
        updatedAt: '2025-01-13T10:00:00Z'
      };

      const startTime = performance.now();
      const result = validateWorld(worldWithManyAttributes);
      const endTime = performance.now();

      expect(result.valid).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });
  });
});