/**
 * Tests for the turn-level funnel events wired into narrativeStore:
 *   - narrative-turn: fired from addSegment, next to the state commit
 *   - session-ended: fired from markSessionEnded, the chokepoint both
 *     generateEnding paths (success and fallback) funnel through
 *
 * jest.setup.ts globally auto-mocks '@/state/narrativeStore' for component
 * tests; unmock it here so these tests exercise the real store.
 */

jest.unmock('../narrativeStore');

import { track } from '@vercel/analytics';
import { useNarrativeStore } from '../narrativeStore';
import { useWorldStore } from '../worldStore';
import { useSessionStore } from '../sessionStore';

const mockTrack = track as jest.Mock;

describe('narrativeStore - turn-level funnel tracking', () => {
  let worldId: string;
  const sessionId = 'session-tracking-test';

  beforeEach(() => {
    jest.useRealTimers();
    useWorldStore.getState().reset();
    useNarrativeStore.getState().reset();
    mockTrack.mockClear();

    worldId = useWorldStore.getState().create({
      name: 'Test World',
      description: 'A test world',
      genre: 'fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 5,
        maxSkills: 5,
        attributePointPool: 10,
        skillPointPool: 10,
      },
    });
    useSessionStore.getState().upsertSessionLifecycle({
      id: sessionId,
      worldId,
      characterId: 'char-test',
      status: 'active',
      lastActivity: new Date().toISOString(),
    });
  });

  afterEach(() => {
    useNarrativeStore.getState().reset();
    useWorldStore.getState().reset();
  });

  test('addSegment fires the narrative-turn funnel event exactly once', () => {
    useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content: 'You step into the tavern.',
      type: 'scene',
      timestamp: new Date(),
      updatedAt: new Date().toISOString(),
      metadata: { tags: [] },
    });

    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith('narrative-turn');
  });

  test('markSessionEnded fires the session-ended funnel event exactly once', () => {
    useNarrativeStore.getState().markSessionEnded(sessionId);

    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith('session-ended');
  });
});
