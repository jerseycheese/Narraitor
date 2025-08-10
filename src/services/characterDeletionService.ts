import { useJournalStore } from '@/state/journalStore';
import { useCharacterStore } from '@/state/characterStore';

/**
 * Service layer for character deletion that handles related data cleanup
 * This decouples the character store from the journal store
 */
export class CharacterDeletionService {
  /**
   * Deletes a character and all related journal entries
   * @param characterId - The ID of the character to delete
   * @returns Promise<void>
   */
  static async deleteCharacterWithCleanup(characterId: string): Promise<void> {
    try {
      // Clean up related journal entries
      const journalStore = useJournalStore.getState();
      
      // Find all journal entries for this character using the characterId field
      const allEntries = Object.values(journalStore.entries);
      const characterSessions = new Set<string>();
      
      // Find sessions that have entries for this character
      allEntries.forEach((entry) => {
        if (entry.characterId === characterId) {
          characterSessions.add(entry.sessionId);
        }
      });
      
      // Delete all sessions for this character
      characterSessions.forEach(sessionId => {
        try {
          journalStore.deleteSessionEntries(sessionId);
        } catch (error) {
          console.warn('Failed to clean up journal session:', sessionId, error);
        }
      });
    } catch (error) {
      console.warn('Failed to clean up journal entries for character:', characterId, error);
      // Continue with deletion even if journal cleanup fails
    }

    // Delete character from character store
    const characterStore = useCharacterStore.getState();
    characterStore.deleteCharacter(characterId);
  }
}