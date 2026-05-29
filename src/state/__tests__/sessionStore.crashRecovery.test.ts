import { useSessionStore } from '../sessionStore';
import { readRecoveryMarker } from '@/lib/utils/sessionRecoveryMarker';

jest.mock('@/lib/utils/logger', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock('../persistence', () => ({
  createIndexedDBStorage: () => ({
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  }),
}));

const resetSessionStore = () => {
  useSessionStore.setState({
    id: null,
    status: 'initializing',
    currentSceneId: null,
    playerChoices: [],
    error: null,
    worldId: null,
    characterId: null,
    savedSessions: {},
    sessionLifecycle: {},
    templateHistory: [],
    autoSave: {
      enabled: true,
      lastSaveTime: null,
      status: 'idle',
      errorMessage: null,
      totalSaves: 0,
    },
    narrativeHeight: 600,
  });
};

const activateSession = (sessionId: string, worldId: string, characterId: string) => {
  useSessionStore.setState({
    id: sessionId,
    worldId,
    characterId,
    status: 'active',
  });
};

describe('sessionStore crash-recovery marker (issue #221)', () => {
  beforeEach(() => {
    jest.useRealTimers();
    window.localStorage.clear();
    resetSessionStore();
  });

  it('writes a recovery marker while a session is live (heartbeat)', () => {
    // Simulate an active session, as if mid-play.
    activateSession('session-live', 'world-1', 'character-1');

    // A save/heartbeat fires as the story progresses.
    useSessionStore.getState().updateSavedSessionNarrativeCount('session-live', 1);

    const marker = readRecoveryMarker();
    expect(marker).not.toBeNull();
    expect(marker?.sessionId).toBe('session-live');
    expect(marker?.worldId).toBe('world-1');
    expect(marker?.characterId).toBe('character-1');
    expect(marker?.lastActivity).toBeDefined();
  });

  it('clears the marker on a clean endSession so the next load does NOT trigger recovery', async () => {
    activateSession('session-clean', 'world-1', 'character-1');
    useSessionStore.getState().updateSavedSessionNarrativeCount('session-clean', 1);
    expect(readRecoveryMarker()).not.toBeNull();

    await useSessionStore.getState().endSession();

    expect(readRecoveryMarker()).toBeNull();
  });

  it('does not write a marker for an inactive session', () => {
    // No active session set: a stray count update must not arm recovery.
    useSessionStore.getState().updateSavedSessionNarrativeCount('orphan-session', 1);
    expect(readRecoveryMarker()).toBeNull();
  });

  it('re-arms the marker for an active session after a clean refresh cleared it', () => {
    // A clean refresh fires pagehide and clears the marker, but the session is
    // still live in the persisted store. Remounting the play surface skips
    // activation, so refreshRecoveryMarker must re-arm it (issue #221).
    activateSession('session-refreshed', 'world-1', 'character-1');
    expect(readRecoveryMarker()).toBeNull(); // cleared by the refresh

    useSessionStore.getState().refreshRecoveryMarker();

    const marker = readRecoveryMarker();
    expect(marker?.sessionId).toBe('session-refreshed');
    expect(marker?.worldId).toBe('world-1');
    expect(marker?.characterId).toBe('character-1');
  });

  it('refreshRecoveryMarker does not arm when no session is active', () => {
    useSessionStore.getState().refreshRecoveryMarker();
    expect(readRecoveryMarker()).toBeNull();
  });
});
