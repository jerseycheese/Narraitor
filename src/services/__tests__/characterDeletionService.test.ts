import { CharacterDeletionService } from '../characterDeletionService';
import { useJournalStore } from '@/state/journalStore';
import { useCharacterStore } from '@/state/characterStore';

// Mock the stores
jest.mock('@/state/journalStore');
jest.mock('@/state/characterStore');

describe('CharacterDeletionService', () => {
  const mockJournalStore = {
    entries: {
      'entry-1': {
        id: 'entry-1',
        sessionId: 'session-1',
        characterId: 'char-1',
        content: 'Test entry'
      },
      'entry-2': {
        id: 'entry-2',
        sessionId: 'session-2', 
        characterId: 'char-1',
        content: 'Another entry'
      },
      'entry-3': {
        id: 'entry-3',
        sessionId: 'session-3',
        characterId: 'char-2',
        content: 'Different character entry'
      }
    },
    deleteSessionEntries: jest.fn()
  };

  const mockCharacterStore = {
    deleteCharacter: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock getState methods
    (useJournalStore as unknown as jest.Mock).getState = jest.fn(() => mockJournalStore);
    (useCharacterStore as unknown as jest.Mock).getState = jest.fn(() => mockCharacterStore);
  });

  describe('deleteCharacterWithCleanup', () => {
    test('deletes character and cleans up related journal sessions', async () => {
      await CharacterDeletionService.deleteCharacterWithCleanup('char-1');

      // Should clean up journal sessions for this character
      expect(mockJournalStore.deleteSessionEntries).toHaveBeenCalledWith('session-1');
      expect(mockJournalStore.deleteSessionEntries).toHaveBeenCalledWith('session-2');
      expect(mockJournalStore.deleteSessionEntries).not.toHaveBeenCalledWith('session-3');

      // Should delete the character from the store
      expect(mockCharacterStore.deleteCharacter).toHaveBeenCalledWith('char-1');
    });

    test('continues deletion even if journal cleanup fails', async () => {
      mockJournalStore.deleteSessionEntries.mockImplementation(() => {
        throw new Error('Journal cleanup failed');
      });

      // Should not throw an error
      await expect(CharacterDeletionService.deleteCharacterWithCleanup('char-1')).resolves.toBeUndefined();

      // Character deletion should still proceed
      expect(mockCharacterStore.deleteCharacter).toHaveBeenCalledWith('char-1');
    });

    test('handles character with no journal entries', async () => {
      // Character with no journal entries
      await CharacterDeletionService.deleteCharacterWithCleanup('char-3');

      // Should not call any journal cleanup
      expect(mockJournalStore.deleteSessionEntries).not.toHaveBeenCalled();

      // Should still delete the character
      expect(mockCharacterStore.deleteCharacter).toHaveBeenCalledWith('char-3');
    });

    test('handles errors during journal store access', async () => {
      (useJournalStore as unknown as jest.Mock).getState = jest.fn(() => {
        throw new Error('Store access failed');
      });

      // Should not throw an error
      await expect(CharacterDeletionService.deleteCharacterWithCleanup('char-1')).resolves.toBeUndefined();

      // Character deletion should still proceed
      expect(mockCharacterStore.deleteCharacter).toHaveBeenCalledWith('char-1');
    });
  });
});