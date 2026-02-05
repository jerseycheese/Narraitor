import {
  updateNPCRelationship,
  recordMajorEvent,
  recordStoryCheckpoint,
  getActiveWorldState,
  detectConflict,
  mergeState,
  applyWorldStateUpdate,
} from '../index';
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

    state = recordStoryCheckpoint(
      baseWorldId,
      state,
      {
        id: 'checkpoint-ended',
        segment: 'Recap of the doomed arc',
        highlights: ['Kingdom collapsed'],
        eventIds: ['event-ended'],
      },
      'session-ended'
    );

    state = recordStoryCheckpoint(
      baseWorldId,
      state,
      {
        id: 'checkpoint-active',
        segment: 'Festival recap',
        highlights: ['City celebrated the hero'],
        eventIds: ['event-active'],
      },
      'session-active'
    );

    const lookup = (sessionId: string) => (sessionId === 'session-active' ? 'active' : 'ended');

    const filtered = getActiveWorldState(baseWorldId, state, lookup);

    expect(filtered.npcRelationships).toHaveProperty('npc-active');
    expect(filtered.npcRelationships).not.toHaveProperty('npc-ended');
    expect(filtered.majorEvents.map(event => event.id)).toEqual(['event-active']);
    expect(filtered.storyCheckpoints.map(checkpoint => checkpoint.id)).toEqual(['checkpoint-active']);
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
    expect(merged.storyCheckpoints).toHaveLength(0);
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

  it('applies story checkpoint updates via world state update payloads', () => {
    const state = applyWorldStateUpdate(
      baseWorldId,
      createEmptyWorldState(baseWorldId),
      {
        storyCheckpoints: [
          {
            id: 'checkpoint-1',
            segment: 'First chapter recap',
            highlights: ['Hero met mentor'],
            eventIds: ['event-1'],
          },
        ],
      },
      'session-story'
    );

    expect(state.storyCheckpoints).toHaveLength(1);
    expect(state.storyCheckpoints[0].segment).toBe('First chapter recap');
    expect(state.storyCheckpoints[0].eventIds).toEqual(['event-1']);
    expect(state.storyCheckpoints[0].sessionId).toBe('session-story');
  });

  it('merges story checkpoints preferring the newest revisions', () => {
    const base = createEmptyWorldState(baseWorldId);
    const current = recordStoryCheckpoint(
      baseWorldId,
      base,
      {
        id: 'checkpoint-shared',
        segment: 'Old arc summary',
        highlights: ['Old highlight'],
        eventIds: ['event-old'],
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      'session-a'
    );

    const incoming = recordStoryCheckpoint(
      baseWorldId,
      base,
      {
        id: 'checkpoint-shared',
        segment: 'Updated arc summary',
        highlights: ['New highlight'],
        eventIds: ['event-new'],
        createdAt: '2025-01-02T00:00:00.000Z',
      },
      'session-a'
    );

    const merged = mergeState(current, incoming);
    expect(merged.storyCheckpoints).toHaveLength(1);
    expect(merged.storyCheckpoints[0].segment).toBe('Updated arc summary');
    expect(merged.storyCheckpoints[0].eventIds).toEqual(['event-new']);
  });
});
