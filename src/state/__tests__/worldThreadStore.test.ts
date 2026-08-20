// src/state/__tests__/worldThreadStore.test.ts

import { useWorldThreadStore } from '../worldThreadStore';
import { FIRED_THREAD_FUSE_TURNS, MIN_DUE_HORIZON_TURNS } from '@/lib/narrative/worldClock';
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

    test('an opened entry that covers an open thread refines it instead of opening a new one', () => {
      const favorsId = openThread('session-a', 'Those who appointed the player will seek repayment');
      useWorldThreadStore.getState().update(favorsId, { kind: 'actor', dueByTurn: 3 });
      const resolvedId = openThread('session-a', 'The bridge is out');
      useWorldThreadStore.getState().update(resolvedId, { status: 'resolved', resolution: 'crossed' });
      const foreignId = openThread('session-b', 'The king is dying');

      const applied = useWorldThreadStore.getState().applyExtraction(
        'session-a',
        'world-1',
        {
          opened: [
            { kind: 'actor', summary: 'Mr. Henderson comes to collect the roof loan', dueByTurn: 12, covers: favorsId },
            { kind: 'actor', summary: 'A cousin writes about her debt', covers: resolvedId },
            { kind: 'actor', summary: 'A stranger arrives', covers: foreignId },
            { kind: 'deadline', summary: 'The festival begins at dusk', dueByTurn: 12, covers: null },
          ],
          advanced: [],
          resolved: [],
        },
        9
      );

      expect(applied.opened).toEqual([
        'A cousin writes about her debt',
        'A stranger arrives',
        'The festival begins at dusk',
      ]);
      expect(applied.advanced).toEqual(['Those who appointed the player will seek repayment']);

      const state = useWorldThreadStore.getState();
      expect(state.getOpenThreadsBySession('session-a')).toHaveLength(4);
      expect(state.threads[favorsId]).toMatchObject({
        kind: 'actor',
        summary: 'Mr. Henderson comes to collect the roof loan',
        dueByTurn: 12,
        openedAtTurn: 1,
        lastAdvancedAtTurn: 9,
        status: 'open',
        notes: ['Mr. Henderson comes to collect the roof loan (was: Those who appointed the player will seek repayment)'],
      });
      expect(state.threads[foreignId]).toMatchObject({ status: 'open', summary: 'The king is dying', notes: [] });
    });

    test('a covered entry on an already-fired thread re-files the due only when it gives one, floored at the horizon', () => {
      const lateId = openThread('session-a', 'The collector is coming');
      useWorldThreadStore.getState().update(lateId, { dueByTurn: 3, firedAtTurn: 5 });
      const otherId = openThread('session-a', 'The storm is out at sea');
      useWorldThreadStore.getState().update(otherId, { dueByTurn: 4, firedAtTurn: 6 });

      useWorldThreadStore.getState().applyExtraction(
        'session-a',
        'world-1',
        {
          opened: [
            { kind: 'actor', summary: 'The collector knocks tonight', dueByTurn: 9, covers: lateId },
            { kind: 'deadline', summary: 'The storm makes landfall', covers: otherId },
          ],
          advanced: [],
          resolved: [],
        },
        9
      );

      const state = useWorldThreadStore.getState();
      expect(state.threads[lateId].dueByTurn).toBe(9 + MIN_DUE_HORIZON_TURNS);
      expect(state.threads[otherId]).toMatchObject({ summary: 'The storm makes landfall', dueByTurn: 4 });
    });

    test('a thread fires when an entry covers it or when it advances while it is the DUE NOW pick', () => {
      const dueNowId = openThread('session-a', 'The collector comes to the door');
      useWorldThreadStore.getState().update(dueNowId, { dueByTurn: 3 });
      const quietId = openThread('session-a', 'The storm is out at sea');
      useWorldThreadStore.getState().update(quietId, { dueByTurn: 5 });
      const coveredId = openThread('session-a', 'Those owed favors come to collect');

      useWorldThreadStore.getState().applyExtraction(
        'session-a',
        'world-1',
        {
          opened: [{ kind: 'actor', summary: 'Henderson arrives with the ledger', dueByTurn: 12, covers: coveredId }],
          advanced: [
            { id: dueNowId, changed: 'The collector is on the porch' },
            { id: quietId, changed: 'The storm turned toward the coast' },
          ],
          resolved: [],
        },
        9
      );

      const state = useWorldThreadStore.getState();
      expect(state.threads[dueNowId].firedAtTurn).toBe(9);
      expect(state.threads[coveredId].firedAtTurn).toBe(9);
      expect(state.threads[quietId].firedAtTurn).toBeUndefined();
      // Firing lights the fuse: the strike, cost or outcome is owed three turns out, whatever due the entry carried.
      expect(state.threads[dueNowId].dueByTurn).toBe(9 + FIRED_THREAD_FUSE_TURNS);
      expect(state.threads[coveredId].dueByTurn).toBe(9 + FIRED_THREAD_FUSE_TURNS);
      expect(state.threads[quietId].dueByTurn).toBe(5);
    });

    test('an advance on a fired thread that is the DUE NOW pick re-fuses it; one off the pick leaves the fuse alone', () => {
      const atFuseId = openThread('session-a', 'The creature is inside the shed');
      useWorldThreadStore.getState().update(atFuseId, { dueByTurn: 10, firedAtTurn: 7 });
      const restingId = openThread('session-a', 'Henderson is in the room');
      useWorldThreadStore.getState().update(restingId, { dueByTurn: 12, firedAtTurn: 9 });

      useWorldThreadStore.getState().applyExtraction(
        'session-a',
        'world-1',
        {
          opened: [],
          advanced: [
            { id: atFuseId, changed: 'It raked the player across the forearm' },
            { id: restingId, changed: 'Henderson named the sum' },
          ],
          resolved: [],
        },
        10
      );

      const state = useWorldThreadStore.getState();
      expect(state.threads[atFuseId]).toMatchObject({ firedAtTurn: 7, dueByTurn: 10 + FIRED_THREAD_FUSE_TURNS });
      expect(state.threads[restingId]).toMatchObject({ firedAtTurn: 9, dueByTurn: 12 });
      // Each re-fuse is one strike landed; the advance off the pick counts none.
      expect(state.threads[atFuseId].strikeCount).toBe(1);
      expect(state.threads[restingId].strikeCount).toBeUndefined();
    });

    test('strikes accumulate across re-fuses, and the first firing counts none', () => {
      const threadId = openThread('session-a', 'The thing from the boathouse hunts the shore');
      useWorldThreadStore.getState().update(threadId, { dueByTurn: 5 });

      const strike = (turn: number, changed: string) =>
        useWorldThreadStore
          .getState()
          .applyExtraction('session-a', 'world-1', { opened: [], advanced: [{ id: threadId, changed }], resolved: [] }, turn);

      strike(8, 'It came out of the water'); // fires: overdue past the grace, so it is the pick
      expect(useWorldThreadStore.getState().threads[threadId].strikeCount).toBeUndefined();

      strike(11, 'It wrenched the player\'s shoulder'); // at the fuse: first strike
      strike(14, 'It dragged them toward the treeline'); // second
      strike(17, 'It re-popped the shoulder'); // third
      const thread = useWorldThreadStore.getState().threads[threadId];
      expect(thread.strikeCount).toBe(3);
      expect(thread.dueByTurn).toBe(17 + FIRED_THREAD_FUSE_TURNS);
    });

    test('a fired thread short of its fuse is not the DUE NOW pick, so an advance on it does not re-fire it', () => {
      const firedId = openThread('session-a', 'The collector comes to the door');
      useWorldThreadStore.getState().update(firedId, { dueByTurn: 11, firedAtTurn: 8 });
      const nextId = openThread('session-a', 'The storm makes landfall');
      useWorldThreadStore.getState().update(nextId, { dueByTurn: 5 });

      useWorldThreadStore.getState().applyExtraction(
        'session-a',
        'world-1',
        {
          opened: [],
          advanced: [
            { id: firedId, changed: 'The collector names the sum' },
            { id: nextId, changed: 'The first gust takes the shutters' },
          ],
          resolved: [],
        },
        10
      );

      const state = useWorldThreadStore.getState();
      expect(state.threads[firedId]).toMatchObject({ firedAtTurn: 8, dueByTurn: 11 });
      expect(state.threads[nextId].firedAtTurn).toBe(10);
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
