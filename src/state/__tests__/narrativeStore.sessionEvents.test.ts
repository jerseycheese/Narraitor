/**
 * narrativeStore's SESSION_FRESH_START subscription: fresh sessions get their
 * stale narrative data cleared without sessionStore importing this store.
 */
import { useNarrativeStore } from '../narrativeStore';
import { storeEvents, StoreEventTypes, type SessionFreshStartEvent } from '@/lib/state/storePubSub';
import type { NarrativeSegment, StoryEnding } from '@/types/narrative.types';

const seedSession = (sessionId: string) => {
  const segment = {
    id: `seg-${sessionId}`,
    sessionId,
    worldId: 'world-1',
    content: 'Seeded content',
    type: 'scene',
    metadata: { tags: [] },
    timestamp: new Date(),
    createdAt: new Date().toISOString(),
  } as unknown as NarrativeSegment;

  useNarrativeStore.setState((state) => ({
    segments: { ...state.segments, [segment.id]: segment },
    sessionSegments: { ...state.sessionSegments, [sessionId]: [segment.id] },
    decisions: {
      ...state.decisions,
      [`dec-${sessionId}`]: { id: `dec-${sessionId}`, prompt: 'Seeded?', options: [] },
    },
    sessionDecisions: { ...state.sessionDecisions, [sessionId]: [`dec-${sessionId}`] },
    currentEnding: { id: 'ending-1', sessionId } as unknown as StoryEnding,
  }));
};

const emitFreshStart = (overrides: Partial<SessionFreshStartEvent>) =>
  storeEvents.emit<SessionFreshStartEvent>(StoreEventTypes.SESSION_FRESH_START, {
    sessionId: 'session-a',
    worldId: 'world-1',
    characterId: 'char-1',
    isNewSession: true,
    isForcedFresh: false,
    ...overrides,
  });

describe('narrativeStore SESSION_FRESH_START subscription', () => {
  beforeEach(() => {
    useNarrativeStore.setState({
      segments: {},
      sessionSegments: {},
      decisions: {},
      sessionDecisions: {},
      currentEnding: null,
    });
  });

  it('clears the new session data and the ending for a new session', async () => {
    seedSession('session-a');

    await emitFreshStart({ sessionId: 'session-a', isNewSession: true });

    const state = useNarrativeStore.getState();
    expect(state.getSessionSegments('session-a')).toHaveLength(0);
    expect(state.getSessionDecisions('session-a')).toHaveLength(0);
    expect(state.currentEnding).toBeNull();
  });

  it('leaves other sessions untouched', async () => {
    seedSession('session-a');
    seedSession('session-b');

    await emitFreshStart({ sessionId: 'session-a', isNewSession: true });

    expect(useNarrativeStore.getState().getSessionSegments('session-b')).toHaveLength(1);
  });

  it('does nothing for a resumed (non-new) session', async () => {
    seedSession('session-a');

    await emitFreshStart({ sessionId: 'session-a', isNewSession: false, isForcedFresh: true });

    const state = useNarrativeStore.getState();
    expect(state.getSessionSegments('session-a')).toHaveLength(1);
    expect(state.getSessionDecisions('session-a')).toHaveLength(1);
  });
});
