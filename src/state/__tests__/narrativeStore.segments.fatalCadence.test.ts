/**
 * addSegment persists the spent-fatal-risk marker on segment metadata. The
 * finalMetadata whitelist drops anything it doesn't list, and the cooldown is
 * recomputed from stored segments whenever the controller rehydrates, so a
 * dropped marker hands a resumed session a fresh licence to kill.
 */

import { useNarrativeStore } from '../narrativeStore';
import { useWorldStore } from '../worldStore';
import { useSessionStore } from '../sessionStore';
import {
  FATAL_DECISION_COOLDOWN_TURNS,
  isFatalCadenceOffCooldown,
  turnsSinceFatalRiskAllowed,
} from '@/lib/narrative/fatalDecisionCadence';

describe('addSegment fatal cadence metadata', () => {
  let worldId: string;
  const sessionId = 'session-fatal-cadence-test';

  beforeEach(() => {
    jest.useRealTimers();
    useWorldStore.getState().reset();
    useNarrativeStore.getState().reset();
    global.fetch = jest.fn();

    worldId = useWorldStore.getState().createWorld({
      name: 'Test World',
      description: 'A test world',
      genre: 'horror',
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

  function addSegment(fatalRiskAllowed?: boolean): string {
    return useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content: 'The door holds, for now.',
      type: 'scene',
      metadata: { tags: [], fatalRiskAllowed },
      timestamp: new Date(),
      updatedAt: new Date().toISOString(),
    });
  }

  it('persists the marker so the cooldown survives a reload', () => {
    const segmentId = addSegment(true);
    expect(
      useNarrativeStore.getState().segments[segmentId].metadata.fatalRiskAllowed
    ).toBe(true);
  });

  it('reads back as a spent turn when recomputing the cooldown from the store', () => {
    addSegment(true);
    addSegment();
    addSegment();

    const stored = useNarrativeStore.getState().getSessionSegments(sessionId);
    expect(turnsSinceFatalRiskAllowed(stored)).toBe(2);
  });

  it('keeps a resumed session on cooldown after a long run spent its fatal risk', () => {
    for (let i = 0; i < FATAL_DECISION_COOLDOWN_TURNS; i++) addSegment();
    addSegment(true);

    const stored = useNarrativeStore.getState().getSessionSegments(sessionId);
    expect(isFatalCadenceOffCooldown(stored)).toBe(false);
  });
});
