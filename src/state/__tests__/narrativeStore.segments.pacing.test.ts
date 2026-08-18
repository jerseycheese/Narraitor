/**
 * addSegment persists the pacing-escalation marker on segment metadata — the
 * finalMetadata whitelist drops anything it doesn't list, and the streak is
 * recomputed from stored segments after a reload.
 */

import { useNarrativeStore } from '../narrativeStore';
import { useWorldStore } from '../worldStore';
import { useSessionStore } from '../sessionStore';
import { computeTurnsSinceComplication } from '@/lib/narrative/turnsSinceComplication';

describe('addSegment pacing metadata', () => {
  let worldId: string;
  const sessionId = 'session-pacing-test';

  beforeEach(() => {
    jest.useRealTimers();
    useWorldStore.getState().reset();
    useNarrativeStore.getState().reset();
    global.fetch = jest.fn();

    worldId = useWorldStore.getState().createWorld({
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
    jest.restoreAllMocks();
  });

  function addSegment(pacingEscalationRequested?: boolean): string {
    return useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content: 'The trail bends toward the treeline.',
      type: 'scene',
      metadata: { tags: [], pacingEscalationRequested },
      timestamp: new Date(),
      updatedAt: new Date().toISOString(),
    });
  }

  it('persists the marker so the streak survives a reload', () => {
    const segmentId = addSegment(true);
    expect(
      useNarrativeStore.getState().segments[segmentId].metadata
        .pacingEscalationRequested
    ).toBe(true);
  });

  it('reads back as a complication when recomputing the streak from the store', () => {
    addSegment(true);
    addSegment();
    addSegment();

    const stored = useNarrativeStore.getState().getSessionSegments(sessionId);
    expect(computeTurnsSinceComplication(stored)).toBe(2);
  });
});
