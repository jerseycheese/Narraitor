/**
 * With the player's sheet in hand, the extractor tells the model the player's
 * family and past are the sheet's to state, and drops what gets recorded
 * about them anyway. Without a sheet, nothing changes.
 */

jest.mock('@/lib/ai/defaultGeminiClient');

import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { extractStructuredLore } from '../structuredLoreExtractor';

const mockedCreateClient = createDefaultGeminiClient as jest.Mock;

const respondWith = (json: unknown) => {
  const generateContent = jest.fn().mockResolvedValue({
    content: '```json\n' + JSON.stringify(json) + '\n```',
  });
  mockedCreateClient.mockReturnValue({ generateContent });
  return generateContent;
};

const PLAYER_SHEET = {
  sheet: 'History: Both grandparents worked the looms until 2014.\nPersonality: Careful.',
  canon: 'Both grandparents worked the looms until 2014.\nCareful.\nAunt Carol',
};

const FAMILY_CLAIMS = {
  characters: [
    { name: 'Clara', description: "Wren's grandmother, a weaver" },
    { name: 'Aunt Carol', description: 'Your aunt, in the front row' },
  ],
  locations: [],
  rules: [],
  events: [
    { description: "Mr. Henderson recalls Wren's grandparents Clara and Thomas at the looms." },
    { description: 'Wren Calloway asks who holds the mill debt.' },
  ],
};

describe('extractStructuredLore with the player sheet', () => {
  beforeEach(() => jest.clearAllMocks());

  it('drops a relative the game does not know and keeps one the roster does', async () => {
    respondWith(FAMILY_CLAIMS);

    const result = await extractStructuredLore('prose', undefined, {
      playerCharacterName: 'Wren Calloway',
      playerSheet: PLAYER_SHEET,
    });

    expect(result.characters.map((character) => character.name)).toEqual(['Aunt Carol']);
    expect(result.events.map((event) => event.description)).toEqual([
      'Wren Calloway asks who holds the mill debt.',
    ]);
  });

  it('leaves the extraction alone without a sheet', async () => {
    respondWith(FAMILY_CLAIMS);

    const result = await extractStructuredLore('prose', undefined, {
      playerCharacterName: 'Wren Calloway',
    });

    expect(result.characters).toHaveLength(2);
    expect(result.events).toHaveLength(2);
  });

  it("tells the model the sheet owns the player's family and past", async () => {
    const generateContent = respondWith({ characters: [], locations: [], rules: [], events: [] });

    await extractStructuredLore('prose', undefined, {
      playerCharacterName: 'Wren Calloway',
      playerSheet: PLAYER_SHEET,
    });

    const prompt = generateContent.mock.calls[0][0] as string;
    expect(prompt).toContain('belong to their character sheet, which reads:');
    expect(prompt).toContain('History: Both grandparents worked the looms until 2014.');
  });
});
