import { applyWorldCost } from '../applyWorldCost';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldThreadStore } from '@/state/worldThreadStore';
import type { StoreCharacter } from '@/state/characterStore.types';

const makeCharacter = (id: string, conditions: string[] = []): StoreCharacter =>
  ({
    id,
    name: 'Jamie Holt',
    description: '',
    worldId: 'world-1',
    level: 1,
    attributes: [],
    skills: [],
    derivedStats: [],
    background: { history: '', personality: '', goals: [], fears: [], relationships: [] },
    isPlayer: true,
    status: { conditions },
    inventory: { characterId: id, items: [], capacity: 10, categories: [], itemOrder: [] },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }) as StoreCharacter;

describe('applyWorldCost', () => {
  let threadId: string;

  beforeEach(() => {
    useCharacterStore.setState({ characters: {}, entities: {}, error: null });
    useCharacterStore.setState((state) => ({
      characters: { ...state.characters, 'char-1': makeCharacter('char-1', ['shaken']) },
    }));
    useWorldThreadStore.setState({ threads: {}, entities: {}, sessionThreads: {} });
    threadId = useWorldThreadStore.getState().create({
      sessionId: 'session-1',
      worldId: 'world-1',
      kind: 'actor',
      summary: 'The creature comes through the shed wall',
      openedAtTurn: 1,
      lastAdvancedAtTurn: 1,
      status: 'open',
      notes: [],
    });
  });

  it('writes an imposed condition to the character, attributes it to the thread, and clears what the prose ended', () => {
    const note = applyWorldCost({
      sessionId: 'session-1',
      characterId: 'char-1',
      result: {
        imposed: [{ kind: 'condition', detail: 'gashed left forearm', threadId }],
        cleared: ['shaken'],
        fatal: false,
      },
    });

    expect(useCharacterStore.getState().characters['char-1'].status.conditions).toEqual(['gashed left forearm']);
    expect(useWorldThreadStore.getState().threads[threadId].costs).toEqual(['gashed left forearm']);
    expect(note).toEqual({
      imposed: [{ kind: 'condition', detail: 'gashed left forearm', thread: 'The creature comes through the shed wall' }],
      cleared: ['shaken'],
    });
  });

  it('records an item cost as attribution only, never touching the character', () => {
    const note = applyWorldCost({
      sessionId: 'session-1',
      characterId: 'char-1',
      result: { imposed: [{ kind: 'item', detail: 'rusty shovel', threadId }], cleared: [], fatal: false },
    });

    expect(useCharacterStore.getState().characters['char-1'].status.conditions).toEqual(['shaken']);
    expect(useWorldThreadStore.getState().threads[threadId].costs).toEqual(['rusty shovel']);
    expect(note.imposed).toEqual([{ kind: 'item', detail: 'rusty shovel', thread: 'The creature comes through the shed wall' }]);
  });

  it('keeps a cost whose thread id is unknown, without a thread on the note', () => {
    const note = applyWorldCost({
      sessionId: 'session-1',
      characterId: 'char-1',
      result: { imposed: [{ kind: 'condition', detail: 'hoarse', threadId: 'thread-nope' }], cleared: [], fatal: false },
    });

    expect(useCharacterStore.getState().characters['char-1'].status.conditions).toEqual(['shaken', 'hoarse']);
    expect(note.imposed).toEqual([{ kind: 'condition', detail: 'hoarse' }]);
  });

  it('skips a re-imposed condition the character already carries, keeping it off the note and the thread', () => {
    const note = applyWorldCost({
      sessionId: 'session-1',
      characterId: 'char-1',
      result: {
        imposed: [{ kind: 'condition', detail: '  SHAKEN ', threadId }],
        cleared: [],
        fatal: false,
      },
    });

    expect(note.imposed).toEqual([]);
    expect(useCharacterStore.getState().characters['char-1'].status.conditions).toEqual(['shaken']);
    expect(useWorldThreadStore.getState().threads[threadId].costs).toBeUndefined();
  });

  it('still imposes a condition worded differently from what the character carries', () => {
    const note = applyWorldCost({
      sessionId: 'session-1',
      characterId: 'char-1',
      result: {
        imposed: [{ kind: 'condition', detail: 'badly shaken' }],
        cleared: [],
        fatal: false,
      },
    });

    expect(note.imposed).toEqual([{ kind: 'condition', detail: 'badly shaken' }]);
    expect(useCharacterStore.getState().characters['char-1'].status.conditions).toEqual(['shaken', 'badly shaken']);
  });

  it('carries a fatal read onto the note and writes no condition for it', () => {
    const note = applyWorldCost({
      sessionId: 'session-1',
      characterId: 'char-1',
      result: { imposed: [], cleared: [], fatal: true },
    });

    expect(note).toEqual({ imposed: [], cleared: [], fatal: true });
    expect(useCharacterStore.getState().characters['char-1'].status.conditions).toEqual(['shaken']);
  });
});
