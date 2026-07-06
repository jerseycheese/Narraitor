/**
 * addSegment persists the continuity guardrail note on segment metadata
 * (#409/#412) — the finalMetadata whitelist must carry it through.
 */

import { useNarrativeStore } from '../narrativeStore';
import { useWorldStore } from '../worldStore';
import { useSessionStore } from '../sessionStore';

describe('addSegment continuity metadata', () => {
  let worldId: string;
  const sessionId = 'session-continuity-test';

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

  it('persists metadata.continuity on the stored segment', () => {
    const segmentId = useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content: 'Mira watches you from behind the counter.',
      type: 'scene',
      metadata: {
        tags: [],
        continuity: {
          status: 'corrected',
          issues: [{ type: 'relationship-tone', entity: 'Mira' }],
        },
      },
      timestamp: new Date(),
      updatedAt: new Date().toISOString(),
    });

    const segment = useNarrativeStore.getState().segments[segmentId];
    expect(segment.metadata.continuity).toEqual({
      status: 'corrected',
      issues: [{ type: 'relationship-tone', entity: 'Mira' }],
    });
  });

  it('leaves continuity undefined when not provided', () => {
    const segmentId = useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content: 'You step into the quiet shop.',
      type: 'scene',
      metadata: { tags: [] },
      timestamp: new Date(),
      updatedAt: new Date().toISOString(),
    });

    const segment = useNarrativeStore.getState().segments[segmentId];
    expect(segment.metadata.continuity).toBeUndefined();
  });
});
