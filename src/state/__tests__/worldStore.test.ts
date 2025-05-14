import { worldStore } from '../worldStore';

describe('worldStore', () => {
  beforeEach(() => {
    worldStore.getState().reset();
  });

  describe('initialization', () => {
    test('should initialize with default state', () => {
      const state = worldStore.getState();
      expect(state.worlds).toEqual({});
      expect(state.currentWorldId).toBeNull();
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });

  describe('createWorld', () => {
    test('should create a new world with generated ID', () => {
      const worldData = {
        name: 'Test World',
        theme: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      };

      const worldId = worldStore.getState().createWorld(worldData);
      const state = worldStore.getState();

      expect(worldId).toBeDefined();
      expect(state.worlds[worldId]).toBeDefined();
      expect(state.worlds[worldId].name).toBe('Test World');
      expect(state.worlds[worldId].theme).toBe('fantasy');
      expect(state.worlds[worldId].createdAt).toBeDefined();
      expect(state.worlds[worldId].updatedAt).toBeDefined();
    });

    test('should validate required fields', () => {
      const invalidWorldData = {
        name: '',
        theme: '',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 0,
          maxSkills: 0,
          attributePointPool: 0,
          skillPointPool: 0
        }
      };

      expect(() => {
        worldStore.getState().createWorld(invalidWorldData);
      }).toThrow('World name is required');
    });
  });

  describe('updateWorld', () => {
    test('should update existing world', () => {
      const worldData = {
        name: 'Original World',
        theme: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      };

      const worldId = worldStore.getState().createWorld(worldData);
      const originalUpdatedAt = worldStore.getState().worlds[worldId].updatedAt;

      // Wait a moment to ensure timestamp difference
      jest.advanceTimersByTime(1);

      worldStore.getState().updateWorld(worldId, { name: 'Updated World' });
      const state = worldStore.getState();

      expect(state.worlds[worldId].name).toBe('Updated World');
      expect(state.worlds[worldId].updatedAt).not.toBe(originalUpdatedAt);
    });

    test('should handle non-existent world', () => {
      worldStore.getState().updateWorld('non-existent-id', { name: 'Updated' });
      const state = worldStore.getState();
      expect(state.error).toBe('World not found');
    });
  });

  describe('deleteWorld', () => {
    test('should remove world from store', () => {
      const worldId = worldStore.getState().createWorld({
        name: 'To Delete',
        theme: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      });

      worldStore.getState().deleteWorld(worldId);
      const state = worldStore.getState();

      expect(state.worlds[worldId]).toBeUndefined();
    });

    test('should clear currentWorldId if deleted world was current', () => {
      const worldId = worldStore.getState().createWorld({
        name: 'Current World',
        theme: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      });

      worldStore.getState().setCurrentWorld(worldId);
      worldStore.getState().deleteWorld(worldId);
      const state = worldStore.getState();

      expect(state.currentWorldId).toBeNull();
    });
  });

  describe('setCurrentWorld', () => {
    test('should set current world ID', () => {
      const worldId = worldStore.getState().createWorld({
        name: 'Current World',
        theme: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      });

      worldStore.getState().setCurrentWorld(worldId);
      const state = worldStore.getState();

      expect(state.currentWorldId).toBe(worldId);
    });

    test('should handle non-existent world', () => {
      worldStore.getState().setCurrentWorld('non-existent-id');
      const state = worldStore.getState();
      expect(state.error).toBe('World not found');
      expect(state.currentWorldId).toBeNull();
    });
  });

  describe('attribute management', () => {
    let worldId: string;

    beforeEach(() => {
      worldId = worldStore.getState().createWorld({
        name: 'Attribute Test World',
        theme: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      });
    });

    test('should add attribute to world', () => {
      const attributeData = {
        name: 'Strength',
        baseValue: 10,
        minValue: 3,
        maxValue: 18,
        category: 'Physical'
      };

      worldStore.getState().addAttribute(worldId, attributeData);
      const state = worldStore.getState();
      const world = state.worlds[worldId];

      expect(world.attributes).toHaveLength(1);
      expect(world.attributes[0].name).toBe('Strength');
      expect(world.attributes[0].worldId).toBe(worldId);
    });

    test('should enforce max attributes limit', () => {
      const world = worldStore.getState().worlds[worldId];
      world.settings.maxAttributes = 2;

      // Add two attributes (should succeed)
      worldStore.getState().addAttribute(worldId, {
        name: 'Strength',
        baseValue: 10,
        minValue: 3,
        maxValue: 18
      });
      worldStore.getState().addAttribute(worldId, {
        name: 'Dexterity',
        baseValue: 10,
        minValue: 3,
        maxValue: 18
      });

      // Third attribute should fail
      worldStore.getState().addAttribute(worldId, {
        name: 'Intelligence',
        baseValue: 10,
        minValue: 3,
        maxValue: 18
      });

      const state = worldStore.getState();
      expect(state.worlds[worldId].attributes).toHaveLength(2);
      expect(state.error).toBe('Maximum attributes limit reached');
    });

    test('should update attribute', () => {
      worldStore.getState().addAttribute(worldId, {
        name: 'Strength',
        baseValue: 10,
        minValue: 3,
        maxValue: 18
      });

      const state = worldStore.getState();
      const attributeId = state.worlds[worldId].attributes[0].id;

      worldStore.getState().updateAttribute(worldId, attributeId, {
        name: 'Power',
        baseValue: 12
      });

      const updatedState = worldStore.getState();
      const attribute = updatedState.worlds[worldId].attributes[0];
      expect(attribute.name).toBe('Power');
      expect(attribute.baseValue).toBe(12);
    });

    test('should remove attribute', () => {
      worldStore.getState().addAttribute(worldId, {
        name: 'Strength',
        baseValue: 10,
        minValue: 3,
        maxValue: 18
      });

      const state = worldStore.getState();
      const attributeId = state.worlds[worldId].attributes[0].id;

      worldStore.getState().removeAttribute(worldId, attributeId);

      const updatedState = worldStore.getState();
      expect(updatedState.worlds[worldId].attributes).toHaveLength(0);
    });
  });

  describe('skill management', () => {
    let worldId: string;

    beforeEach(() => {
      worldId = worldStore.getState().createWorld({
        name: 'Skill Test World',
        theme: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      });
    });

    test('should add skill to world', () => {
      const skillData = {
        name: 'Swordsmanship',
        difficulty: 'medium' as const,
        category: 'Combat'
      };

      worldStore.getState().addSkill(worldId, skillData);
      const state = worldStore.getState();
      const world = state.worlds[worldId];

      expect(world.skills).toHaveLength(1);
      expect(world.skills[0].name).toBe('Swordsmanship');
      expect(world.skills[0].worldId).toBe(worldId);
    });

    test('should enforce max skills limit', () => {
      const world = worldStore.getState().worlds[worldId];
      world.settings.maxSkills = 1;

      worldStore.getState().addSkill(worldId, {
        name: 'Skill 1',
        difficulty: 'easy'
      });

      worldStore.getState().addSkill(worldId, {
        name: 'Skill 2',
        difficulty: 'easy'
      });

      const state = worldStore.getState();
      expect(state.worlds[worldId].skills).toHaveLength(1);
      expect(state.error).toBe('Maximum skills limit reached');
    });
  });

  describe('settings management', () => {
    test('should update world settings', () => {
      const worldId = worldStore.getState().createWorld({
        name: 'Settings Test World',
        theme: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      });

      worldStore.getState().updateSettings(worldId, {
        maxAttributes: 10,
        attributePointPool: 30
      });

      const state = worldStore.getState();
      const settings = state.worlds[worldId].settings;

      expect(settings.maxAttributes).toBe(10);
      expect(settings.attributePointPool).toBe(30);
      expect(settings.maxSkills).toBe(8); // Unchanged
    });
  });

  describe('error handling', () => {
    test('should set and clear errors', () => {
      worldStore.getState().setError('Test error');
      expect(worldStore.getState().error).toBe('Test error');

      worldStore.getState().clearError();
      expect(worldStore.getState().error).toBeNull();
    });
  });

  describe('loading state', () => {
    test('should set loading state', () => {
      worldStore.getState().setLoading(true);
      expect(worldStore.getState().loading).toBe(true);

      worldStore.getState().setLoading(false);
      expect(worldStore.getState().loading).toBe(false);
    });
  });

  describe('reset', () => {
    test('should reset store to initial state', () => {
      // Add some data
      worldStore.getState().createWorld({
        name: 'Test World',
        theme: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      });
      worldStore.getState().setError('Some error');
      worldStore.getState().setLoading(true);

      // Reset
      worldStore.getState().reset();
      const state = worldStore.getState();

      expect(state.worlds).toEqual({});
      expect(state.currentWorldId).toBeNull();
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });
});
