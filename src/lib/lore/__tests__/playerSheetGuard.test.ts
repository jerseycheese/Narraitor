/**
 * The player character's family and past belong to the character sheet. An
 * NPC naming the player's grandmother is a claim, not a fact, and the lore
 * extractor must not write it into the ledger as one.
 */

import {
  buildPlayerSheetCanon,
  claimsPlayerKin,
  guardExtractionAgainstPlayerSheet,
} from '../playerSheetGuard';
import type { StructuredLoreExtraction } from '@/types/lore.types';

const WREN = 'Wren Calloway';

const SHEET = {
  history:
    'Grew up four streets from the mill; both grandparents worked the looms until 2014. Left for a decade, came back when their mother got sick.',
  personality: 'Careful, slow to commit, uncomfortable being owed favours.',
  goals: ['Find out what the mill is actually worth'],
  fears: [],
  relationships: [],
};

const WORLD =
  'Harrowgate has been arguing about the mill for eleven years. Everyone in town has a position, and several of them are related to you.';

const extraction = (
  characters: StructuredLoreExtraction['characters'] = [],
  events: StructuredLoreExtraction['events'] = []
): StructuredLoreExtraction => ({
  characters,
  locations: [],
  events,
  rules: [],
  relationships: [],
});

describe('claimsPlayerKin', () => {
  it.each([
    "Mr. Henderson remembers Wren's grandmother, Clara, at the looms.",
    "Evelyn Hayes recalls Wren Calloway's grandfather Arthur as a skilled weaver.",
    "The protagonist's mother, Sarah, tended the sick in 2008.",
    'Your aunt, perched in the front row with her knitting bag.',
    'Clara, grandmother of Wren, taught Henderson to adjust a warp beam.',
    "Wren Calloway's late father ran the union local.",
  ])('ties a relative to the player: %s', (text) => {
    expect(claimsPlayerKin(text, WREN)).toBe(true);
  });

  it.each([
    "Wren Calloway questions Councilman Davies about who holds the mill's debt.",
    "Aunt Carol expresses clear disapproval of Wren Calloway's actions during the council meeting.",
    "Wren's question about the old mill families goes unanswered.",
    "Mayor Thompson's father, Old Man Hemlock, owned the brickworks.",
  ])("leaves the player's own actions and other people's relatives alone: %s", (text) => {
    expect(claimsPlayerKin(text, WREN)).toBe(false);
  });
});

describe('guardExtractionAgainstPlayerSheet', () => {
  const canon = buildPlayerSheetCanon({
    background: SHEET,
    worldDescription: WORLD,
    knownNames: ['Aunt Carol', 'Mr. Henderson'],
  })!;

  it('drops a relative of the player that nothing in the game names', () => {
    const { extraction: kept, dropped } = guardExtractionAgainstPlayerSheet(
      extraction([
        { name: 'Clara', role: "Wren's grandmother", description: 'Worked the looms at Rowan Textiles.' },
        { name: 'Mr. Henderson', description: 'The mill foreman.' },
      ]),
      WREN,
      canon.canon
    );

    expect(kept.characters.map((character) => character.name)).toEqual(['Mr. Henderson']);
    expect(dropped).toHaveLength(1);
  });

  it('keeps a relative the roster already holds, and drops one it only names now', () => {
    const { extraction: kept } = guardExtractionAgainstPlayerSheet(
      extraction([
        { name: 'Aunt Carol', description: 'Your aunt, perched in the front row.' },
        { name: 'Sarah', description: "Wren's mother, who was sick for years." },
      ]),
      WREN,
      canon.canon
    );

    expect(kept.characters.map((character) => character.name)).toEqual(['Aunt Carol']);
  });

  it('drops an event that tells the player their own family history', () => {
    const { extraction: kept } = guardExtractionAgainstPlayerSheet(
      extraction(
        [],
        [
          { description: "Mr. Henderson recalls Wren's grandparents Clara and Thomas working the looms." },
          { description: 'Wren Calloway questions Councilman Davies about the mill debt.' },
          {
            description: 'Henderson names the weavers he learned from as Clara and Thomas.',
            continuity: { kind: 'assertion', topic: "Wren's grandparents", speaker: 'Mr. Henderson' },
          },
        ]
      ),
      WREN,
      canon.canon
    );

    expect(kept.events.map((event) => event.description)).toEqual([
      'Wren Calloway questions Councilman Davies about the mill debt.',
    ]);
  });
});

describe('buildPlayerSheetCanon', () => {
  it('is nothing without sheet text, so the guard stays off for a blank sheet', () => {
    expect(
      buildPlayerSheetCanon({ background: { history: '', personality: ' ' }, worldDescription: WORLD })
    ).toBeUndefined();
  });

  it('shows the model history and personality, and vouches with the whole sheet plus the roster', () => {
    const canon = buildPlayerSheetCanon({ background: SHEET, knownNames: ['Aunt Carol'] })!;

    expect(canon.sheet).toBe(`History: ${SHEET.history}\nPersonality: ${SHEET.personality}`);
    expect(canon.canon).toContain('Find out what the mill is actually worth');
    expect(canon.canon).toContain('Aunt Carol');
  });
});
