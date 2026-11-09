/**
 * Deleting a character removes its story, journal and saved sessions, so a
 * later export carries no trace of them (Issue #2328).
 */
import '@/state/storeEventWiring';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { useJournalStore } from '@/state/journalStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { exportGameState } from '@/lib/storage/exportService';
import { createTestCharacterData } from '@/state/__tests__/characterStore.testHelpers';

const seedSession = (sessionId: string, worldId: string, characterId: string, text: string) => {
  useSessionStore.setState((state) => ({
    savedSessions: {
      ...state.savedSessions,
      [sessionId]: { id: sessionId, worldId, characterId, lastPlayed: '2026-01-01', narrativeCount: 1 },
    },
    sessionLifecycle: {
      ...state.sessionLifecycle,
      [sessionId]: { id: sessionId, worldId, characterId, status: 'ended', lastActivity: '2026-01-01' },
    },
  }));
  useNarrativeStore.setState((state) => ({
    segments: { ...state.segments, [`seg-${sessionId}`]: { id: `seg-${sessionId}`, sessionId, content: `${text} story` } },
    sessionSegments: { ...state.sessionSegments, [sessionId]: [`seg-${sessionId}`] },
  }) as never);
  useJournalStore.getState().addEntry(sessionId, {
    type: 'discovery',
    worldId,
    characterId,
    title: `${text} entry`,
    content: `${text} journal`,
    significance: 'minor',
    isRead: false,
    relatedEntities: [],
    metadata: { tags: [], automaticEntry: true },
    updatedAt: '2026-01-01',
  });
};

describe('character deletion cleanup', () => {
  beforeEach(() => {
    useCharacterStore.getState().reset();
    useJournalStore.setState({ entries: {}, sessionEntries: {} });
    useNarrativeStore.setState({ segments: {}, sessionSegments: {}, decisions: {}, sessionDecisions: {} });
    useSessionStore.setState({ id: null, characterId: null, worldId: null, savedSessions: {}, sessionLifecycle: {} });
  });

  it("leaves no trace of a deleted character's story in the export", async () => {
    const store = useCharacterStore.getState();
    const goneId = store.createCharacter(createTestCharacterData({ name: 'Gone', worldId: 'world-1' }));
    const keptId = store.createCharacter(createTestCharacterData({ name: 'Kept', worldId: 'world-1' }));
    seedSession('session-gone', 'world-1', goneId, 'Zanzibar');
    seedSession('session-kept', 'world-1', keptId, 'Quixote');

    await useCharacterStore.getState().deleteCharacter(goneId);

    const exported = JSON.stringify((await exportGameState()).data);
    expect(exported).not.toContain('Zanzibar');
    expect(useSessionStore.getState().savedSessions['session-gone']).toBeUndefined();
    expect(exported).toContain('Quixote journal');
    expect(exported).toContain('Quixote story');
  });
});
