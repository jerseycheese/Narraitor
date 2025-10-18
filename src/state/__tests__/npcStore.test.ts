// src/state/__tests__/npcStore.test.ts

import { useNPCStore } from '../npcStore';
import { ErrorType } from '@/lib/utils/errorUtils';

describe('npcStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useNPCStore.setState({
      npcs: {},
      entities: {},
      worldNpcs: {},
      currentEntityId: null,
      error: null,
      loading: false,
    });
  });

  describe('NPC CRUD Operations', () => {
    test('should create a new NPC with generated ID', () => {
      const npcData = {
        worldId: 'world-123',
        name: 'Mysterious Stranger',
        description: 'A hooded figure lurking in the shadows',
      };

      const npcId = useNPCStore.getState().createNPC(npcData);
      const state = useNPCStore.getState();

      expect(npcId).toBeDefined();
      expect(state.npcs[npcId]).toBeDefined();
      expect(state.npcs[npcId].name).toBe('Mysterious Stranger');
      expect(state.npcs[npcId].description).toBe('A hooded figure lurking in the shadows');
      expect(state.npcs[npcId].worldId).toBe('world-123');
      expect(state.npcs[npcId].createdAt).toBeDefined();
      expect(state.worldNpcs['world-123']).toContain(npcId);
    });

    test('should create NPC with optional avatarUrl', () => {
      const npcData = {
        worldId: 'world-123',
        name: 'Elara the Wise',
        description: 'An ancient sage with silver hair',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      const npcId = useNPCStore.getState().createNPC(npcData);
      const state = useNPCStore.getState();

      expect(state.npcs[npcId].avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    test('should update NPC properties', () => {
      const npcData = {
        worldId: 'world-123',
        name: 'Guard Captain',
        description: 'A stern-looking warrior',
      };

      const npcId = useNPCStore.getState().createNPC(npcData);

      // Update the NPC
      useNPCStore.getState().updateNPC(npcId, {
        name: 'Captain Marcus',
        description: 'A battle-hardened veteran with a kind heart',
        avatarUrl: 'https://example.com/marcus.jpg',
      });

      const state = useNPCStore.getState();
      const updatedNPC = state.npcs[npcId];

      expect(updatedNPC.name).toBe('Captain Marcus');
      expect(updatedNPC.description).toBe('A battle-hardened veteran with a kind heart');
      expect(updatedNPC.avatarUrl).toBe('https://example.com/marcus.jpg');
      expect(updatedNPC.updatedAt).toBeDefined();
      expect(updatedNPC.createdAt).toBeDefined();
    });

    test('should update NPC worldId and maintain world references', () => {
      const npcData = {
        worldId: 'world-123',
        name: 'Traveling Merchant',
        description: 'A well-traveled trader',
      };

      const npcId = useNPCStore.getState().createNPC(npcData);

      // Move NPC to different world
      useNPCStore.getState().updateNPC(npcId, {
        worldId: 'world-456',
      });

      const state = useNPCStore.getState();
      const updatedNPC = state.npcs[npcId];

      expect(updatedNPC.worldId).toBe('world-456');
      expect(state.worldNpcs['world-123']).not.toContain(npcId);
      expect(state.worldNpcs['world-456']).toContain(npcId);
    });

    test('should delete NPC and clean up references', () => {
      const npcData = {
        worldId: 'world-123',
        name: 'Temporary NPC',
        description: 'To be deleted',
      };

      const npcId = useNPCStore.getState().createNPC(npcData);
      useNPCStore.getState().deleteNPC(npcId);

      const state = useNPCStore.getState();
      expect(state.npcs[npcId]).toBeUndefined();
      expect(state.worldNpcs['world-123']).toBeUndefined();
    });
  });

  describe('NPC Retrieval', () => {
    test('should get NPCs by world', () => {
      const world1 = 'world-123';
      const world2 = 'world-456';

      // Create NPCs for different worlds
      const npc1Id = useNPCStore.getState().createNPC({
        worldId: world1,
        name: 'NPC 1',
        description: 'First NPC',
      });

      useNPCStore.getState().createNPC({
        worldId: world1,
        name: 'NPC 2',
        description: 'Second NPC',
      });

      useNPCStore.getState().createNPC({
        worldId: world2,
        name: 'NPC 3',
        description: 'Different world NPC',
      });

      const world1NPCs = useNPCStore.getState().getNPCsByWorld(world1);
      const world2NPCs = useNPCStore.getState().getNPCsByWorld(world2);

      expect(world1NPCs).toHaveLength(2);
      expect(world1NPCs[0].id).toBe(npc1Id);
      expect(world2NPCs).toHaveLength(1);
      expect(world2NPCs[0].name).toBe('NPC 3');
    });

    test('should return empty array for world with no NPCs', () => {
      const npcs = useNPCStore.getState().getNPCsByWorld('nonexistent-world');
      expect(npcs).toEqual([]);
    });

    test('should get NPC by ID', () => {
      const npcData = {
        worldId: 'world-123',
        name: 'Test NPC',
        description: 'Test description',
      };

      const npcId = useNPCStore.getState().createNPC(npcData);
      const npc = useNPCStore.getState().getById(npcId);

      expect(npc).toBeDefined();
      expect(npc?.name).toBe('Test NPC');
    });

    test('should get all NPCs', () => {
      useNPCStore.getState().createNPC({
        worldId: 'world-123',
        name: 'NPC 1',
        description: 'First',
      });

      useNPCStore.getState().createNPC({
        worldId: 'world-123',
        name: 'NPC 2',
        description: 'Second',
      });

      const allNPCs = useNPCStore.getState().getAll();
      expect(allNPCs).toHaveLength(2);
    });
  });

  describe('World Management', () => {
    test('should clear all NPCs for a world', () => {
      const worldId = 'world-123';

      // Create multiple NPCs for the world
      const npc1Id = useNPCStore.getState().createNPC({
        worldId,
        name: 'NPC 1',
        description: 'First NPC',
      });

      const npc2Id = useNPCStore.getState().createNPC({
        worldId,
        name: 'NPC 2',
        description: 'Second NPC',
      });

      // Clear world NPCs
      useNPCStore.getState().clearWorldNPCs(worldId);

      const state = useNPCStore.getState();
      expect(state.npcs[npc1Id]).toBeUndefined();
      expect(state.npcs[npc2Id]).toBeUndefined();
      expect(state.worldNpcs[worldId]).toBeUndefined();
    });

    test('should not affect NPCs in other worlds when clearing', () => {
      const world1 = 'world-123';
      const world2 = 'world-456';

      useNPCStore.getState().createNPC({
        worldId: world1,
        name: 'NPC 1',
        description: 'World 1 NPC',
      });

      const npc2Id = useNPCStore.getState().createNPC({
        worldId: world2,
        name: 'NPC 2',
        description: 'World 2 NPC',
      });

      // Clear world 1
      useNPCStore.getState().clearWorldNPCs(world1);

      const state = useNPCStore.getState();
      expect(state.npcs[npc2Id]).toBeDefined();
      expect(state.worldNpcs[world2]).toContain(npc2Id);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid NPC updates', () => {
      useNPCStore.getState().updateNPC('nonexistent-id', { name: 'New Name' });
      const state = useNPCStore.getState();
      expect(state.error?.title).toBe('NPC Not Found');
      expect(state.error?.message).toBe('The specified NPC could not be found.');
    });

    test('should validate required fields', () => {
      expect(() => {
        useNPCStore.getState().createNPC({
          worldId: 'world-123',
          name: '', // Empty name should fail
          description: 'Test description',
        });
      }).toThrow();
    });

    test('should validate worldId is required', () => {
      expect(() => {
        useNPCStore.getState().createNPC({
          worldId: '',
          name: 'Test NPC',
          description: 'Test description',
        });
      }).toThrow();
    });

    test('should validate description is required', () => {
      expect(() => {
        useNPCStore.getState().createNPC({
          worldId: 'world-123',
          name: 'Test NPC',
          description: '',
        });
      }).toThrow();
    });

    test('should reject updates with empty name after normalization', () => {
      const npcData = {
        worldId: 'world-123',
        name: 'Test NPC',
        description: 'Test description',
      };

      const npcId = useNPCStore.getState().createNPC(npcData);

      // Try to update with whitespace-only name
      useNPCStore.getState().updateNPC(npcId, { name: '   ' });

      const state = useNPCStore.getState();
      expect(state.error?.title).toBe('Invalid Name');
      expect(state.error?.message).toBe('NPC name cannot be empty.');
      // NPC should not be updated
      expect(state.npcs[npcId].name).toBe('Test NPC');
    });

    test('should reject updates with empty description after normalization', () => {
      const npcData = {
        worldId: 'world-123',
        name: 'Test NPC',
        description: 'Test description',
      };

      const npcId = useNPCStore.getState().createNPC(npcData);

      // Try to update with whitespace-only description
      useNPCStore.getState().updateNPC(npcId, { description: '   ' });

      const state = useNPCStore.getState();
      expect(state.error?.title).toBe('Invalid Description');
      expect(state.error?.message).toBe('NPC description cannot be empty.');
      // NPC should not be updated
      expect(state.npcs[npcId].description).toBe('Test description');
    });

    test('should reject updates with empty worldId', () => {
      const npcData = {
        worldId: 'world-123',
        name: 'Test NPC',
        description: 'Test description',
      };

      const npcId = useNPCStore.getState().createNPC(npcData);

      // Try to update with empty worldId
      useNPCStore.getState().updateNPC(npcId, { worldId: '' });

      const state = useNPCStore.getState();
      expect(state.error?.title).toBe('Invalid World ID');
      expect(state.error?.message).toBe('World ID is required.');
      // NPC should not be updated
      expect(state.npcs[npcId].worldId).toBe('world-123');
    });

    test('should handle persistence errors gracefully', () => {
      // Simulate error by setting error state
      useNPCStore.getState().setError({
        title: 'Persistence failed',
        message: 'Persistence failed',
        retryable: false,
        type: ErrorType.UNKNOWN,
      });
      expect(useNPCStore.getState().error?.title).toBe('Persistence failed');

      // Clear error
      useNPCStore.getState().clearError();
      expect(useNPCStore.getState().error).toBeNull();
    });
  });

  describe('State Management', () => {
    test('should set current NPC', () => {
      const npcData = {
        worldId: 'world-123',
        name: 'Test NPC',
        description: 'Test description',
      };

      const npcId = useNPCStore.getState().createNPC(npcData);
      useNPCStore.getState().setCurrent(npcId);

      const state = useNPCStore.getState();
      expect(state.currentEntityId).toBe(npcId);
    });

    test('should handle setting non-existent NPC as current', () => {
      useNPCStore.getState().setCurrent('nonexistent-id');
      const state = useNPCStore.getState();
      expect(state.currentEntityId).toBeNull();
      expect(state.error?.title).toBe('NPC Not Found');
    });

    test('should reset store', () => {
      useNPCStore.getState().createNPC({
        worldId: 'world-123',
        name: 'Test NPC',
        description: 'Test description',
      });

      useNPCStore.getState().reset();

      const state = useNPCStore.getState();
      expect(state.npcs).toEqual({});
      expect(state.worldNpcs).toEqual({});
      expect(state.currentEntityId).toBeNull();
      expect(state.error).toBeNull();
    });

    test('should manage loading state', () => {
      useNPCStore.getState().setLoading(true);
      expect(useNPCStore.getState().loading).toBe(true);

      useNPCStore.getState().setLoading(false);
      expect(useNPCStore.getState().loading).toBe(false);
    });
  });
});
