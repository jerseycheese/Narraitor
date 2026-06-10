import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { logger } from '@/lib/utils/logger';

/**
 * Recalculate saved sessions' narrativeCount values from narrativeStore.
 *
 * Lived on sessionStore before (as fixExistingSessionNarrativeCounts), where
 * it needed a dynamic import of narrativeStore — part of the store import
 * cycles. As a lib helper, the reads are one-way: lib -> stores.
 */
export const fixExistingSessionNarrativeCounts = (): void => {
  try {
    const { sessionSegments } = useNarrativeStore.getState();
    const sessionStore = useSessionStore.getState();

    const counts: Record<string, number> = {};
    for (const sessionId of Object.keys(sessionStore.savedSessions)) {
      counts[sessionId] = (sessionSegments[sessionId] || []).length;
    }

    sessionStore.repairSavedSessionNarrativeCounts(counts);
  } catch (error) {
    logger.error('Failed to fix existing session narrative counts:', error);
  }
};
