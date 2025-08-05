// src/types/__tests__/type-guards-domain-objects.test.ts

// Tests for domain-specific type validation using ValidationResult API
// These test the simplified API that only uses ValidationResult functions

import {
  validateWorldAttribute,
  validateWorldSkill,
  validateWorldSettings,
  validateWorldImage,
  validateCharacterAttribute,
  validateCharacterSkill,
  validateCharacterBackground,
  validateCharacterStatus,
  validateCharacterRelationship,
  validateWorld
} from '../type-guards';

describe('Domain-Specific Type Validation', () => {
  
  describe('World Component Validation', () => {
    test('validateWorldAttribute correctly validates WorldAttribute objects', () => {
      const validWorldAttribute = {
        id: 'attr-1',
        worldId: 'world-1',
        name: 'Strength',
        description: 'Physical power and might',
        baseValue: 10,
        minValue: 1,
        maxValue: 20,
        category: 'physical'
      };

      const result = validateWorldAttribute(validWorldAttribute);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);

      // Test missing required properties
      const invalidAttribute = {
        id: 'attr-1',
        name: 'Strength'
        // Missing required properties
      };

      const invalidResult = validateWorldAttribute(invalidAttribute);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
      expect(invalidResult.errors).toContain('Property "worldId" must be a string');
      expect(invalidResult.errors).toContain('Property "description" must be a string');
      expect(invalidResult.errors).toContain('Property "baseValue" must be a number');
    });

    test('validateWorldSkill correctly validates WorldSkill objects', () => {
      const validWorldSkill = {
        id: 'skill-1',
        worldId: 'world-1',
        name: 'Swordsmanship',
        description: 'The art of fighting with bladed weapons',
        attributeIds: ['attr-1', 'attr-2'],
        difficulty: 'medium',
        category: 'combat',
        baseValue: 5,
        minValue: 0,
        maxValue: 10
      };

      const result = validateWorldSkill(validWorldSkill);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);

      // Test invalid difficulty
      const invalidSkill = {
        ...validWorldSkill,
        difficulty: 'impossible' // Not a valid SkillDifficulty
      };

      const invalidResult = validateWorldSkill(invalidSkill);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Property "difficulty" must be one of: easy, medium, hard, expert');
    });

    test('validateWorldSettings correctly validates WorldSettings objects', () => {
      const validSettings = {
        maxAttributes: 6,
        maxSkills: 8,
        attributePointPool: 27,
        skillPointPool: 20
      };

      const result = validateWorldSettings(validSettings);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);

      // Test negative values
      const invalidSettings = {
        maxAttributes: -1,
        maxSkills: 0,
        attributePointPool: 27,
        skillPointPool: 20
      };

      const invalidResult = validateWorldSettings(invalidSettings);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Property "maxAttributes" must be greater than 0');
      expect(invalidResult.errors).toContain('Property "maxSkills" must be greater than 0');
    });

    test('validateWorldImage correctly validates WorldImage objects', () => {
      const validAIImage = {
        type: 'ai-generated',
        url: 'https://example.com/world-image.jpg',
        generatedAt: '2025-01-13T10:00:00Z',
        prompt: 'A fantasy world with mountains and forests'
      };

      const validPlaceholderImage = {
        type: 'placeholder',
        url: null
      };

      expect(validateWorldImage(validAIImage).valid).toBe(true);
      expect(validateWorldImage(validPlaceholderImage).valid).toBe(true);

      // Test invalid type
      const invalidImage = {
        type: 'invalid-type',
        url: 'https://example.com/image.jpg'
      };

      const invalidResult = validateWorldImage(invalidImage);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Property "type" must be one of: ai-generated, placeholder');
    });
  });

  describe('Character Component Validation', () => {
    test('validateCharacterAttribute correctly validates CharacterAttribute objects', () => {
      const validAttribute = {
        attributeId: 'attr-1',
        value: 15
      };

      const result = validateCharacterAttribute(validAttribute);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);

      // Test invalid structures
      const invalidAttribute = {
        attributeId: 'attr-1',
        value: -5 // Negative value
      };

      const invalidResult = validateCharacterAttribute(invalidAttribute);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Property "value" must be non-negative');
    });

    test('validateCharacterSkill correctly validates CharacterSkill objects', () => {
      const validSkill = {
        skillId: 'skill-1',
        level: 3,
        experience: 150,
        isActive: true
      };

      const result = validateCharacterSkill(validSkill);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);

      // Test invalid structures
      const invalidSkill = {
        skillId: 'skill-1',
        level: -1, // Negative level
        experience: 150,
        isActive: true
      };

      const invalidResult = validateCharacterSkill(invalidSkill);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Property "level" must be non-negative');
    });

    test('validateCharacterBackground correctly validates CharacterBackground objects', () => {
      const validBackground = {
        history: 'Born in the northern kingdoms, trained as a warrior',
        personality: 'Brave, loyal, somewhat impulsive',
        physicalDescription: 'Tall with dark hair and blue eyes',
        goals: ['Protect the innocent', 'Find the lost artifact'],
        fears: ['Losing friends', 'Failing in battle'],
        relationships: [
          {
            characterId: 'char-2',
            type: 'ally',
            strength: 80,
            description: 'Trusted companion'
          }
        ],
        isKnownFigure: false
      };

      const result = validateCharacterBackground(validBackground);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);

      // Test minimal valid background
      const minimalBackground = {
        history: 'Unknown past',
        personality: 'Mysterious',
        goals: [],
        fears: [],
        relationships: []
      };

      const minimalResult = validateCharacterBackground(minimalBackground);
      expect(minimalResult.valid).toBe(true);
      expect(minimalResult.errors).toEqual([]);

      // Test invalid background
      const invalidBackground = {
        history: '', // Empty string
        personality: 'Valid personality',
        goals: ['Valid goal', ''], // Contains empty string
        fears: 'not-an-array', // Should be array
        relationships: []
      };

      const invalidResult = validateCharacterBackground(invalidBackground);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    test('validateCharacterStatus correctly validates CharacterStatus objects', () => {
      const validStatus = {
        health: 75,
        maxHealth: 100,
        conditions: ['injured', 'blessed'],
        location: 'Ancient Forest'
      };

      const result = validateCharacterStatus(validStatus);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);

      // Test invalid status
      const invalidStatus = {
        health: 150, // Exceeds maxHealth
        maxHealth: 100,
        conditions: ['poisoned', 123], // Contains non-string
        location: 'Forest'
      };

      const invalidResult = validateCharacterStatus(invalidStatus);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Property "health" cannot exceed "maxHealth"');
      expect(invalidResult.errors).toContain('All elements in "conditions" must be strings');
    });

    test('validateCharacterRelationship correctly validates CharacterRelationship objects', () => {
      const validRelationship = {
        characterId: 'char-2',
        type: 'ally',
        strength: 75,
        description: 'Fought together in the great battle'
      };

      const result = validateCharacterRelationship(validRelationship);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);

      // Test all valid relationship types
      const validTypes = ['ally', 'enemy', 'neutral', 'romantic', 'family'];
      validTypes.forEach(type => {
        const relationship = { ...validRelationship, type };
        const typeResult = validateCharacterRelationship(relationship);
        expect(typeResult.valid).toBe(true);
      });

      // Test invalid relationship
      const invalidRelationship = {
        characterId: 'char-2',
        type: 'invalid-type',
        strength: 150 // Out of range
      };

      const invalidResult = validateCharacterRelationship(invalidRelationship);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Property "type" must be one of: ally, enemy, neutral, romantic, family');
      expect(invalidResult.errors).toContain('Property "strength" must be between -100 and 100');
    });
  });

  describe('ValidationResult API Integration', () => {
    test('validateWorldAttribute provides specific error messages', () => {
      const invalidAttribute = {
        id: 'attr-1',
        worldId: '',
        name: 'Strength',
        description: '',
        baseValue: -5,
        minValue: 10,
        maxValue: 15
      };

      const result = validateWorldAttribute(invalidAttribute);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // The actual error messages may vary but should be descriptive
    });

    test('validateCharacterBackground provides detailed validation results', () => {
      const invalidBackground = {
        history: '',
        personality: 'Valid personality',
        goals: ['Valid goal', '', null],
        fears: 'not-an-array',
        relationships: [
          {
            characterId: 'char-2',
            type: 'invalid-type',
            strength: 150,
            description: 'Valid description'
          }
        ]
      };

      const result = validateCharacterBackground(invalidBackground);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Should contain detailed error messages about the invalid structure
    });

    test('validateCharacterStatus validates health constraints', () => {
      const invalidStatus = {
        health: 150,
        maxHealth: 100,
        conditions: ['valid-condition', null, 123],
        location: ''
      };

      const result = validateCharacterStatus(invalidStatus);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Property "health" cannot exceed "maxHealth"');
      expect(result.errors).toContain('All elements in "conditions" must be strings');
    });
  });

  describe('Integration with Parent Object Validation', () => {
    test('world validation integrates domain object validation', () => {
      const worldWithInvalidAttribute = {
        id: 'world-1',
        name: 'Test World',
        description: 'A test world',
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
          },
          {
            // Invalid attribute - missing required properties
            id: 'attr-2',
            name: 'Intelligence'
            // Missing worldId, description, baseValue, minValue, maxValue
          }
        ],
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

      // The main world validation should catch invalid nested attributes
      const result = validateWorld(worldWithInvalidAttribute);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => 
        error.includes('Invalid WorldAttribute at index 1')
      )).toBe(true);
    });
  });
});