/**
 * Tests for CharacterStore CRUD Operations
 *
 * Verifies create, read, update, delete, and setCurrentCharacter operations.
 */

import { useCharacterStore } from '../characterStore';
import { createTestCharacterData, setupTestTimers, cleanupTestTimers } from './characterStore.testHelpers';

describe('useCharacterStore - CRUD Operations', () => {
  beforeEach(() => {
    setupTestTimers();
    useCharacterStore.getState().reset();
  });

  afterEach(() => {
    jest.clearAllTimers();
    cleanupTestTimers();
  });

  describe('createCharacter', () => {
    test('should create a new character', () => {
      const characterData = createTestCharacterData();

      const characterId = useCharacterStore.getState().createCharacter(characterData);
      const state = useCharacterStore.getState();

      expect(state.characters[characterId].name).toBe('Test Character');
      expect(state.characters[characterId].worldId).toBe('world-1');
    });

    test('should validate required fields', () => {
      const invalidCharacterData = createTestCharacterData();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (invalidCharacterData as any).name;

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useCharacterStore.getState().createCharacter(invalidCharacterData as any);
      }).toThrow('Character name is required');
    });
  });

  describe('updateCharacter', () => {
    test('should update existing character', () => {
      const characterData = createTestCharacterData({
        name: 'Original Character',
        description: 'Original character description',
        background: {
          history: 'Original description',
          personality: 'Original personality',
          goals: ['Original motivation'],
          fears: [],
          relationships: []
        }
      });

      const characterId = useCharacterStore.getState().createCharacter(characterData);
      const originalUpdatedAt = useCharacterStore.getState().characters[characterId].updatedAt;

      // Advance time by 1 second to ensure timestamp difference
      jest.setSystemTime(new Date('2025-01-15T12:00:01Z'));

      useCharacterStore.getState().updateCharacter(characterId, {
        name: 'Updated Character',
        background: {
          history: 'Updated description',
          personality: 'Updated personality',
          goals: ['Updated goals'],
          fears: [],
          relationships: []
        }
      });

      const state = useCharacterStore.getState();
      expect(state.characters[characterId].name).toBe('Updated Character');
      expect(state.characters[characterId].background.history).toBe('Updated description');
      expect(state.characters[characterId].updatedAt).not.toBe(originalUpdatedAt);
    });

    test('should handle non-existent character', () => {
      useCharacterStore.getState().updateCharacter('non-existent-id', { name: 'Updated' });
      const state = useCharacterStore.getState();
      expect(state.error).toMatchObject({
        title: 'Character Not Found',
        message: 'The specified character could not be found',
        type: 'validation'
      });
    });
  });

  describe('deleteCharacter', () => {
    test('should remove character from store', () => {
      const characterData = createTestCharacterData({
        name: 'To Delete',
        description: 'Character to be deleted',
        background: {
          history: 'Will be deleted',
          personality: 'N/A',
          goals: [],
          fears: [],
          relationships: []
        },
        isPlayer: false
      });

      const characterId = useCharacterStore.getState().createCharacter(characterData);
      useCharacterStore.getState().deleteCharacter(characterId);

      const state = useCharacterStore.getState();
      expect(state.characters[characterId]).toBeUndefined();
    });

    test('should clear currentCharacterId if deleted character was current', () => {
      const characterData = createTestCharacterData({
        name: 'Current Character',
        description: 'Will be current',
        background: {
          history: 'Current',
          personality: 'Active',
          goals: [],
          fears: [],
          relationships: []
        }
      });

      const characterId = useCharacterStore.getState().createCharacter(characterData);

      useCharacterStore.getState().setCurrentCharacter(characterId);
      expect(useCharacterStore.getState().currentCharacterId).toBe(characterId);

      useCharacterStore.getState().deleteCharacter(characterId);

      const state = useCharacterStore.getState();
      expect(state.currentCharacterId).toBeNull();
      expect(state.characters[characterId]).toBeUndefined();
    });
  });

  describe('setCurrentCharacter', () => {
    test('should set current character ID', () => {
      const characterData = createTestCharacterData({
        name: 'Selected Character',
        description: 'To be selected',
        background: {
          history: 'Selected',
          personality: 'Active',
          goals: [],
          fears: [],
          relationships: []
        }
      });

      const characterId = useCharacterStore.getState().createCharacter(characterData);

      useCharacterStore.getState().setCurrentCharacter(characterId);

      const state = useCharacterStore.getState();
      expect(state.currentCharacterId).toBe(characterId);
      expect(state.currentEntityId).toBe(characterId);
    });

    test('should handle non-existent character', () => {
      useCharacterStore.getState().setCurrentCharacter('non-existent-id');

      const state = useCharacterStore.getState();
      expect(state.error).toMatchObject({
        title: 'Character Not Found',
        message: 'The specified character could not be found',
        type: 'validation'
      });
    });
  });
});
