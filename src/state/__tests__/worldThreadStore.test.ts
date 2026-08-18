// src/state/__tests__/worldThreadStore.test.ts

import { useWorldThreadStore } from '../worldThreadStore';
import { MIN_DUE_HORIZON_TURNS } from '@/lib/narrative/worldClock';
import { storeEvents, StoreEventTypes, type SessionFreshStartEvent } from '@/lib/state/storePubSub';
import type { WorldThreadExtractionResult } from '../../types/worldThread.types';

const emptyResult = (): WorldThreadExtractionResult => ({ opened: [], advanced: [], resolved: [] });

const openThread = (sessionId: string, summary: string, worldId = 'world-1') =>
  useWorldThreadStore.getState().create({
    sessionId,
    worldId,
    kind: 'consequence',
    summary,
    openedAtTurn: 1,
    lastAdvancedAtTurn: 1,
    status: 'open',
    notes: [],
  });

const emitFreshStart = (overrides: Partial<SessionFreshStartEvent>) =>
  storeEvents.emit<SessionFreshStartEvent>(StoreEventTypes.SESSION_FRESH_START, {
    sessionId: 'session-a',
    worldId: 'world-1',
    characterId: 'char-1',
    isNewSession: true,
    isForcedFresh: false,
    ...overrides,
  });

describe('worldThreadStore', () => {
  beforeEach(() => {
    useWorldThreadStore.setState({
      threads: {},
      entities: {},
      sessionThreads: {},
      currentEntityId: null,
      error: null,
      loading: false,
    });
  });

  test('creates a thread scoped to its session', () => {
    const id = openThread('session-a', 'The guard captain wants his stolen ledger back');
    openThread('session-b', 'A storm is three days out');

    const state = useWorldThreadStore.getState();
    expect(state.threads[id].summary).toBe('The guard captain wants his stolen ledger back');
    expect(state.getOpenThreadsBySession('session-a').map((t) => t.id)).toEqual([id]);
    expect(state.hasSessionLedger('session-a')).toBe(true);
    expect(state.hasSessionLedger('session-c')).toBe(false);
  });

  test('rejects a thread with no summary or an unknown kind', () => {
    const base = {
      sessionId: 'session-a',
      worldId: 'world-1',
      openedAtTurn: 1,
      lastAdvancedAtTurn: 1,
      status: 'open' as const,
      notes: [],
    };
    expect(() =>
      useWorldThreadStore.getState().create({ ...base, kind: 'consequence', summary: '   ' })
    ).toThrow('summary');
    expect(() =>
      useWorldThreadStore
        .getState()
        .create({ ...base, kind: 'rumor' as 'consequence', summary: 'A rumor spreads' })
    ).toThrow('kind');
  });

  describe('applyExtraction', () => {
    test('opens, advances, and resolves, ignoring foreign ids', () => {
      const ownId = openThread('session-a', 'The debt collector is coming');
      const resolvableId = openThread('session-a', 'The bridge is out');
      const foreignId = openThread('session-b', 'The king is dying');

      const applied = useWorldThreadStore.getState().applyExtraction(
        'session-a',
        'world-1',
        {
          opened: [{ kind: 'deadline', summary: 'The festival begins at dusk', dueByTurn: 6 }],
          advanced: [
            { id: ownId, changed: 'His men were seen at the docks' },
            { id: foreignId, changed: 'should not land' },
            { id: 'thread-missing', changed: 'nothing to land on' },
          ],
          resolved: [
            { id: resolvableId, resolution: 'The ferry took them across', outcome: 'resolved' },
            { id: foreignId, resolution: 'nope', outcome: 'dropped' },
          ],
        },
        4
      );

      expect(applied).toEqual({
        opened: ['The festival begins at dusk'],
        advanced: ['The debt collector is coming'],
        resolved: ['The bridge is out'],
      });

      const state = useWorldThreadStore.getState();
      const opened = state.getOpenThreadsBySession('session-a').find((t) => t.kind === 'deadline');
      expect(opened).toMatchObject({ openedAtTurn: 4, lastAdvancedAtTurn: 4, dueByTurn: 6, status: 'open' });
      expect(state.threads[ownId]).toMatchObject({
        lastAdvancedAtTurn: 4,
        notes: ['His men were seen at the docks'],
      });
      expect(state.threads[resolvableId]).toMatchObject({
        status: 'resolved',
        resolution: 'The ferry took them across',
        lastAdvancedAtTurn: 4,
      });
      expect(state.threads[foreignId]).toMatchObject({ status: 'open', lastAdvancedAtTurn: 1, notes: [] });
    });

    test('a due turn nearer than the horizon is floored, not dropped', () => {
      useWorldThreadStore.getState().applyExtraction(
        'session-a',
        'world-1',
        {
          opened: [
            { kind: 'deadline', summary: 'The vote is this afternoon', dueByTurn: 8 },
            { kind: 'deadline', summary: 'The report is due next week', dueByTurn: 17 },
            { kind: 'actor', summary: 'Thorne is calling in favors' },
          ],
          advanced: [],
          resolved: [],
        },
        7
      );

      const bySummary = Object.fromEntries(
        useWorldThreadStore.getState().getOpenThreadsBySession('session-a').map((t) => [t.summary, t.dueByTurn])
      );
      expect(bySummary).toEqual({
        'The vote is this afternoon': 7 + MIN_DUE_HORIZON_TURNS,
        'The report is due next week': 17,
        'Thorne is calling in favors': undefined,
      });
    });

    test('an all-empty result still seeds the session ledger', () => {
      expect(useWorldThreadStore.getState().hasSessionLedger('session-a')).toBe(false);
      useWorldThreadStore.getState().applyExtraction('session-a', 'world-1', emptyResult(), 1);
      expect(useWorldThreadStore.getState().hasSessionLedger('session-a')).toBe(true);
      expect(useWorldThreadStore.getState().getOpenThreadsBySession('session-a')).toEqual([]);
    });
  });

  test('clearSessionThreads drops the threads and the ledger key', () => {
    openThread('session-a', 'The debt collector is coming');
    openThread('session-b', 'The king is dying');

    useWorldThreadStore.getState().clearSessionThreads('session-a');

    const state = useWorldThreadStore.getState();
    expect(state.hasSessionLedger('session-a')).toBe(false);
    expect(state.getOpenThreadsBySession('session-b')).toHaveLength(1);
  });

  test('WORLD_DELETED clears that world threads only', async () => {
    openThread('session-a', 'The debt collector is coming', 'world-1');
    const keptId = openThread('session-b', 'The king is dying', 'world-2');

    await storeEvents.emit(StoreEventTypes.WORLD_DELETED, { worldId: 'world-1' });

    expect(Object.keys(useWorldThreadStore.getState().threads)).toEqual([keptId]);
  });

  test('SESSION_FRESH_START clears the ledger only for a new session', async () => {
    openThread('session-a', 'The debt collector is coming');

    await emitFreshStart({ sessionId: 'session-a', isNewSession: false });
    expect(useWorldThreadStore.getState().hasSessionLedger('session-a')).toBe(true);

    await emitFreshStart({ sessionId: 'session-a', isNewSession: true });
    expect(useWorldThreadStore.getState().hasSessionLedger('session-a')).toBe(false);
  });
});
