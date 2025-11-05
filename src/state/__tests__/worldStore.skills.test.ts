/**
 * Tests for worldStore skill management and settings
 * Covers adding skills and updating world settings
 */

import { useWorldStore } from '../worldStore';
import { createTestWorldData, createTestSkillData } from './worldStore.testHelpers';

describe('useWorldStore - Skills and Settings', () => {
  let worldId: string;

  beforeEach(() => {
    useWorldStore.getState().reset();
    worldId = useWorldStore.getState().createWorld(createTestWorldData({
      name: 'Skill Test World',
      description: 'A test world for skill management',
    }));
  });

  describe('skill management', () => {
    test('should add skill to world', () => {
      const skillData = createTestSkillData();

      useWorldStore.getState().addSkill(worldId, skillData);
      const state = useWorldStore.getState();
      const world = state.worlds[worldId];

      expect(world.skills).toHaveLength(1);
      expect(world.skills[0].name).toBe('Swordsmanship');
      expect(world.skills[0].worldId).toBe(worldId);
    });

    test('should enforce max skills limit', () => {
      const world = useWorldStore.getState().worlds[worldId];
      world.settings.maxSkills = 1;

      useWorldStore.getState().addSkill(worldId, createTestSkillData({
        name: 'Skill 1',
        description: 'First test skill',
        difficulty: 'easy',
        baseValue: 1,
        minValue: 0,
        maxValue: 5
      }));

      useWorldStore.getState().addSkill(worldId, createTestSkillData({
        name: 'Skill 2',
        description: 'Second test skill',
        difficulty: 'easy',
        baseValue: 1,
        minValue: 0,
        maxValue: 5
      }));

      const state = useWorldStore.getState();
      expect(state.worlds[worldId].skills).toHaveLength(1);
      expect(state.error?.message).toBe('Maximum skills limit reached');
    });
  });

  describe('settings management', () => {
    test('should update world settings', () => {
      useWorldStore.getState().updateSettings(worldId, {
        maxAttributes: 10,
        attributePointPool: 30
      });

      const state = useWorldStore.getState();
      const settings = state.worlds[worldId].settings;

      expect(settings.maxAttributes).toBe(10);
      expect(settings.attributePointPool).toBe(30);
      expect(settings.maxSkills).toBe(8); // Unchanged
    });
  });
});
