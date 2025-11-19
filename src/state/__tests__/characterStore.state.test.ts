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

  describe('error handling and recovery', () => {
    test('should set error and allow recovery via clearError', () => {
      const error = {
        title: 'Test Error',
        message: 'Something went wrong',
        type: 'validation' as ErrorType,
      };

      useCharacterStore.getState().setError(error);

      const stateWithError = useCharacterStore.getState();
      expect(stateWithError.error).toEqual(error);

      // Verify recovery path works
      useCharacterStore.getState().clearError();

      const recoveredState = useCharacterStore.getState();
      expect(recoveredState.error).toBeNull();
    });

    test('should reset store to recover from corrupted state', () => {
      // Simulate corrupted state
      const characterId = useCharacterStore.getState().createCharacter(
        createTestCharacterData()
      );

      useCharacterStore.getState().setError({
        title: 'Corruption Error',
        message: 'State corrupted',
        type: 'storage' as ErrorType,
      });

      useCharacterStore.getState().setLoading(true);

      // Reset should clear everything
      useCharacterStore.getState().reset();

      const resetState = useCharacterStore.getState();
      expect(resetState.characters).toEqual({});
      expect(resetState.error).toBeNull();
      expect(resetState.loading).toBe(false);
      expect(resetState.currentEntityId).toBeNull();
    });
  });
});
