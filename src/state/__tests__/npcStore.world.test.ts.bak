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
    test('should handle setting non-existent NPC as current', () => {
      useNPCStore.getState().setCurrent('nonexistent-id');
      const state = useNPCStore.getState();
      expect(state.currentEntityId).toBeNull();
      expect(state.error?.title).toBe('NPC Not Found');
    });
  });
});
