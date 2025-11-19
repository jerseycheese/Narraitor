/**
 * Tests for CharacterStore State Management
 *
 * Verifies initialization, error handling, loading state, and reset functionality.
 */

import { useCharacterStore } from '../characterStore';
import { ErrorType } from '@/lib/utils/errorUtils';
import { createTestCharacterData, setupTestTimers } from './characterStore.testHelpers';

describe('useCharacterStore - State Management', () => {
  beforeEach(() => {
    setupTestTimers();
    useCharacterStore.getState().reset();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('error handling', () => {
    test('should set and clear errors', () => {
      useCharacterStore.getState().setError({
        title: 'Test error',
        message: 'Details',
        retryable: false,
        type: ErrorType.UNKNOWN
      });
      expect(useCharacterStore.getState().error?.title).toBe('Test error');

      useCharacterStore.getState().clearError();
      expect(useCharacterStore.getState().error).toBeNull();
    });
  });

  describe('reset', () => {
    test('should reset store to initial state', () => {
      // Add some data
      useCharacterStore.getState().createCharacter(createTestCharacterData());
      useCharacterStore.getState().setError({
        title: 'Some error',
        message: 'Details',
        retryable: false,
        type: ErrorType.UNKNOWN
      });
      useCharacterStore.getState().setLoading(true);

      // Reset
      useCharacterStore.getState().reset();
      const state = useCharacterStore.getState();

      expect(state.characters).toEqual({});
      expect(state.entities).toEqual({});
      expect(state.currentCharacterId).toBeNull();
      expect(state.currentEntityId).toBeNull();
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });
});
