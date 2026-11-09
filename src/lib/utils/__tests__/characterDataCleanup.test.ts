/**
 * Deleting a character removes its story, journal, goals, world threads and
 * saved sessions, so a later export carries no trace of them.
 */
jest.unmock('@/state/worldStore');

import '@/state/storeEventWiring';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { useJournalStore } from '@/state/journalStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useGoalStore } from '@/state/goalStore';
import { useWorldThreadStore } from '@/state/worldThreadStore';
import { useLoreStore } from '@/state/loreStore';
import { useWorldStore } from '@/state/worldStore';
import { deleteCharacterWithCleanup } from '@/services/characterDeletionService';
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
  const lore = useLoreStore.getState();
  const factId = lore.addFact(`${text.toLowerCase()}_place`, `${text} lore`, 'locations', 'narrative', worldId, sessionId);
  lore.recordLoreMentions({ worldId, sessionId, factIds: [factId], responseText: `You reach ${text} lore.` });
};

describe('character deletion cleanup', () => {
  beforeEach(() => {
    useCharacterStore.getState().reset();
    useJournalStore.setState({ entries: {}, sessionEntries: {} });
    useNarrativeStore.setState({ segments: {}, sessionSegments: {}, decisions: {}, sessionDecisions: {}, currentEnding: null });
    useGoalStore.setState({ goals: {}, entities: {}, sessionGoals: {}, activeGoalIds: [] });
    useWorldThreadStore.setState({ threads: {}, entities: {}, sessionThreads: {}, seedAttempts: {} });
    useLoreStore.getState().reset();
    useSessionStore.setState({ id: null, characterId: null, worldId: null, savedSessions: {}, sessionLifecycle: {} });
  });

  it("leaves no trace of a deleted character's story in the export", async () => {
    const store = useCharacterStore.getState();
    const goneId = store.createCharacter(createTestCharacterData({ name: 'Gone', worldId: 'world-1' }));
    const keptId = store.createCharacter(createTestCharacterData({ name: 'Kept', worldId: 'world-1' }));
    saveSession('session-gone', 'world-1', goneId);
    seedStory('session-gone', 'world-1', goneId, 'Zanzibar');
    // A session known only as the active one, not saved yet
    useSessionStore.setState({
      id: 'session-active',
      worldId: 'world-1',
      characterId: goneId,
      status: 'active',
      playerChoices: [{ id: 'choice-1', text: 'Ouagadougou choice', isSelected: false }],
    } as never);
    useNarrativeStore.setState({
      currentEnding: { sessionId: 'session-active', characterId: goneId, worldId: 'world-1', epilogue: 'Ouagadougou epilogue' },
    } as never);
    seedStory('session-active', 'world-1', goneId, 'Ouagadougou');
    // An older story left with no saved session or lifecycle entry, as after
    // a fresh start and a reload; only its records' characterId points to it
    seedStory('session-orphan', 'world-1', goneId, 'Timbuktu');
    useLoreStore.getState().addFact('shared_place', 'Shared lore', 'locations', 'manual', 'world-1');
    saveSession('session-kept', 'world-1', keptId);
    seedStory('session-kept', 'world-1', keptId, 'Quixote');

    await useCharacterStore.getState().deleteCharacter(goneId);

    const exported = JSON.stringify((await exportGameState()).data);
    expect(exported).not.toContain('Zanzibar');
    expect(exported).not.toContain('Ouagadougou');
    expect(exported).not.toContain('Timbuktu');
    expect(useSessionStore.getState().savedSessions['session-gone']).toBeUndefined();
    expect(useSessionStore.getState().savedSessions['session-active']).toBeUndefined();
    expect(useSessionStore.getState()).toMatchObject({ id: null, characterId: null, playerChoices: [] });
    ['story', 'journal', 'goal', 'thread', 'lore'].forEach((kind) => {
      expect(exported).toContain(`Quixote ${kind}`);
    });
    expect(exported).toContain('Shared lore');
  });
  it("drops the deleted character's world thread", async () => {
    const goneId = useCharacterStore.getState().createCharacter(createTestCharacterData({ name: 'Gone', worldId: 'world-1' }));
    useWorldStore.setState({ worlds: { 'world-1': { id: 'world-1', name: 'World' } } } as never);
    const worldState = useWorldStore.getState().getWorldState('world-1');
    useWorldStore.setState({
      worldStates: {
        'world-1': {
          ...worldState,
          playerCharacterThreads: {
            'thread-gone': {
              id: 'thread-gone', characterId: goneId, worldId: 'world-1', summary: 'Kilimanjaro summary',
              highlights: [], sessionIds: [], crossCharacterReferences: [], lastUpdated: '2026-01-01',
            },
          },
        },
      },
    } as never);

    await deleteCharacterWithCleanup(goneId);

    expect(JSON.stringify((await exportGameState()).data)).not.toContain('Kilimanjaro');
  });
});
