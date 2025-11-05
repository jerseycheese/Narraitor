/**
 * Tests for npcStore CRUD operations and retrieval
 * Covers create, read, update, delete operations
 */

import { useNPCStore } from '../npcStore';
import { createTestNPCData, resetNPCStore } from './npcStore.testHelpers';

describe('npcStore - CRUD Operations', () => {
  beforeEach(() => {
    resetNPCStore(useNPCStore);
  });

  describe('NPC creation', () => {
    test('should create a new NPC with generated ID', () => {
      const npcData = createTestNPCData({
        name: 'Mysterious Stranger',
        description: 'A hooded figure lurking in the shadows',
      });

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
      const npcData = createTestNPCData({
        name: 'Elara the Wise',
        description: 'An ancient sage with silver hair',
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      const npcId = useNPCStore.getState().createNPC(npcData);
      const state = useNPCStore.getState();

      expect(state.npcs[npcId].avatarUrl).toBe('https://example.com/avatar.jpg');
    });
  });

  describe('NPC updates', () => {
    test('should update NPC properties', () => {
      const npcData = createTestNPCData({
        name: 'Guard Captain',
        description: 'A stern-looking warrior',
      });

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
      const npcData = createTestNPCData({
        name: 'Traveling Merchant',
        description: 'A well-traveled trader',
      });

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
  });

  describe('NPC deletion', () => {
    test('should delete NPC and clean up references', () => {
      const npcData = createTestNPCData({
        name: 'Temporary NPC',
        description: 'To be deleted',
      });

      const npcId = useNPCStore.getState().createNPC(npcData);
      useNPCStore.getState().deleteNPC(npcId);

      const state = useNPCStore.getState();
      expect(state.npcs[npcId]).toBeUndefined();
      expect(state.worldNpcs['world-123']).toBeUndefined();
    });
  });

  describe('NPC retrieval', () => {
    test('should get NPCs by world', () => {
      const world1 = 'world-123';
      const world2 = 'world-456';

      // Create NPCs for different worlds
      const npc1Id = useNPCStore.getState().createNPC(createTestNPCData({
        worldId: world1,
        name: 'NPC 1',
        description: 'First NPC',
      }));

      useNPCStore.getState().createNPC(createTestNPCData({
        worldId: world1,
        name: 'NPC 2',
        description: 'Second NPC',
      }));

      useNPCStore.getState().createNPC(createTestNPCData({
        worldId: world2,
        name: 'NPC 3',
        description: 'Different world NPC',
      }));

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
      const npcData = createTestNPCData();

      const npcId = useNPCStore.getState().createNPC(npcData);
      const npc = useNPCStore.getState().getById(npcId);

      expect(npc).toBeDefined();
      expect(npc?.name).toBe('Test NPC');
    });

    test('should get all NPCs', () => {
      useNPCStore.getState().createNPC(createTestNPCData({
        name: 'NPC 1',
        description: 'First',
      }));

      useNPCStore.getState().createNPC(createTestNPCData({
        name: 'NPC 2',
        description: 'Second',
      }));

      const allNPCs = useNPCStore.getState().getAll();
      expect(allNPCs).toHaveLength(2);
    });
  });
});
