import { fixExistingSessionNarrativeCounts } from '../fixSessionNarrativeCounts';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';

describe('fixExistingSessionNarrativeCounts', () => {
  beforeEach(() => {
    useSessionStore.setState({ savedSessions: {} });
    useNarrativeStore.setState({ sessionSegments: {} });
  });

  it('repairs stale narrative counts without touching lastPlayed', () => {
    useSessionStore.setState({
      savedSessions: {
        'session-a': {
          id: 'session-a',
          worldId: 'world-1',
          characterId: 'char-1',
          lastPlayed: '2026-01-01T00:00:00.000Z',
          narrativeCount: 0,
        },
      },
    });
    useNarrativeStore.setState({
      sessionSegments: { 'session-a': ['seg-1', 'seg-2'] },
    });

    fixExistingSessionNarrativeCounts();

    const saved = useSessionStore.getState().savedSessions['session-a'];
    expect(saved.narrativeCount).toBe(2);
    expect(saved.lastPlayed).toBe('2026-01-01T00:00:00.000Z');
  });

  it('leaves already-correct sessions alone', () => {
    const savedSessions = {
      'session-a': {
        id: 'session-a',
        worldId: 'world-1',
        characterId: 'char-1',
        lastPlayed: '2026-01-01T00:00:00.000Z',
        narrativeCount: 1,
      },
    };
    useSessionStore.setState({ savedSessions });
    useNarrativeStore.setState({ sessionSegments: { 'session-a': ['seg-1'] } });

    fixExistingSessionNarrativeCounts();

    expect(useSessionStore.getState().savedSessions).toEqual(savedSessions);
  });
});
