import { act, renderHook } from '@testing-library/react';
import { useCharacterStore } from '../characterStore';
import { useJournalStore } from '../journalStore';
import { JournalEntry, JournalEntryType } from '@/types/journal.types';
import { EntityID } from '@/types/common.types';

// Mock journal store
jest.mock('../journalStore');

describe('CharacterStore - Related Data Cleanup', () => {
  let testCharacterId1: EntityID;
  let testCharacterId2: EntityID;

  const mockJournalStore = {
    entries: {} as Record<EntityID, JournalEntry>,
    sessionEntries: {
      'session-1': ['entry-1'],
      'session-2': ['entry-2'],
      'session-3': ['entry-3']
    },
    deleteSessionEntries: jest.fn(),
    getSessionEntries: jest.fn(),
    error: null,
    loading: false,
    addEntry: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
    clearAllEntries: jest.fn(),
    reset: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    setLoading: jest.fn(),
    markAsRead: jest.fn(),
    getSessionEntriesWithCharacter: jest.fn(),
    getEntriesByType: jest.fn(),
  };

  // Initialize entries dynamically based on test character IDs
  const initializeMockEntries = (charId1: EntityID, charId2: EntityID) => {
    mockJournalStore.entries = {
      'entry-1': {
        id: 'entry-1' as EntityID,
        sessionId: 'session-1' as EntityID,
        worldId: 'world-1' as EntityID,
        characterId: charId1,
        type: 'character_event' as JournalEntryType,
        title: 'Test Entry 1',
        content: 'Test entry',
        significance: 'minor' as const,
        isRead: false,
        relatedEntities: [],
        metadata: { tags: [], automaticEntry: true },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      'entry-2': {
        id: 'entry-2' as EntityID,
        sessionId: 'session-2' as EntityID,
        worldId: 'world-1' as EntityID,
        characterId: charId1,
        type: 'character_event' as JournalEntryType,
        title: 'Test Entry 2',
        content: 'Another entry',
        significance: 'minor' as const,
        isRead: false,
        relatedEntities: [],
        metadata: { tags: [], automaticEntry: true },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      'entry-3': {
        id: 'entry-3' as EntityID,
        sessionId: 'session-3' as EntityID,
        worldId: 'world-1' as EntityID,
        characterId: charId2,
        type: 'character_event' as JournalEntryType,
        title: 'Test Entry 3',
        content: 'Different character entry',
        significance: 'minor' as const,
        isRead: false,
        relatedEntities: [],
        metadata: { tags: [], automaticEntry: true },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize test character IDs
    testCharacterId1 = 'char-1' as EntityID;
    testCharacterId2 = 'char-2' as EntityID;
    initializeMockEntries(testCharacterId1, testCharacterId2);

    (useJournalStore as unknown as jest.Mock).mockImplementation((selector?: (state: typeof mockJournalStore) => unknown) => {
      if (selector) {
        return selector(mockJournalStore);
      }
      return mockJournalStore;
    });

    // Mock getState for store access
    (useJournalStore as jest.MockedFunction<typeof useJournalStore>).getState = jest.fn(() => mockJournalStore);

    // Clear character store before each test
    const { result } = renderHook(() => useCharacterStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Character Deletion', () => {
    test('deletes character from store', () => {
      const { result } = renderHook(() => useCharacterStore());

      // Create test characters
      act(() => {
        testCharacterId1 = result.current.createCharacter({
          name: 'Test Character 1',
          description: 'Test description 1',
          worldId: 'world-1',
          level: 1,
          attributes: [],
          skills: [],
          background: {
            history: 'Test history 1',
            personality: 'Test personality 1',
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
            categories: [],
            itemOrder: [],
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
            categories: [],
            itemOrder: [],
          }
        });

        // Initialize mock journal entries with actual character IDs
        initializeMockEntries(testCharacterId1, testCharacterId2);
      });

      // Verify characters exist
      expect(result.current.characters[testCharacterId1]).toBeDefined();
      expect(result.current.characters[testCharacterId2]).toBeDefined();

      // Delete first character
      act(() => {
        result.current.deleteCharacter(testCharacterId1);
      });

      // Verify character is deleted from the store
      expect(result.current.characters[testCharacterId1]).toBeUndefined();
      expect(result.current.characters[testCharacterId2]).toBeDefined();

      // Note: Journal cleanup is now handled by CharacterDeletionService
      // and should be tested separately
    });

    test('clears currentCharacterId when active character is deleted', () => {
      const { result } = renderHook(() => useCharacterStore());

      let characterId: string = '';

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
            categories: [],
            itemOrder: [],
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

      let activeCharacterId: string = '';
      let otherCharacterId: string;

      act(() => {
        activeCharacterId = result.current.createCharacter({
          name: 'Active Character',
          description: 'Active character description',
          worldId: 'world-1',
          level: 1,
          attributes: [],
          skills: [],
          background: {
            history: 'Active character history',
            personality: 'Active character personality',
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
            categories: [],
            itemOrder: [],
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
            categories: [],
            itemOrder: []
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

      const initialCharacterCount = Object.keys(result.current.characters).length;

      // Try to delete non-existent character
      act(() => {
        result.current.deleteCharacter('non-existent-id');
      });

      // Should not throw error and characters should remain unchanged
      expect(Object.keys(result.current.characters)).toHaveLength(initialCharacterCount);
      
      // Note: Journal cleanup is now handled by CharacterDeletionService
      // and tested separately
    });

    test('handles deletion gracefully and reliably', () => {
      const { result } = renderHook(() => useCharacterStore());

      let characterId: string = '';

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
            categories: [],
            itemOrder: [],
          }
        });
      });

      // Delete character - this should always work at the store level
      act(() => {
        result.current.deleteCharacter(characterId);
      });

      // Character should be deleted from the store
      expect(result.current.characters[characterId]).toBeUndefined();
      
      // Note: Journal cleanup failures are now handled by CharacterDeletionService
      // and should be tested at the service layer, not the store layer
    });
  });
});