import { deleteCharacterWithCleanup } from '../characterDeletionService';
import { useJournalStore } from '@/state/journalStore';
import { useCharacterStore } from '@/state/characterStore';
import { JournalEntryType } from '@/types/journal.types';

// Mock the stores
jest.mock('@/state/journalStore');
jest.mock('@/state/characterStore');

describe('CharacterDeletionService', () => {
  const mockJournalStore = {
    entries: {
      'entry-1': {
        id: 'entry-1',
        sessionId: 'session-1',
        worldId: 'world-1',
        characterId: 'char-1',
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
        id: 'entry-2',
        sessionId: 'session-2',
        worldId: 'world-1',
        characterId: 'char-1',
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
        id: 'entry-3',
        sessionId: 'session-3',
        worldId: 'world-1',
        characterId: 'char-2',
        type: 'character_event' as JournalEntryType,
        title: 'Test Entry 3',
        content: 'Different character entry',
        significance: 'minor' as const,
        isRead: false,
        relatedEntities: [],
        metadata: { tags: [], automaticEntry: true },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
    sessionEntries: {},
    error: null,
    loading: false,
    addEntry: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
    deleteSessionEntries: jest.fn(),
    getSessionEntries: jest.fn(),
    clearAllEntries: jest.fn(),
    reset: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    setLoading: jest.fn(),
    markAsRead: jest.fn(),
    getSessionEntriesWithCharacter: jest.fn(),
    getEntriesByType: jest.fn(),
  };

  const mockCharacterStore = {
    characters: {},
    entities: {},
    worldCharacterIds: {},
    currentCharacterId: null,
    currentEntityId: null,
    error: null,
    loading: false,
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    setCurrent: jest.fn(),
    getById: jest.fn(),
    getAll: jest.fn(),
    createCharacter: jest.fn(),
    updateCharacter: jest.fn(),
    applyAlignmentShift: jest.fn(),
    addCondition: jest.fn(),
    removeCondition: jest.fn(),
    deleteCharacter: jest.fn(),
    setCurrentCharacter: jest.fn(),
    addAttribute: jest.fn(),
    updateAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    addSkill: jest.fn(),
    cleanupCharacterHistory: jest.fn(),
    compactCharacterData: jest.fn(),
    getCharactersCount: jest.fn(),
    getCharactersByWorld: jest.fn(),
    getWorldRoster: jest.fn(),
    deleteCharactersInWorld: jest.fn(),
    reset: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    setLoading: jest.fn(),
    syncDerivedState: jest.fn(),
    recalculateDerivedStats: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getState methods
    (useJournalStore as jest.MockedFunction<typeof useJournalStore>).getState =
      jest.fn(() => mockJournalStore);
    (
      useCharacterStore as jest.MockedFunction<typeof useCharacterStore>
    ).getState = jest.fn(() => mockCharacterStore);
  });

  describe('deleteCharacterWithCleanup', () => {
    test('deletes character and cleans up related journal sessions', async () => {
      await deleteCharacterWithCleanup('char-1');

      // Should clean up journal sessions for this character
      expect(mockJournalStore.deleteSessionEntries).toHaveBeenCalledWith(
        'session-1'
      );
      expect(mockJournalStore.deleteSessionEntries).toHaveBeenCalledWith(
        'session-2'
      );
      expect(mockJournalStore.deleteSessionEntries).not.toHaveBeenCalledWith(
        'session-3'
      );

      // Should delete the character from the store
      expect(mockCharacterStore.deleteCharacter).toHaveBeenCalledWith('char-1');
    });

    test('continues deletion even if journal cleanup fails', async () => {
      mockJournalStore.deleteSessionEntries.mockImplementation(() => {
        throw new Error('Journal cleanup failed');
      });

      // Should not throw an error
      await expect(
        deleteCharacterWithCleanup('char-1')
      ).resolves.toBeUndefined();

      // Character deletion should still proceed
      expect(mockCharacterStore.deleteCharacter).toHaveBeenCalledWith('char-1');
    });

    test('handles character with no journal entries', async () => {
      // Character with no journal entries
      await deleteCharacterWithCleanup('char-3');

      // Should not call any journal cleanup
      expect(mockJournalStore.deleteSessionEntries).not.toHaveBeenCalled();

      // Should still delete the character
      expect(mockCharacterStore.deleteCharacter).toHaveBeenCalledWith('char-3');
    });

    test('handles errors during journal store access', async () => {
      (
        useJournalStore as jest.MockedFunction<typeof useJournalStore>
      ).getState = jest.fn(() => {
        throw new Error('Store access failed');
      });

      // Should not throw an error
      await expect(
        deleteCharacterWithCleanup('char-1')
      ).resolves.toBeUndefined();

      // Character deletion should still proceed
      expect(mockCharacterStore.deleteCharacter).toHaveBeenCalledWith('char-1');
    });
  });
});
