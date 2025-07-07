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
  const errors: Error[] = [];

  // Clean up narrative segments
  try {
    const narrativeStore = useNarrativeStore.getState();
    narrativeStore.clearSessionSegments(sessionId);
  } catch (error) {
    errors.push(error instanceof Error ? error : new Error(String(error)));
  }

  // Clean up narrative decisions
  try {
    const narrativeStore = useNarrativeStore.getState();
    narrativeStore.clearSessionDecisions(sessionId);
  } catch (error) {
    errors.push(error instanceof Error ? error : new Error(String(error)));
  }

  // Clean up journal entries
  try {
    const journalStore = useJournalStore.getState();
    journalStore.deleteSessionEntries(sessionId);
  } catch (error) {
    errors.push(error instanceof Error ? error : new Error(String(error)));
  }

  // Remove session record last to maintain referential integrity
  try {
    const sessionStore = useSessionStore.getState();
    sessionStore.deleteSavedSession(sessionId);
  } catch (error) {
    errors.push(error instanceof Error ? error : new Error(String(error)));
  }

  // Log any errors that occurred
  if (errors.length > 0) {
    console.error('Error during session cleanup:', errors);
  }
}