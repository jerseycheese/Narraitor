'use client';

/**
 * useSessionRecovery — detects a session that ended abnormally and offers to
 * restore it (issue #221).
 *
 * A surviving recovery marker (see sessionRecoveryMarker) means the previous run
 * never shut down cleanly. The persisted session + narrative state is already
 * intact in IndexedDB, so "restore" just routes the player back into the live
 * session; "dismiss" clears the marker and leaves the auto-saved progress untouched
 * for the normal resume flow.
 *
 * The hook also clears the marker on a graceful unload, so a deliberate refresh
 * or close isn't mistaken for a crash on the next load.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNarrativeStore } from '@/state/narrativeStore';
import {
  clearRecoveryMarker,
  readRecoveryMarker,
} from '@/lib/utils/sessionRecoveryMarker';

interface SessionRecoveryDetails {
  sessionId: string;
  worldId: string;
  characterId: string;
  /** ISO timestamp of the last recorded activity before the crash. */
  lastActivity: string;
  /** Number of narrative segments recovered for this session. */
  narrativeCount: number;
}

export interface UseSessionRecoveryResult {
  recovery: SessionRecoveryDetails | null;
  restore: () => void;
  dismiss: () => void;
}

const countSessionSegments = (sessionId: string): number => {
  try {
    return useNarrativeStore.getState().getSessionSegments(sessionId).length;
  } catch {
    return 0;
  }
};

type NarrativePersistApi = {
  hasHydrated?: () => boolean;
  onFinishHydration?: (callback: () => void) => () => void;
};

const getNarrativePersistApi = (): NarrativePersistApi | undefined =>
  (useNarrativeStore as unknown as { persist?: NarrativePersistApi }).persist;

export function useSessionRecovery(): UseSessionRecoveryResult {
  const router = useRouter();
  const [recovery, setRecovery] = useState<SessionRecoveryDetails | null>(null);

  useEffect(() => {
    const marker = readRecoveryMarker();

    let unsubscribeHydration: (() => void) | undefined;

    if (marker) {
      setRecovery({
        sessionId: marker.sessionId,
        worldId: marker.worldId,
        characterId: marker.characterId,
        lastActivity: marker.lastActivity,
        narrativeCount: countSessionSegments(marker.sessionId),
      });

      // Narrative segments may still be rehydrating from IndexedDB; refresh the
      // displayed count once hydration finishes.
      const persistApi = getNarrativePersistApi();
      if (persistApi?.onFinishHydration && !persistApi.hasHydrated?.()) {
        unsubscribeHydration = persistApi.onFinishHydration(() => {
          setRecovery((prev) =>
            prev
              ? { ...prev, narrativeCount: countSessionSegments(prev.sessionId) }
              : prev
          );
        });
      }
    }

    // A graceful refresh/close fires these; clearing the marker means the next
    // load only sees it after a true crash.
    const handleCleanExit = () => clearRecoveryMarker();
    window.addEventListener('pagehide', handleCleanExit);
    window.addEventListener('beforeunload', handleCleanExit);

    return () => {
      window.removeEventListener('pagehide', handleCleanExit);
      window.removeEventListener('beforeunload', handleCleanExit);
      unsubscribeHydration?.();
    };
  }, []);

  const restore = useCallback(() => {
    const target = recovery;
    setRecovery(null);
    if (target) {
      // The persisted session is still active, so the play page resumes it.
      router?.push(`/worlds/${target.worldId}/play`);
    }
  }, [recovery, router]);

  const dismiss = useCallback(() => {
    // Non-destructive: progress stays auto-saved and reachable via normal resume.
    clearRecoveryMarker();
    setRecovery(null);
  }, []);

  return { recovery, restore, dismiss };
}
