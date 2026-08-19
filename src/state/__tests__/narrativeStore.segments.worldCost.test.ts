/**
 * The post-segment extraction is keyed on two characters: the goal path gets
 * the scene's first NPC (what it always got), the cost channel gets the
 * session's player. Round 10 of the playtest found the cost channel silent for
 * 21 turns because it had been handed the NPC id.
 */

import { useNarrativeStore } from '../narrativeStore';
import { useWorldStore } from '../worldStore';
import { useSessionStore } from '../sessionStore';
import * as applyWorldClock from '@/lib/narrative/applyWorldClockUpdates';

describe('addSegment hands the extraction the player character', () => {
  let worldId: string;
  const sessionId = 'session-cost-test';

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
      settings: { maxAttributes: 5, maxSkills: 5, attributePointPool: 10, skillPointPool: 10 },
    });
    useSessionStore.setState({ id: sessionId, worldId, characterId: 'char-player', status: 'active' });
  });

  afterEach(() => {
    useNarrativeStore.getState().reset();
    useWorldStore.getState().reset();
    jest.restoreAllMocks();
  });

  it('passes the session character as playerCharacterId and the first scene NPC as characterId', async () => {
    const spy = jest.spyOn(applyWorldClock, 'applyWorldClockUpdates').mockResolvedValue(undefined);

    useNarrativeStore.getState().addSegment(sessionId, {
      worldId,
      content: 'Henderson steps forward with the ledger.',
      type: 'scene',
      metadata: { tags: [], characterIds: ['npc-henderson'] },
      timestamp: new Date(),
      updatedAt: new Date().toISOString(),
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchObject({
      sessionId,
      characterId: 'npc-henderson',
      playerCharacterId: 'char-player',
      currentTurn: 1,
    });
  });
});
