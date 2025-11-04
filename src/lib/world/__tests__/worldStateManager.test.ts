import {
  updateNPCRelationship,
  recordMajorEvent,
  getActiveWorldState,
  detectConflict,
  mergeState,
  applyWorldStateUpdate,
} from '../worldStateManager';
import { createEmptyWorldState } from '@/types/world-state.types';

describe('worldStateManager', () => {
  const baseWorldId = 'world-test';

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('filters relationships and events from ended sessions', () => {
    let state = createEmptyWorldState(baseWorldId);

    state = updateNPCRelationship(baseWorldId, state, 'npc-active', { trustDelta: 10 }, 'session-active');
    state = updateNPCRelationship(baseWorldId, state, 'npc-ended', { trustDelta: -20 }, 'session-ended');

    state = recordMajorEvent(
      baseWorldId,
      state,
      {
        id: 'event-ended',
        description: 'Kingdom falls into ruin',
        timestamp: new Date().toISOString(),
        characterId: 'character-1',
      },
      'session-ended'
    );

    state = recordMajorEvent(
      baseWorldId,
      state,
      {
        id: 'event-active',
        description: 'City holds a celebration',
        timestamp: new Date().toISOString(),
        characterId: 'character-2',
      },
      'session-active'
    );

    const lookup = (sessionId: string) => (sessionId === 'session-active' ? 'active' : 'ended');

    const filtered = getActiveWorldState(baseWorldId, state, lookup);

    expect(filtered.npcRelationships).toHaveProperty('npc-active');
    expect(filtered.npcRelationships).not.toHaveProperty('npc-ended');
    expect(filtered.majorEvents.map(event => event.id)).toEqual(['event-active']);
  });

  it('applies relationship updates and increments version', () => {
    let state = createEmptyWorldState(baseWorldId);

    state = updateNPCRelationship(baseWorldId, state, 'npc-1', { trustDelta: 25 }, 'session-active');

    const relationship = state.npcRelationships['npc-1'];
    expect(relationship.trust).toBe(75);
    expect(relationship.sentiment).toBe(0);
    expect(state.version).toBe(1);
  });

  it('detects version conflicts when incoming version is stale', () => {
    expect(detectConflict(3, 2)).toBe(true);
    expect(detectConflict(3, 3)).toBe(true);
    expect(detectConflict(3, 4)).toBe(false);
  });

  it('merges world states preferring most recent updates', () => {
    jest.setSystemTime(new Date('2025-01-01T01:00:00.000Z'));
    let current = createEmptyWorldState(baseWorldId);
    current = updateNPCRelationship(baseWorldId, current, 'npc-merge', { trust: 40 }, 'session-a');

    jest.setSystemTime(new Date('2025-01-01T02:00:00.000Z'));
    let incoming = createEmptyWorldState(baseWorldId);
    incoming = updateNPCRelationship(baseWorldId, incoming, 'npc-merge', { trust: 65 }, 'session-b');

    const merged = mergeState(current, incoming);
    const relationship = merged.npcRelationships['npc-merge'];

    expect(relationship.trust).toBe(65);
    expect(merged.version).toBe(Math.max(current.version, incoming.version));
  });

  it('removes player character threads and relationship edges when requested', () => {
    let state = createEmptyWorldState(baseWorldId);

    state = applyWorldStateUpdate(
      baseWorldId,
      state,
      {
        playerCharacterThreads: {
          'thread-charA': {
            id: 'thread-charA',
            characterId: 'charA',
            summary: 'CharA investigates the ruins.',
            highlights: ['CharA investigates the ruins.'],
            sessionIds: ['session-1'],
          },
          'thread-charB': {
            id: 'thread-charB',
            characterId: 'charB',
            summary: 'CharB patrols the marketplace.',
            highlights: ['CharB patrols the marketplace.'],
            sessionIds: ['session-1'],
            crossCharacterReferences: [
              {
                characterId: 'charA',
                summary: 'CharA asked CharB for backup.',
                lastReferencedAt: new Date().toISOString(),
                sessionId: 'session-1',
              },
            ],
          },
        },
      },
      'session-1'
    );

    state = applyWorldStateUpdate(
      baseWorldId,
      state,
      {
        characterRelationships: {
          charA: {
            charB: {
              sentiment: 35,
              trust: 70,
              tension: 15,
            },
          },
          charB: {
            charA: {
              sentiment: 20,
              trust: 55,
              tension: 10,
            },
          },
        },
      },
      'session-1'
    );

    expect(Object.keys(state.playerCharacterThreads)).toHaveLength(2);
    expect(state.characterRelationships.charA?.charB?.trust).toBe(70);

    state = applyWorldStateUpdate(
      baseWorldId,
      state,
      {
        removePlayerCharacterThreads: ['thread-charA'],
        removeCharacterRelationships: [
          { sourceId: 'charA', targetId: 'charB' },
          { sourceId: 'charB', targetId: 'charA' },
        ],
        playerCharacterThreads: {
          'thread-charB': {
            id: 'thread-charB',
            characterId: 'charB',
            crossCharacterReferences: [],
            replaceCrossCharacterReferences: true,
          },
        },
      },
      'cleanup-session'
    );

    expect(state.playerCharacterThreads).not.toHaveProperty('thread-charA');
    expect(state.characterRelationships.charA).toBeUndefined();
    expect(state.characterRelationships.charB?.charA).toBeUndefined();
    expect(state.playerCharacterThreads['thread-charB'].crossCharacterReferences).toHaveLength(0);
  });
});
