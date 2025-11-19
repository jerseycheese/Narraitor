/**
 * Tests for npcStore world management and state
 * Covers world-level operations and state management
 */

import { useNPCStore } from '../npcStore';
import { createTestNPCData, resetNPCStore } from './npcStore.testHelpers';

describe('npcStore - World Management and State', () => {
  beforeEach(() => {
    resetNPCStore(useNPCStore);
  });

  describe('world management', () => {
    test('should clear all NPCs for a world', () => {
      const worldId = 'world-123';

      // Create multiple NPCs for the world
      const npc1Id = useNPCStore.getState().createNPC(createTestNPCData({
        worldId,
        name: 'NPC 1',
        description: 'First NPC',
      }));

      const npc2Id = useNPCStore.getState().createNPC(createTestNPCData({
        worldId,
        name: 'NPC 2',
        description: 'Second NPC',
      }));

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

      useNPCStore.getState().createNPC(createTestNPCData({
        worldId: world1,
        name: 'NPC 1',
        description: 'World 1 NPC',
      }));

      const npc2Id = useNPCStore.getState().createNPC(createTestNPCData({
        worldId: world2,
        name: 'NPC 2',
        description: 'World 2 NPC',
      }));

      // Clear world 1
      useNPCStore.getState().clearWorldNPCs(world1);

      const state = useNPCStore.getState();
      expect(state.worldNpcs[world2]).toContain(npc2Id);
    });
  });

  describe('state management', () => {
    test('should set current NPC', () => {
      const npcData = createTestNPCData();

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
  });
});
