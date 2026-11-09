/**
 * Deleting a character removes its story, journal, goals, world threads and
 * saved sessions, so a later export carries no trace of them.
 */
import '@/state/storeEventWiring';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { useJournalStore } from '@/state/journalStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useGoalStore } from '@/state/goalStore';
import { useWorldThreadStore } from '@/state/worldThreadStore';
import { exportGameState } from '@/lib/storage/exportService';
import { createTestCharacterData } from '@/state/__tests__/characterStore.testHelpers';

const saveSession = (sessionId: string, worldId: string, characterId: string) => {
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
};

const seedStory = (sessionId: string, worldId: string, characterId: string, text: string) => {
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
  const goal = { id: `goal-${sessionId}`, sessionId, worldId, title: `${text} goal` };
  useGoalStore.setState((state) => ({
    goals: { ...state.goals, [goal.id]: goal },
    entities: { ...state.entities, [goal.id]: goal },
    sessionGoals: { ...state.sessionGoals, [sessionId]: [goal.id] },
  }) as never);
  const thread = { id: `thread-${sessionId}`, sessionId, worldId, summary: `${text} thread` };
  useWorldThreadStore.setState((state) => ({
    threads: { ...state.threads, [thread.id]: thread },
    entities: { ...state.entities, [thread.id]: thread },
    sessionThreads: { ...state.sessionThreads, [sessionId]: [thread.id] },
  }) as never);
};

describe('character deletion cleanup', () => {
  beforeEach(() => {
    useCharacterStore.getState().reset();
    useJournalStore.setState({ entries: {}, sessionEntries: {} });
    useNarrativeStore.setState({ segments: {}, sessionSegments: {}, decisions: {}, sessionDecisions: {} });
    useGoalStore.setState({ goals: {}, entities: {}, sessionGoals: {}, activeGoalIds: [] });
    useWorldThreadStore.setState({ threads: {}, entities: {}, sessionThreads: {}, seedAttempts: {} });
    useSessionStore.setState({ id: null, characterId: null, worldId: null, savedSessions: {}, sessionLifecycle: {} });
  });

  it("leaves no trace of a deleted character's story in the export", async () => {
    const store = useCharacterStore.getState();
    const goneId = store.createCharacter(createTestCharacterData({ name: 'Gone', worldId: 'world-1' }));
    const keptId = store.createCharacter(createTestCharacterData({ name: 'Kept', worldId: 'world-1' }));
    saveSession('session-gone', 'world-1', goneId);
    seedStory('session-gone', 'world-1', goneId, 'Zanzibar');
    // A session known only as the active one, not saved yet
    useSessionStore.setState({ id: 'session-active', worldId: 'world-1', characterId: goneId });
    seedStory('session-active', 'world-1', goneId, 'Ouagadougou');
    saveSession('session-kept', 'world-1', keptId);
    seedStory('session-kept', 'world-1', keptId, 'Quixote');

    await useCharacterStore.getState().deleteCharacter(goneId);

    const exported = JSON.stringify((await exportGameState()).data);
    expect(exported).not.toContain('Zanzibar');
    expect(exported).not.toContain('Ouagadougou');
    expect(useSessionStore.getState().savedSessions['session-gone']).toBeUndefined();
    ['story', 'journal', 'goal', 'thread'].forEach((kind) => {
      expect(exported).toContain(`Quixote ${kind}`);
    });
  });
});
