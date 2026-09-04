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
      detectUnrecordedExchangeClaim(
        "Tell Davies privately that I'll vote no.",
        {
          'npc-davies': 'Davies',
        }
      )
    ).toBeNull();
  });

  it('stays quiet on a conversation the story actually narrated', () => {
    // A council meeting the player watched, with others present. Firing here
    // would assert "nothing passed between you off the page" about a real
    // on-page scene and push the model to deny its own canon, so a past
    // communication needs an off-page marker before it counts.
    expect(
      detectUnrecordedExchangeClaim(
        'Ask Davies to repeat what he told me at the council meeting.',
        { 'npc-davies': 'Davies' }
      )
    ).toBeNull();
  });

  it('declines when two rostered names make the attribution ambiguous', () => {
    // Taking the first roster hit would have Davies deny a conversation the
    // player attributed to Mira.
    expect(
      detectUnrecordedExchangeClaim(
        'Ask Davies why Mira told me the vote was fixed, just between us.',
        { 'npc-davies': 'Davies', 'npc-mira': 'Mira' }
      )
    ).toBeNull();
  });

  it('resolves a multi-word NPC name by an individual name part when unique', () => {
    const claim = detectUnrecordedExchangeClaim(
      'Ask Marla to repeat what she told me privately.',
      { 'npc-marla': 'Marla Jones' }
    );
    expect(claim).toMatchObject({ npcId: 'npc-marla', name: 'Marla Jones' });
  });

  it('ignores incidental name stopwords when resolving a unique NPC', () => {
    const claim = detectUnrecordedExchangeClaim(
      'Ask Mira to repeat what she told me privately at the mill.',
      { 'npc-mira': 'Mira', 'npc-caretaker': 'The Caretaker' }
    );
    expect(claim).toMatchObject({ npcId: 'npc-mira', name: 'Mira' });
  });

  it('does not resolve an NPC from an incidental name stopword alone', () => {
    expect(
      detectUnrecordedExchangeClaim(
        'Ask Mira to repeat what she told me privately at the mill.',
        { 'npc-caretaker': 'The Caretaker' }
      )
    ).toBeNull();
  });

  it('declines when release-smoke phrasing mentions multiple rostered NPCs partially or fully', () => {
    expect(
      detectUnrecordedExchangeClaim(
        'Ask Marla why Coach Barry told me the game was off, just between us.',
        { 'npc-marla': 'Marla Jones', 'npc-barry': 'Coach Barry' }
      )
    ).toBeNull();
  });

  it('declines when a name part is shared by multiple rostered NPCs', () => {
    expect(
      detectUnrecordedExchangeClaim(
        'Ask Marla to repeat what she told me privately.',
        { 'npc-marla-1': 'Marla Jones', 'npc-marla-2': 'Marla Singer' }
      )
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

    expect(counts['npc-davies']).toEqual({
      scenes: 3,
      aloneTogether: false,
      privateExchangeNarrated: false,
    });
    expect(counts['npc-carol']).toEqual({
      scenes: 4,
      aloneTogether: true,
      privateExchangeNarrated: false,
    });
    expect(counts['npc-thornbury']).toBeUndefined();
  });

  it('records a private exchange only when the sole NPC is the primary speaker', () => {
    expect(countSharedScenes([scene(['npc-carol'], 'npc-carol')])).toEqual({
      'npc-carol': {
        scenes: 1,
        aloneTogether: true,
        privateExchangeNarrated: true,
      },
    });
  });
});
