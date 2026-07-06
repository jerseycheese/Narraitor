/**
 * Session-boundary journal entries via the event bus (Issue #176).
 *
 * Drives the REAL sessionStore.initializeSession/endSession and asserts the
 * journal entries land — covering emit + subscription + handler together,
 * the flow that used to live inline in sessionStore.
 */
import '@/state/storeEventWiring';
import { useSessionStore } from '@/state/sessionStore';
import { useJournalStore } from '@/state/journalStore';

describe('session boundary journal entries (event-driven)', () => {
  beforeEach(() => {
    useJournalStore.setState({ entries: {}, sessionEntries: {} });
    useSessionStore.setState({
      id: null,
      status: 'initializing',
      worldId: null,
      characterId: null,
      savedSessions: {},
      sessionLifecycle: {},
      error: null,
    });
  });

  it('creates a session_start entry when a session initializes', async () => {
    await useSessionStore.getState().initializeSession('world-1', 'char-1');

    const sessionId = useSessionStore.getState().id as string;
    expect(sessionId).toBeTruthy();

    const entries = useJournalStore.getState().getSessionEntries(sessionId);
    const startEntry = entries.find((entry) => entry.type === 'session_start');

    expect(startEntry).toBeDefined();
    expect(startEntry?.worldId).toBe('world-1');
    expect(startEntry?.characterId).toBe('char-1');
    expect(startEntry?.metadata.sessionStartTime).toBeTruthy();
    expect(startEntry?.metadata.sessionContext?.sessionNumber).toBe(1);
  });

  it('creates a session_end entry with duration metadata on endSession', async () => {
    await useSessionStore.getState().initializeSession('world-1', 'char-1');
    const sessionId = useSessionStore.getState().id as string;

    await useSessionStore.getState().endSession();

    const entries = useJournalStore.getState().getSessionEntries(sessionId);
    const endEntry = entries.find((entry) => entry.type === 'session_end');

    expect(endEntry).toBeDefined();
    expect(endEntry?.metadata.sessionDuration).toBeGreaterThanOrEqual(0);
    expect(endEntry?.content).toContain('Session completed');
  });
});
