/**
 * Tests for the unrecorded-exchange primitives (#1857): reading a false-premise
 * claim out of the player's typed action, and counting the co-presence the
 * contract turns into an assertable fact.
 */

import {
  countSharedScenes,
  detectUnrecordedExchangeClaim,
  type CoPresenceSegment,
} from '../unrecordedExchange';

const scene = (
  characterIds: string[],
  speakerId?: string
): CoPresenceSegment => ({ metadata: { characterIds, speakerId } });

describe('detectUnrecordedExchangeClaim', () => {
  it('fires on a recalled private exchange and stays quiet on a proposed one', () => {
    // The issue's own repro string.
    const claim = detectUnrecordedExchangeClaim(
      'Ask Davies to repeat publicly what he told me privately.',
      { 'npc-davies': 'Davies' }
    );
    expect(claim).toMatchObject({ npcId: 'npc-davies', name: 'Davies' });

    // Proposing a private word is not recalling one. This arm is what keeps
    // the lexicon from firing on ordinary custom actions.
    expect(
      detectUnrecordedExchangeClaim("Tell Davies privately that I'll vote no.", {
        'npc-davies': 'Davies',
      })
    ).toBeNull();
  });
});

describe('countSharedScenes', () => {
  it('counts characterIds and speakerId, ignores other NPCs, and reports never alone', () => {
    const segments: CoPresenceSegment[] = [
      // Outside a last-3 window on purpose: previousSegments would lose this
      // one and report Davies as never met.
      scene(['npc-davies', 'npc-carol']),
      scene(['npc-carol']),
      scene([]),
      scene(['npc-davies', 'npc-carol']),
      scene(['npc-carol'], 'npc-davies'),
    ];

    const counts = countSharedScenes(segments);

    expect(counts['npc-davies']).toEqual({ scenes: 3, aloneTogether: false });
    // Carol was alone with the protagonist once, so nothing can be asserted
    // about a private conversation with her.
    expect(counts['npc-carol']).toEqual({ scenes: 4, aloneTogether: true });
    expect(counts['npc-thornbury']).toBeUndefined();
  });
});
