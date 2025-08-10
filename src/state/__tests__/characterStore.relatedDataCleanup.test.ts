import { act, renderHook } from '@testing-library/react';
import { useCharacterStore } from '../characterStore';
import { useJournalStore } from '../journalStore';

// Mock journal store
jest.mock('../journalStore');

describe('CharacterStore - Related Data Cleanup', () => {
  let testCharacterId1: string;
  let testCharacterId2: string;

  const mockJournalStore = {
    entries: {} as Record<string, any>,
    sessionEntries: {
      'session-1': ['entry-1'],
      'session-2': ['entry-2'],
      'session-3': ['entry-3']
    },
    deleteSessionEntries: jest.fn(),
    getSessionEntries: jest.fn()
  };

  // Initialize entries dynamically based on test character IDs
  const initializeMockEntries = () => {
    mockJournalStore.entries = {
      'entry-1': {
        id: 'entry-1',
        sessionId: 'session-1',
        characterId: testCharacterId1,
        content: 'Test entry'
      },
      'entry-2': {
        id: 'entry-2', 
        sessionId: 'session-2',
        characterId: testCharacterId1,
        content: 'Another entry'
      },
      'entry-3': {
        id: 'entry-3',
        sessionId: 'session-3', 
        characterId: testCharacterId2,
        content: 'Different character entry'
      }
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useJournalStore as unknown as jest.Mock).mockImplementation((selector?: (state: typeof mockJournalStore) => unknown) => {
      if (selector) {
        return selector(mockJournalStore);
      }
      return mockJournalStore;
    });

    // Mock getState for store access
    (useJournalStore as unknown as jest.Mock).getState = jest.fn(() => mockJournalStore);
  });

  beforeEach(() => {
    // Clear character store before each test
    const { result } = renderHook(() => useCharacterStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Character Deletion with Journal Cleanup', () => {
    test('deletes character and cleans up related journal entries', () => {
      const { result } = renderHook(() => useCharacterStore());

      // Create test characters
      let characterId1: string;
      let characterId2: string;

      act(() => {
        testCharacterId1 = result.current.createCharacter({
          name: 'Test Character 1',
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

        testCharacterId2 = result.current.createCharacter({
          name: 'Test Character 2', 
          description: 'Test description 2',
          worldId: 'world-1',
          level: 2,
          attributes: [],
          skills: [],
          background: {
            history: 'Test history 2',
            personality: 'Test personality 2',
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

        // Initialize mock journal entries with actual character IDs
        initializeMockEntries();
      });

      // Verify characters exist
      expect(result.current.characters[testCharacterId1]).toBeDefined();
      expect(result.current.characters[testCharacterId2]).toBeDefined();

      // Delete first character
      act(() => {
        result.current.deleteCharacter(testCharacterId1);
      });

      // Verify character is deleted
      expect(result.current.characters[testCharacterId1]).toBeUndefined();
      expect(result.current.characters[testCharacterId2]).toBeDefined();

      // Verify journal cleanup was called for character's sessions
      expect(mockJournalStore.deleteSessionEntries).toHaveBeenCalledWith('session-1');
      expect(mockJournalStore.deleteSessionEntries).toHaveBeenCalledWith('session-2');
      expect(mockJournalStore.deleteSessionEntries).not.toHaveBeenCalledWith('session-3');
    });

    test('clears currentCharacterId when active character is deleted', () => {
      const { result } = renderHook(() => useCharacterStore());

      let characterId: string;

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

        // Set as current character
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

    test('preserves currentCharacterId when non-active character is deleted', () => {
      const { result } = renderHook(() => useCharacterStore());

      let activeCharacterId: string;
      let otherCharacterId: string;

      act(() => {
        activeCharacterId = result.current.createCharacter({
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

        otherCharacterId = result.current.createCharacter({
          name: 'Other Character',
          description: 'Other description', 
          worldId: 'world-1',
          level: 2,
          attributes: [],
          skills: [],
          background: {
            history: 'Other history',
            personality: 'Other personality',
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

        // Set first character as active
        result.current.setCurrentCharacter(activeCharacterId);
      });

      expect(result.current.currentCharacterId).toBe(activeCharacterId);

      // Delete the non-active character
      act(() => {
        result.current.deleteCharacter(otherCharacterId);
      });

      // Current character should remain unchanged
      expect(result.current.currentCharacterId).toBe(activeCharacterId);
    });

    test('handles deletion gracefully when character does not exist', () => {
      const { result } = renderHook(() => useCharacterStore());

      // Try to delete non-existent character
      act(() => {
        result.current.deleteCharacter('non-existent-id');
      });

      // Should not throw error or call journal cleanup
      expect(mockJournalStore.deleteSessionEntries).not.toHaveBeenCalled();
    });

    test('continues deletion even if journal cleanup fails', () => {
      const { result } = renderHook(() => useCharacterStore());

      // Mock journal cleanup to fail
      mockJournalStore.deleteSessionEntries.mockImplementation(() => {
        throw new Error('Journal cleanup failed');
      });

      let characterId: string;

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

      // Delete should still work even if cleanup fails
      act(() => {
        result.current.deleteCharacter(characterId);
      });

      // Character should still be deleted despite journal cleanup failure
      expect(result.current.characters[characterId]).toBeUndefined();
    });
  });
});