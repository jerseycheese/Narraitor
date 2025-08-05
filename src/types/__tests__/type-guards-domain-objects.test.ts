// src/types/__tests__/type-guards-domain-objects.test.ts

// Tests for domain-specific type guards that need to be implemented
// These will fail initially (RED phase) until the type guards are created

import {
  isWorldAttribute,
  isWorldSkill,
  isWorldSettings,
  isWorldImage,
  isCharacterAttribute,
  isCharacterSkill,
  isCharacterBackground,
  isCharacterStatus,
  isCharacterRelationship,
  validateWorldAttribute,
  validateCharacterBackground,
  validateCharacterStatus,
} from '../type-guards';

describe('Domain-Specific Type Guards', () => {
  
  describe('World Component Type Guards', () => {
    test('isWorldAttribute correctly identifies WorldAttribute objects', () => {
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

      expect(isWorldAttribute(validWorldAttribute)).toBe(true);

      // Test missing required properties
      const invalidAttributes = [
        { ...validWorldAttribute, id: undefined },
        { ...validWorldAttribute, worldId: undefined },
        { ...validWorldAttribute, name: undefined },
        { ...validWorldAttribute, description: undefined },
        { ...validWorldAttribute, baseValue: undefined },
        { ...validWorldAttribute, minValue: undefined },
        { ...validWorldAttribute, maxValue: undefined },
        { ...validWorldAttribute, baseValue: 'not-a-number' },
        { ...validWorldAttribute, minValue: 'not-a-number' },
        { ...validWorldAttribute, maxValue: 'not-a-number' },
      ];

      invalidAttributes.forEach((attr, index) => {
        expect(isWorldAttribute(attr)).toBe(false, `Invalid attribute ${index} should fail`);
      });
    });

    test('isWorldSkill correctly identifies WorldSkill objects', () => {
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

      expect(isWorldSkill(validWorldSkill)).toBe(true);

      // Test with minimal required properties (optional attributeIds and category)
      const minimalSkill = {
        id: 'skill-2',
        worldId: 'world-1',
        name: 'Survival',
        description: 'Living off the land',
        difficulty: 'easy',
        baseValue: 3,
        minValue: 0,
        maxValue: 8
      };

      expect(isWorldSkill(minimalSkill)).toBe(true);

      // Test invalid difficulty
      const invalidDifficulty = {
        ...validWorldSkill,
        difficulty: 'impossible' // Not a valid SkillDifficulty
      };

      expect(isWorldSkill(invalidDifficulty)).toBe(false);
    });

    test('isWorldSettings correctly identifies WorldSettings objects', () => {
      const validSettings = {
        maxAttributes: 6,
        maxSkills: 8,
        attributePointPool: 27,
        skillPointPool: 20
      };

      expect(isWorldSettings(validSettings)).toBe(true);

      // Test missing properties
      const invalidSettings = [
        { ...validSettings, maxAttributes: undefined },
        { ...validSettings, maxSkills: undefined },
        { ...validSettings, attributePointPool: undefined },
        { ...validSettings, skillPointPool: undefined },
        { ...validSettings, maxAttributes: 'not-a-number' },
        { ...validSettings, maxSkills: -1 }, // Negative value
        { ...validSettings, attributePointPool: 0 }, // Zero value might be invalid
      ];

      invalidSettings.forEach((settings, index) => {
        expect(isWorldSettings(settings)).toBe(false, `Invalid settings ${index} should fail`);
      });
    });

    test('isWorldImage correctly identifies WorldImage objects', () => {
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

      expect(isWorldImage(validAIImage)).toBe(true);
      expect(isWorldImage(validPlaceholderImage)).toBe(true);

      // Test invalid types
      const invalidImages = [
        { ...validAIImage, type: 'invalid-type' },
        { ...validAIImage, type: undefined },
        { ...validAIImage, url: 123 }, // Should be string or null
        { type: 'ai-generated', url: null }, // AI-generated should have URL
      ];

      invalidImages.forEach((image, index) => {
        expect(isWorldImage(image)).toBe(false, `Invalid image ${index} should fail`);
      });
    });
  });

  describe('Character Component Type Guards', () => {
    test('isCharacterAttribute correctly identifies CharacterAttribute objects', () => {
      const validAttribute = {
        attributeId: 'attr-1',
        value: 15
      };

      expect(isCharacterAttribute(validAttribute)).toBe(true);

      // Test invalid structures
      const invalidAttributes = [
        { attributeId: 'attr-1' }, // Missing value
        { value: 15 }, // Missing attributeId
        { attributeId: '', value: 15 }, // Empty attributeId
        { attributeId: 'attr-1', value: 'not-a-number' },
        { attributeId: null, value: 15 },
        { attributeId: 'attr-1', value: -5 }, // Negative value might be invalid
      ];

      invalidAttributes.forEach((attr, index) => {
        expect(isCharacterAttribute(attr)).toBe(false, `Invalid attribute ${index} should fail`);
      });
    });

    test('isCharacterSkill correctly identifies CharacterSkill objects', () => {
      const validSkill = {
        skillId: 'skill-1',
        level: 3,
        experience: 150,
        isActive: true
      };

      expect(isCharacterSkill(validSkill)).toBe(true);

      // Test invalid structures
      const invalidSkills = [
        { ...validSkill, skillId: undefined },
        { ...validSkill, level: undefined },
        { ...validSkill, experience: undefined },
        { ...validSkill, isActive: undefined },
        { ...validSkill, skillId: '' },
        { ...validSkill, level: -1 },
        { ...validSkill, experience: 'not-a-number' },
        { ...validSkill, isActive: 'not-a-boolean' },
      ];

      invalidSkills.forEach((skill, index) => {
        expect(isCharacterSkill(skill)).toBe(false, `Invalid skill ${index} should fail`);
      });
    });

    test('isCharacterBackground correctly identifies CharacterBackground objects', () => {
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
        isKnownFigure: false,
        knownFigureType: undefined
      };

      expect(isCharacterBackground(validBackground)).toBe(true);

      // Test minimal valid background
      const minimalBackground = {
        history: 'Unknown past',
        personality: 'Mysterious',
        goals: [],
        fears: [],
        relationships: []
      };

      expect(isCharacterBackground(minimalBackground)).toBe(true);

      // Test invalid backgrounds
      const invalidBackgrounds = [
        { ...validBackground, history: undefined },
        { ...validBackground, personality: undefined },
        { ...validBackground, goals: undefined },
        { ...validBackground, fears: undefined },
        { ...validBackground, relationships: undefined },
        { ...validBackground, history: '' }, // Empty string
        { ...validBackground, goals: 'not-an-array' },
        { ...validBackground, fears: [123, null] }, // Should be strings
        { ...validBackground, relationships: 'not-an-array' },
        { ...validBackground, isKnownFigure: 'not-a-boolean' },
        { ...validBackground, knownFigureType: 'invalid-type' },
      ];

      invalidBackgrounds.forEach((bg, index) => {
        expect(isCharacterBackground(bg)).toBe(false, `Invalid background ${index} should fail`);
      });
    });

    test('isCharacterStatus correctly identifies CharacterStatus objects', () => {
      const validStatus = {
        health: 75,
        maxHealth: 100,
        conditions: ['injured', 'blessed'],
        location: 'Ancient Forest'
      };

      expect(isCharacterStatus(validStatus)).toBe(true);

      // Test minimal valid status
      const minimalStatus = {
        health: 100,
        maxHealth: 100,
        conditions: []
      };

      expect(isCharacterStatus(minimalStatus)).toBe(true);

      // Test invalid statuses
      const invalidStatuses = [
        { ...validStatus, health: undefined },
        { ...validStatus, maxHealth: undefined },
        { ...validStatus, conditions: undefined },
        { ...validStatus, health: 'not-a-number' },
        { ...validStatus, maxHealth: -10 }, // Negative maxHealth
        { ...validStatus, health: 150, maxHealth: 100 }, // Health > maxHealth
        { ...validStatus, conditions: 'not-an-array' },
        { ...validStatus, conditions: [123, null] }, // Should be strings
      ];

      invalidStatuses.forEach((status, index) => {
        expect(isCharacterStatus(status)).toBe(false, `Invalid status ${index} should fail`);
      });
    });

    test('isCharacterRelationship correctly identifies CharacterRelationship objects', () => {
      const validRelationship = {
        characterId: 'char-2',
        type: 'ally',
        strength: 75,
        description: 'Fought together in the great battle'
      };

      expect(isCharacterRelationship(validRelationship)).toBe(true);

      // Test minimal valid relationship
      const minimalRelationship = {
        characterId: 'char-3',
        type: 'neutral',
        strength: 0
      };

      expect(isCharacterRelationship(minimalRelationship)).toBe(true);

      // Test all valid relationship types
      const validTypes = ['ally', 'enemy', 'neutral', 'romantic', 'family'];
      validTypes.forEach(type => {
        const relationship = { ...validRelationship, type };
        expect(isCharacterRelationship(relationship)).toBe(true, `Type '${type}' should be valid`);
      });

      // Test invalid relationships
      const invalidRelationships = [
        { ...validRelationship, characterId: undefined },
        { ...validRelationship, type: undefined },
        { ...validRelationship, strength: undefined },
        { ...validRelationship, characterId: '' },
        { ...validRelationship, type: 'invalid-type' },
        { ...validRelationship, strength: 'not-a-number' },
        { ...validRelationship, strength: -150 }, // Out of range
        { ...validRelationship, strength: 150 }, // Out of range (should be -100 to 100)
      ];

      invalidRelationships.forEach((rel, index) => {
        expect(isCharacterRelationship(rel)).toBe(false, `Invalid relationship ${index} should fail`);
      });
    });
  });

  describe('ValidationResult API for Domain Objects', () => {
    test('validateWorldAttribute provides specific error messages', () => {
      const invalidAttribute = {
        id: 'attr-1',
        worldId: '',
        name: 'Strength',
        description: '',
        baseValue: -5,
        minValue: 'not-a-number',
        maxValue: 15
      };

      const result = validateWorldAttribute(invalidAttribute);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Property "worldId" cannot be empty');
      expect(result.errors).toContain('Property "description" cannot be empty');
      expect(result.errors).toContain('Property "baseValue" cannot be negative');
      expect(result.errors).toContain('Property "minValue" must be a number');
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
      expect(result.errors).toContain('Property "history" cannot be empty');
      expect(result.errors).toContain('Property "goals" contains invalid values at indices: 1, 2');
      expect(result.errors).toContain('Property "fears" must be an array');
      expect(result.errors).toContain('Relationship at index 0: invalid type "invalid-type"');
      expect(result.errors).toContain('Relationship at index 0: strength must be between -100 and 100');
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
      expect(result.errors).toContain('Property "health" cannot exceed maxHealth');
      expect(result.errors).toContain('Property "conditions" contains invalid values at indices: 1, 2');
    });
  });

  describe('Integration with Existing Type System', () => {
    test('domain type guards work with parent object validation', () => {
      // This tests that the domain-specific type guards integrate properly
      // with the main World and Character type guards
      
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
        error.includes('attributes[1]') || 
        error.includes('Invalid attribute at index 1')
      )).toBe(true);
    });
  });
});