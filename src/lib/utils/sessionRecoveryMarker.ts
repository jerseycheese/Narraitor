/**
 * Session recovery marker — a synchronous localStorage "dirty bit" used to tell
 * an abnormal session end (browser crash, tab killed, power loss) apart from a
 * clean exit.
 *
 * While a session is live we write the marker on activation and on each
 * save/heartbeat. A clean exit (endSession, or a deliberate refresh/close that
 * fires pagehide) removes it. If the marker is still here on the next app load,
 * the previous run never shut down cleanly — that's the crash signal that routes
 * the player into recovery.
 *
 * localStorage is deliberate over the app's IndexedDB persistence: its
 * reads/writes are synchronous, so the "clean exit" removal actually completes
 * inside a pagehide handler, where an async IndexedDB write can't be awaited.
 */

const MARKER_KEY = 'narraitor-session-recovery';

export interface SessionRecoveryMarker {
  sessionId: string;
  worldId: string;
  characterId: string;
  /** ISO timestamp of the last recorded activity in the session. */
  lastActivity: string;
}

function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const testKey = '__narraitor_recovery_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Record that a session is live (or refresh its last-activity timestamp).
 */
export function writeRecoveryMarker(marker: SessionRecoveryMarker): void {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.setItem(MARKER_KEY, JSON.stringify(marker));
  } catch {
    // Best-effort: quota/serialization failures shouldn't break gameplay.
  }
}

/**
 * Read the marker left by the previous run, if any. A non-null result means the
 * last session was never cleanly closed.
 */
export function readRecoveryMarker(): SessionRecoveryMarker | null {
  if (!isStorageAvailable()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(MARKER_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<SessionRecoveryMarker>;
    if (
      parsed &&
      typeof parsed.sessionId === 'string' &&
      typeof parsed.worldId === 'string' &&
      typeof parsed.characterId === 'string' &&
      typeof parsed.lastActivity === 'string'
    ) {
      return parsed as SessionRecoveryMarker;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Clear the marker. Called on a clean exit so the next load doesn't mistake a
 * deliberate close for a crash.
 */
export function clearRecoveryMarker(): void {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.removeItem(MARKER_KEY);
  } catch {
    // Best-effort.
  }
}
