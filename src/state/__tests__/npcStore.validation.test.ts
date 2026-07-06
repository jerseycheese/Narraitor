/**
 * Tests for npcStore validation and error handling
 * Covers input validation and error scenarios
 */

import { useNPCStore } from '../npcStore';
import { ErrorType } from '@/lib/utils/errorUtils';
import { createTestNPCData, resetNPCStore } from './npcStore.testHelpers';

describe('npcStore - Validation and Error Handling', () => {
  beforeEach(() => {
    resetNPCStore(useNPCStore);
  });

  describe('creation validation', () => {
    test('should validate required fields', () => {
      expect(() => {
        useNPCStore.getState().createNPC(createTestNPCData({
          name: '', // Empty name should fail
        }));
      }).toThrow();
    });

    test('should validate worldId is required', () => {
      expect(() => {
        useNPCStore.getState().createNPC(createTestNPCData({
          worldId: '',
        }));
      }).toThrow();
    });

    test('should validate description is required', () => {
      expect(() => {
        useNPCStore.getState().createNPC(createTestNPCData({
          description: '',
        }));
      }).toThrow();
    });
  });

  describe('update validation', () => {
    test('should handle invalid NPC updates', () => {
      useNPCStore.getState().updateNPC('nonexistent-id', { name: 'New Name' });
      const state = useNPCStore.getState();
      expect(state.error?.title).toBe('NPC Not Found');
      expect(state.error?.message).toBe('The specified NPC could not be found.');
    });

    test('should reject updates with empty name after normalization', () => {
      const npcData = createTestNPCData();

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
      const npcData = createTestNPCData();

      const npcId = useNPCStore.getState().createNPC(npcData);

      // Try to update with whitespace-only description
      useNPCStore.getState().updateNPC(npcId, { description: '   ' });

      const state = useNPCStore.getState();
      expect(state.error?.title).toBe('Invalid Description');
      expect(state.error?.message).toBe('NPC description cannot be empty.');
      // NPC should not be updated
      expect(state.npcs[npcId].description).toBe('A test NPC for testing');
    });

    test('should reject updates with empty worldId', () => {
      const npcData = createTestNPCData();

      const npcId = useNPCStore.getState().createNPC(npcData);

      // Try to update with empty worldId
      useNPCStore.getState().updateNPC(npcId, { worldId: '' });

      const state = useNPCStore.getState();
      expect(state.error?.title).toBe('Invalid World ID');
      expect(state.error?.message).toBe('World ID is required.');
      // NPC should not be updated
      expect(state.npcs[npcId].worldId).toBe('world-123');
    });
  });

  describe('error state management', () => {
    test('should handle persistence errors gracefully', () => {
      // Simulate error by setting error state
      useNPCStore.getState().setError({
        title: 'Persistence failed',
        message: 'Persistence failed',
        retryable: false,
        type: ErrorType.UNKNOWN,
        severity: 'error',
      });
      expect(useNPCStore.getState().error?.title).toBe('Persistence failed');

      // Clear error
      useNPCStore.getState().clearError();
      expect(useNPCStore.getState().error).toBeNull();
    });
  });
});
