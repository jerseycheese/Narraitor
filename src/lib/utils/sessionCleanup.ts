/**
 * Session Cleanup Utility
 * 
 * Handles coordinated cleanup of all data associated with a session when it's deleted.
 * This ensures referential integrity and prevents orphaned data.
 */

import { useNarrativeStore } from '@/state/narrativeStore';
import { useJournalStore } from '@/state/journalStore';
import { useSessionStore } from '@/state/sessionStore';
import { useSceneStore } from '@/state/sceneStore';
import { useGoalStore } from '@/state/goalStore';
import { useWorldThreadStore } from '@/state/worldThreadStore';
import { useLoreStore } from '@/state/loreStore';
import { useWorldStore } from '@/state/worldStore';

import Logger from '@/lib/utils/logger';
const logger = new Logger('SessionCleanup');

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
 * @note Individual cleanup operations may fail, but the function continues to 
 * attempt all cleanup operations. Errors are collected and logged but not thrown 
 * to ensure all cleanup operations are attempted and prevent partial cleanup states.
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
  // 2. Journal entries, goals and world threads
  // 3. Scene state
  // 4. Session record (last to maintain referential integrity)

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

  // The persisted ending holds the session's epilogue text
  try {
    const narrativeStore = useNarrativeStore.getState();
    if (narrativeStore.currentEnding?.sessionId === sessionId) narrativeStore.clearEnding();
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

  // Goals and world threads quote the story, so they go with it
  try {
    useGoalStore.getState().clearSessionGoals(sessionId);
  } catch (error) {
    errors.push(error instanceof Error ? error : new Error(String(error)));
  }

  try {
    useWorldThreadStore.getState().clearSessionThreads(sessionId);
  } catch (error) {
    errors.push(error instanceof Error ? error : new Error(String(error)));
  }

  try {
    useLoreStore.getState().clearSessionLore(sessionId);
  } catch (error) {
    errors.push(error instanceof Error ? error : new Error(String(error)));
  }

  try {
    useWorldStore.getState().clearSessionHistory(sessionId);
  } catch (error) {
    errors.push(error instanceof Error ? error : new Error(String(error)));
  }

  // Remove session record last to maintain referential integrity
  try {
    useSceneStore.getState().clearScene(sessionId);
  } catch (error) {
    errors.push(error instanceof Error ? error : new Error(String(error)));
  }

  try {
    const sessionStore = useSessionStore.getState();
    sessionStore.deleteSavedSession(sessionId);
  } catch (error) {
    errors.push(error instanceof Error ? error : new Error(String(error)));
  }

  // Log any errors that occurred
  if (errors.length > 0) {
    logger.error('Error during session cleanup:', errors);
  }
}

/**
 * Clean up every session that belongs to a deleted character: its story
 * segments, decisions, journal entries, goals, world threads, lore, story
 * checkpoints and saved-session record.
 *
 * Subscribed to CHARACTER_DELETED in src/state/storeEventWiring.ts. Without it
 * the character's story stays in IndexedDB and ships in every export.
 *
 * @param characterId - The ID of the deleted character
 */
export async function cleanupCharacterSessions(characterId: string): Promise<void> {
  const { id: activeSessionId, characterId: activeCharacterId, savedSessions, sessionLifecycle } =
    useSessionStore.getState();

  const sessionIds = new Set<string>();
  Object.values(savedSessions).forEach((session) => {
    if (session.characterId === characterId) sessionIds.add(session.id);
  });
  Object.values(sessionLifecycle).forEach((session) => {
    if (session.characterId === characterId) sessionIds.add(session.id);
  });
  // sessionLifecycle isn't persisted and a fresh start drops the old saved
  // session, so a reloaded character's earlier stories are only reachable
  // through the records that carry its characterId.
  Object.values(useJournalStore.getState().entries).forEach((entry) => {
    if (entry.characterId === characterId && entry.sessionId) sessionIds.add(entry.sessionId);
  });
  Object.values(useGoalStore.getState().goals).forEach((goal) => {
    if (goal.characterId === characterId && goal.sessionId) sessionIds.add(goal.sessionId);
  });
  if (activeSessionId && activeCharacterId === characterId) {
    sessionIds.add(activeSessionId);
    // End it first so the live fields (and their persisted choice text) reset
    // and the crash-recovery marker goes; the cleanup below then removes what
    // ending it saved.
    await useSessionStore.getState().endSession();
  }

  await Promise.all(Array.from(sessionIds, (sessionId) => cleanupSessionData(sessionId)));
}
