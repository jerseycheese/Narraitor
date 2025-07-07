/**
 * Session Cleanup Utility
 * 
 * Handles coordinated cleanup of all data associated with a session when it's deleted.
 * This ensures referential integrity and prevents orphaned data.
 */

import { useNarrativeStore } from '@/state/narrativeStore';
import { useJournalStore } from '@/state/journalStore';
import { useSessionStore } from '@/state/sessionStore';

/**
 * Clean up all data associated with a session
 * @param sessionId - The ID of the session to clean up
 */
export async function cleanupSessionData(sessionId: string): Promise<void> {
  try {
    // Clean up narrative data
    const narrativeStore = useNarrativeStore.getState();
    narrativeStore.clearSessionSegments(sessionId);
    narrativeStore.clearSessionDecisions(sessionId);

    // Clean up journal entries
    const journalStore = useJournalStore.getState();
    journalStore.deleteSessionEntries(sessionId);

    // Remove session record last to maintain referential integrity
    const sessionStore = useSessionStore.getState();
    sessionStore.deleteSavedSession(sessionId);

  } catch (error) {
    // Log error but don't throw - we want to attempt all cleanup operations
    console.error('Error during session cleanup:', error);
  }
}