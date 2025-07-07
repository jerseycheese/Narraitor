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
 * 
 * Performs coordinated cleanup of all data related to a session to maintain
 * referential integrity and prevent orphaned data. The cleanup follows a specific
 * order: narrative data first, then journal entries, and finally the session record.
 * 
 * @param sessionId - The ID of the session to clean up
 * @returns Promise that resolves when cleanup is complete
 * 
 * @throws {Error} Individual cleanup operations may fail, but the function continues
 * to attempt all cleanup operations. Errors are logged but not thrown to prevent
 * partial cleanup states.
 * 
 * @example
 * ```typescript
 * // Clean up all data for a specific session
 * await cleanupSessionData('session-123');
 * 
 * // Handle cleanup with error checking
 * try {
 *   await cleanupSessionData(sessionId);
 *   console.log('Session cleaned up successfully');
 * } catch (error) {
 *   // Note: Function doesn't throw, but individual operations might fail
 *   console.error('Some cleanup operations failed:', error);
 * }
 * ```
 */
export async function cleanupSessionData(sessionId: string): Promise<void> {
  const errors: Error[] = [];

  // Cleanup order is important for data integrity:
  // 1. Narrative data (segments and decisions)
  // 2. Journal entries
  // 3. Session record (last to maintain referential integrity)

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