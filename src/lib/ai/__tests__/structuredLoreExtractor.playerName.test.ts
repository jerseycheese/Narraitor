/**
 * The player character's name is reserved. A lore character entry carrying it is
 * either a duplicate of the character sheet or a third party the model minted
 * wearing the player's name, and either way it poisons later prompts.
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

const extraction = (characters: unknown[], events: unknown[] = []) => ({
  characters,
  locations: [],
  rules: [],
  events,
});

describe('extractStructuredLore reserves the player character name', () => {
  beforeEach(() => jest.clearAllMocks());

  it('drops a character entry named after the player', async () => {
    respondWith(
      extraction([
        { name: 'Wren Calloway', description: 'Thomas\'s cousin at the county planning office' },
        { name: 'Thomas', description: 'The mill foreman' },
      ])
    );

    const result = await extractStructuredLore('prose', undefined, {
      playerCharacterName: 'Wren Calloway',
    });

    expect(result.characters.map((c) => c.name)).toEqual(['Thomas']);
  });

  it('matches the player name regardless of case and surrounding whitespace', async () => {
    respondWith(extraction([{ name: '  wren   calloway ' }]));

    const result = await extractStructuredLore('prose', undefined, {
      playerCharacterName: 'Wren Calloway',
    });

    expect(result.characters).toHaveLength(0);
  });

  it('drops a character that claims the player name as an alias', async () => {
    respondWith(
      extraction([{ name: 'The planning clerk', aliases: ['Wren Calloway'] }])
    );

    const result = await extractStructuredLore('prose', undefined, {
      playerCharacterName: 'Wren Calloway',
    });

    expect(result.characters).toHaveLength(0);
  });

  it('keeps events naming the player, which usually record real player actions', async () => {
    respondWith(
      extraction(
        [],
        [{ description: 'Wren Calloway questions Councilman Davies about the mill debt.' }]
      )
    );

    const result = await extractStructuredLore('prose', undefined, {
      playerCharacterName: 'Wren Calloway',
    });

    expect(result.events).toHaveLength(1);
  });

  it('leaves characters alone when no player name is supplied', async () => {
    respondWith(extraction([{ name: 'Wren Calloway' }]));

    const result = await extractStructuredLore('prose');

    expect(result.characters.map((c) => c.name)).toEqual(['Wren Calloway']);
  });

  it('tells the model the name is reserved', async () => {
    const generateContent = respondWith(extraction([]));

    await extractStructuredLore('prose', undefined, {
      playerCharacterName: 'Wren Calloway',
    });

    expect(generateContent.mock.calls[0][0]).toContain(
      '"Wren Calloway" is the PLAYER CHARACTER'
    );
  });
});
