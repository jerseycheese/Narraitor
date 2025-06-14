// src/types/__tests__/world.types.test.ts
import { World, WorldAttribute, WorldSkill, WorldSettings } from '../world.types';

describe('World Types', () => {
  describe('World interface', () => {
    test('should create a valid World object', () => {
      const world: World = {
        id: 'world-1',
        name: 'Western World',
        description: 'A wild west themed world',
        theme: 'western',
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

      expect(world.id).toBe('world-1');
      expect(world.theme).toBe('western');
      expect(world.settings.maxAttributes).toBe(6);
    });

    test('WorldSettings should have required fields', () => {
      const settings: WorldSettings = {
        maxAttributes: 6,
        maxSkills: 8,
        attributePointPool: 27,
        skillPointPool: 20
      };

      expect(settings.maxAttributes).toBe(6);
      expect(settings.maxSkills).toBe(8);
    });
  });

  describe('WorldAttribute interface', () => {
    test('should create a valid WorldAttribute', () => {
      const attribute: WorldAttribute = {
        id: 'attr-1',
        worldId: 'world-1',
        name: 'Strength',
        description: 'Physical power',
        baseValue: 10,
        minValue: 3,
        maxValue: 18,
        category: 'physical'
      };

      expect(attribute.worldId).toBe('world-1');
      expect(attribute.baseValue).toBe(10);
      expect(attribute.minValue).toBeLessThan(attribute.maxValue);
    });
  });

  describe('WorldSkill interface', () => {
    test('should create a valid WorldSkill', () => {
      const skill: WorldSkill = {
        id: 'skill-1',
        worldId: 'world-1',
        name: 'Gunslinging',
        description: 'Proficiency with firearms',
        difficulty: 'medium',
        attributeIds: ['attr-1'],
        baseValue: 5,
        minValue: 1,
        maxValue: 10
      };

      expect(skill.difficulty).toBe('medium');
      expect(skill.attributeIds).toEqual(['attr-1']);
      expect(skill.baseValue).toBe(5);
      expect(skill.minValue).toBe(1);
      expect(skill.maxValue).toBe(10);
    });

    test('should allow skill without attributeIds', () => {
      const skill: WorldSkill = {
        id: 'skill-2',
        worldId: 'world-1',
        name: 'Survival',
        description: 'Basic survival skills',
        difficulty: 'easy',
        baseValue: 3,
        minValue: 1,
        maxValue: 10
      };

      expect(skill.attributeIds).toBeUndefined();
      expect(skill.baseValue).toBe(3);
    });
  });
});
