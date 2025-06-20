// src/types/__tests__/character.types.test.ts
import {
  Character,
  CharacterAttribute,
  CharacterRelationship,
} from '../character.types';

describe('Character Types', () => {
  describe('Character interface', () => {
    test('should create a valid Character object', () => {
      const character: Character = {
        id: 'char-1',
        worldId: 'world-1',
        name: 'John Doe',
        attributes: [],
        skills: [],
        background: {
          history: 'A lone gunslinger',
          personality: 'Stoic and determined',
          goals: ['Find redemption'],
          fears: ['Losing control'],
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
          conditions: [],
          location: 'Dusty Town'
        },
        createdAt: '2025-01-13T10:00:00Z',
        updatedAt: '2025-01-13T10:00:00Z'
      };

      expect(character.worldId).toBe('world-1');
      expect(character.status.health).toBe(100);
      expect(character.background.goals).toHaveLength(1);
    });
  });

  describe('CharacterAttribute interface', () => {
    test('should create a valid CharacterAttribute', () => {
      const attribute: CharacterAttribute = {
        attributeId: 'attr-1',
        value: 15
      };

      expect(attribute.value).toBe(15);
    });
  });

  describe('CharacterRelationship interface', () => {
    test('should create relationships with different types', () => {
      const relationship: CharacterRelationship = {
        characterId: 'char-2',
        type: 'ally',
        strength: 75,
        description: 'Trusted partner'
      };

      expect(relationship.type).toBe('ally');
      expect(relationship.strength).toBe(75);
      expect(relationship.strength).toBeGreaterThanOrEqual(-100);
      expect(relationship.strength).toBeLessThanOrEqual(100);
    });
  });
});
