import { useWorldStore } from '../worldStore';
import { ErrorType } from '@/lib/utils/errorUtils';

describe('useWorldStore', () => {
  beforeEach(() => {
    useWorldStore.getState().reset();
  });

  describe('initialization', () => {
    test('should initialize with default state', () => {
      const state = useWorldStore.getState();
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
        description: 'A test fantasy world',
        genre: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      };

      const worldId = useWorldStore.getState().createWorld(worldData);
      const state = useWorldStore.getState();

      expect(worldId).toBeDefined();
      expect(state.worlds[worldId]).toBeDefined();
      expect(state.worlds[worldId].name).toBe('Test World');
      expect(state.worlds[worldId].genre).toBe('fantasy');
      expect(state.worlds[worldId].createdAt).toBeDefined();
      expect(state.worlds[worldId].updatedAt).toBeDefined();
    });

    test('should validate required fields', () => {
      const invalidWorldData = {
        name: '',
        description: '',
        genre: '',
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
        useWorldStore.getState().createWorld(invalidWorldData);
      }).toThrow('World name is required');
    });
  });

  describe('updateWorld', () => {
    test('should update existing world', async () => {
      const worldData = {
        name: 'Original World',
        description: 'Original fantasy world',
        genre: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      };

      const worldId = useWorldStore.getState().createWorld(worldData);
      const originalUpdatedAt = useWorldStore.getState().worlds[worldId].updatedAt;

      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      useWorldStore.getState().updateWorld(worldId, { name: 'Updated World' });
      const state = useWorldStore.getState();

      expect(state.worlds[worldId].name).toBe('Updated World');
      expect(state.worlds[worldId].updatedAt).not.toBe(originalUpdatedAt);
    });

    test('should handle non-existent world', () => {
      useWorldStore.getState().updateWorld('non-existent-id', { name: 'Updated' });
      const state = useWorldStore.getState();
      expect(state.error?.message).toBe('World not found');
    });
  });

  describe('deleteWorld', () => {
    test('should remove world from store', () => {
      const worldId = useWorldStore.getState().createWorld({
        name: 'To Delete',
        description: 'World to be deleted',
        genre: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      });

      useWorldStore.getState().deleteWorld(worldId);
      const state = useWorldStore.getState();

      expect(state.worlds[worldId]).toBeUndefined();
    });

    test('should clear currentWorldId if deleted world was current', () => {
      const worldId = useWorldStore.getState().createWorld({
        name: 'Current World',
        description: 'Current world test',
        genre: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      });

      useWorldStore.getState().setCurrentWorld(worldId);
      useWorldStore.getState().deleteWorld(worldId);
      const state = useWorldStore.getState();

      expect(state.currentWorldId).toBeNull();
    });
  });

  describe('setCurrentWorld', () => {
    test('should set current world ID', () => {
      const worldId = useWorldStore.getState().createWorld({
        name: 'Current World',
        description: 'Set current world test',
        genre: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      });

      useWorldStore.getState().setCurrentWorld(worldId);
      const state = useWorldStore.getState();

      expect(state.currentWorldId).toBe(worldId);
    });

    test('should handle non-existent world', () => {
      useWorldStore.getState().setCurrentWorld('non-existent-id');
      const state = useWorldStore.getState();
      expect(state.error?.message).toBe('World not found');
      expect(state.currentWorldId).toBeNull();
    });
  });

  describe('attribute management', () => {
    let worldId: string;

    beforeEach(() => {
      worldId = useWorldStore.getState().createWorld({
        name: 'Attribute Test World',
        description: 'World for attribute tests',
        genre: 'fantasy',
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
        description: 'Physical strength attribute',
        baseValue: 10,
        minValue: 3,
        maxValue: 18,
        category: 'Physical'
      };

      useWorldStore.getState().addAttribute(worldId, attributeData);
      const state = useWorldStore.getState();
      const world = state.worlds[worldId];

      expect(world.attributes).toHaveLength(1);
      expect(world.attributes[0].name).toBe('Strength');
      expect(world.attributes[0].worldId).toBe(worldId);
    });

    test('should enforce max attributes limit', () => {
      const world = useWorldStore.getState().worlds[worldId];
      world.settings.maxAttributes = 2;

      // Add two attributes (should succeed)
      useWorldStore.getState().addAttribute(worldId, {
        name: 'Strength',
        description: 'Physical strength attribute',
        baseValue: 10,
        minValue: 3,
        maxValue: 18
      });
      useWorldStore.getState().addAttribute(worldId, {
        name: 'Dexterity',
        description: 'Agility and dexterity attribute',
        baseValue: 10,
        minValue: 3,
        maxValue: 18
      });

      // Third attribute should fail
      useWorldStore.getState().addAttribute(worldId, {
        name: 'Intelligence',
        description: 'Mental acuity attribute',
        baseValue: 10,
        minValue: 3,
        maxValue: 18
      });

      const state = useWorldStore.getState();
      expect(state.worlds[worldId].attributes).toHaveLength(2);
      expect(state.error?.message).toBe('Maximum attributes limit reached');
    });

    test('should update attribute', () => {
      useWorldStore.getState().addAttribute(worldId, {
        name: 'Strength',
        description: 'Physical strength attribute',
        baseValue: 10,
        minValue: 3,
        maxValue: 18
      });

      const state = useWorldStore.getState();
      const attributeId = state.worlds[worldId].attributes[0].id;

      useWorldStore.getState().updateAttribute(worldId, attributeId, {
        name: 'Power',
        baseValue: 12
      });

      const updatedState = useWorldStore.getState();
      const attribute = updatedState.worlds[worldId].attributes[0];
      expect(attribute.name).toBe('Power');
      expect(attribute.baseValue).toBe(12);
    });

    test('should remove attribute', () => {
      useWorldStore.getState().addAttribute(worldId, {
        name: 'Strength',
        description: 'Physical strength attribute',
        baseValue: 10,
        minValue: 3,
        maxValue: 18
      });

      const state = useWorldStore.getState();
      const attributeId = state.worlds[worldId].attributes[0].id;

      useWorldStore.getState().removeAttribute(worldId, attributeId);

      const updatedState = useWorldStore.getState();
      expect(updatedState.worlds[worldId].attributes).toHaveLength(0);
    });
  });

  describe('skill management', () => {
    let worldId: string;

    beforeEach(() => {
      worldId = useWorldStore.getState().createWorld({
        name: 'Skill Test World',
        description: 'A test world for skill management',
        genre: 'fantasy',
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
        description: 'Skill with sword combat',
        difficulty: 'medium' as const,
        category: 'Combat',
        baseValue: 5,
        minValue: 0,
        maxValue: 10
      };

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

      useWorldStore.getState().addSkill(worldId, {
        name: 'Skill 1',
        description: 'First test skill',
        difficulty: 'easy',
        baseValue: 1,
        minValue: 0,
        maxValue: 5
      });

      useWorldStore.getState().addSkill(worldId, {
        name: 'Skill 2',
        description: 'Second test skill',
        difficulty: 'easy',
        baseValue: 1,
        minValue: 0,
        maxValue: 5
      });

      const state = useWorldStore.getState();
      expect(state.worlds[worldId].skills).toHaveLength(1);
      expect(state.error?.message).toBe('Maximum skills limit reached');
    });
  });

  describe('settings management', () => {
    test('should update world settings', () => {
      const worldId = useWorldStore.getState().createWorld({
        name: 'Settings Test World',
        description: 'A test world for settings management',
        genre: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      });

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

  describe('error handling', () => {
    test('should set and clear errors', () => {
      useWorldStore.getState().setError({
        title: 'Test error',
        message: 'Details',
        retryable: false,
        type: ErrorType.UNKNOWN,
      });
      expect(useWorldStore.getState().error?.title).toBe('Test error');

      useWorldStore.getState().clearError();
      expect(useWorldStore.getState().error).toBeNull();
    });
  });

  describe('loading state', () => {
    test('should set loading state', () => {
      useWorldStore.getState().setLoading(true);
      expect(useWorldStore.getState().loading).toBe(true);

      useWorldStore.getState().setLoading(false);
      expect(useWorldStore.getState().loading).toBe(false);
    });
  });

  describe('reset', () => {
    test('should reset store to initial state', () => {
      // Add some data
      useWorldStore.getState().createWorld({
        name: 'Test World',
        description: 'A test fantasy world',
        genre: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      });
      useWorldStore.getState().setError({
        title: 'Some error',
        message: 'Details',
        retryable: false,
        type: ErrorType.UNKNOWN,
      });
      useWorldStore.getState().setLoading(true);

      // Reset
      useWorldStore.getState().reset();
      const state = useWorldStore.getState();

      expect(state.worlds).toEqual({});
      expect(state.currentWorldId).toBeNull();
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });
});
