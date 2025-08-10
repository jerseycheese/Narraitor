/**
 * Simplified Character Deletion Tests
 * 
 * Tests the core character deletion functionality without complex mocking
 */

import { useCharacterStore } from '@/state/characterStore';
import { renderHook, act } from '@testing-library/react';

// Mock only the journal store since that's what we need for deletion
jest.mock('@/state/journalStore', () => ({
  useJournalStore: {
    getState: jest.fn(() => ({
      entries: {},
      deleteSessionEntries: jest.fn()
    }))
  }
}));

describe('Character Deletion Functionality', () => {
  beforeEach(() => {
    // Clear character store before each test
    const { result } = renderHook(() => useCharacterStore());
    act(() => {
      result.current.reset();
    });
    
    jest.clearAllMocks();
  });

  describe('Character Store Deletion', () => {
    test('deleteCharacter removes character from store', () => {
      const { result } = renderHook(() => useCharacterStore());

      let characterId: string;

      // Create a test character
      act(() => {
        characterId = result.current.createCharacter({
          name: 'Test Character',
          description: 'Test description',
          worldId: 'world-1',
          level: 1,
          attributes: [],
          skills: [],
          background: {
            history: 'Test history',
            personality: 'Test personality',
            goals: [],
            fears: [],
            relationships: []
          },
          isPlayer: true,
          status: {
            health: 100,
            maxHealth: 100,
            conditions: []
          },
          inventory: {
            characterId: '',
            items: [],
            capacity: 20,
            categories: []
          }
        });
      });

      // Verify character exists
      expect(result.current.characters[characterId]).toBeDefined();
      expect(result.current.characters[characterId].name).toBe('Test Character');

      // Delete the character
      act(() => {
        result.current.deleteCharacter(characterId);
      });

      // Verify character is deleted
      expect(result.current.characters[characterId]).toBeUndefined();
    });

    test('deleteCharacter clears currentCharacterId when deleting active character', () => {
      const { result } = renderHook(() => useCharacterStore());

      let characterId: string;

      // Create and set active character
      act(() => {
        characterId = result.current.createCharacter({
          name: 'Active Character',
          description: 'Active description',
          worldId: 'world-1',
          level: 1,
          attributes: [],
          skills: [],
          background: {
            history: 'Active history',
            personality: 'Active personality',
            goals: [],
            fears: [],
            relationships: []
          },
          isPlayer: true,
          status: {
            health: 100,
            maxHealth: 100,
            conditions: []
          },
          inventory: {
            characterId: '',
            items: [],
            capacity: 20,
            categories: []
          }
        });

        result.current.setCurrentCharacter(characterId);
      });

      expect(result.current.currentCharacterId).toBe(characterId);

      // Delete the active character
      act(() => {
        result.current.deleteCharacter(characterId);
      });

      // Current character should be cleared
      expect(result.current.currentCharacterId).toBeNull();
    });

    test('deleteCharacter handles non-existent character gracefully', () => {
      const { result } = renderHook(() => useCharacterStore());

      // Try to delete non-existent character
      act(() => {
        result.current.deleteCharacter('non-existent-id');
      });

      // Should not throw error
      expect(Object.keys(result.current.characters)).toHaveLength(0);
    });
  });

  describe('Acceptance Criteria Verification', () => {
    test('character deletion removes character permanently from storage', () => {
      const { result } = renderHook(() => useCharacterStore());

      let characterId: string;

      act(() => {
        characterId = result.current.createCharacter({
          name: 'To Delete',
          description: 'Will be deleted',
          worldId: 'world-1',
          level: 1,
          attributes: [],
          skills: [],
          background: {
            history: 'Delete me',
            personality: 'Deletable',
            goals: [],
            fears: [],
            relationships: []
          },
          isPlayer: true,
          status: {
            health: 100,
            maxHealth: 100,
            conditions: []
          },
          inventory: {
            characterId: '',
            items: [],
            capacity: 20,
            categories: []
          }
        });
      });

      // Verify character is created
      expect(result.current.characters[characterId]).toBeDefined();

      // Delete character
      act(() => {
        result.current.deleteCharacter(characterId);
      });

      // Verify character is permanently removed
      expect(result.current.characters[characterId]).toBeUndefined();
      expect(Object.keys(result.current.characters)).not.toContain(characterId);
    });

    test('character list updates immediately after deletion', () => {
      const { result } = renderHook(() => useCharacterStore());

      let characterId1: string;
      let characterId2: string;

      // Create two characters
      act(() => {
        characterId1 = result.current.createCharacter({
          name: 'Character 1',
          description: 'First character',
          worldId: 'world-1',
          level: 1,
          attributes: [],
          skills: [],
          background: {
            history: 'First history',
            personality: 'First personality',
            goals: [],
            fears: [],
            relationships: []
          },
          isPlayer: true,
          status: {
            health: 100,
            maxHealth: 100,
            conditions: []
          },
          inventory: {
            characterId: '',
            items: [],
            capacity: 20,
            categories: []
          }
        });

        characterId2 = result.current.createCharacter({
          name: 'Character 2',
          description: 'Second character',
          worldId: 'world-1',
          level: 1,
          attributes: [],
          skills: [],
          background: {
            history: 'Second history',
            personality: 'Second personality',
            goals: [],
            fears: [],
            relationships: []
          },
          isPlayer: true,
          status: {
            health: 100,
            maxHealth: 100,
            conditions: []
          },
          inventory: {
            characterId: '',
            items: [],
            capacity: 20,
            categories: []
          }
        });
      });

      expect(Object.keys(result.current.characters)).toHaveLength(2);

      // Delete first character
      act(() => {
        result.current.deleteCharacter(characterId1);
      });

      // Character list should update immediately
      expect(Object.keys(result.current.characters)).toHaveLength(1);
      expect(result.current.characters[characterId2]).toBeDefined();
      expect(result.current.characters[characterId1]).toBeUndefined();
    });
  });
});