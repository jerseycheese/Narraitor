/**
 * The lore extractor tags events with a continuity annotation (assertion,
 * commitment, scene-change) that the continuity guardrail reads. These tests
 * pin the parse/clean layer and the topic hint, not the prose.
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

describe('extractStructuredLore continuity annotations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('keeps a well-formed continuity annotation on an event', async () => {
    respondWith({
      characters: [],
      locations: [],
      rules: [],
      events: [
        {
          description: 'Aunt Carol says Old Man Rowan paid off the mortgage years ago.',
          importance: 'high',
          continuity: { kind: 'assertion', topic: ' mill debt ', speaker: 'Aunt Carol' },
        },
        {
          description: 'Thomas hands over the developer\'s written offer.',
          continuity: { kind: 'commitment', topic: 'developer offer', speaker: 'Thomas', status: 'delivered' },
        },
      ],
    });

    const result = await extractStructuredLore('prose');

    expect(result.events[0].continuity).toEqual({
      kind: 'assertion',
      topic: 'mill debt',
      speaker: 'Aunt Carol',
      status: undefined,
      fulfillment: undefined,
    });
    expect(result.events[1].continuity).toMatchObject({
      kind: 'commitment',
      status: 'delivered',
      fulfillment: undefined,
    });
  });

  it('parses durable and valid possession fulfillment metadata', async () => {
    respondWith({
      characters: [],
      locations: [],
      rules: [],
      events: [
        {
          description: 'The mayor confirms the city zoning permission is granted.',
          continuity: {
            kind: 'commitment',
            topic: 'zoning permission',
            speaker: 'Mayor Thorn',
            status: 'delivered',
            fulfillment: { kind: 'durable' },
          },
        },
        {
          description: 'Marcus hands over the cabin master key.',
          continuity: {
            kind: 'commitment',
            topic: 'cabin master key',
            speaker: 'Marcus',
            status: 'delivered',
            fulfillment: { kind: 'possession', itemId: 'key-101' },
          },
        },
      ],
    });

    const result = await extractStructuredLore('prose', undefined, {
      acquiredItems: [{ id: 'key-101', name: 'Cabin Master Key' }],
    });

    expect(result.events[0].continuity?.fulfillment).toEqual({ kind: 'durable' });
    expect(result.events[1].continuity?.fulfillment).toEqual({
      kind: 'possession',
      itemId: 'key-101',
    });
  });

  it('rejects unknown possession item IDs and degrades to unclassified fulfillment', async () => {
    respondWith({
      characters: [],
      locations: [],
      rules: [],
      events: [
        {
          description: 'Marcus hands over a mysterious key.',
          continuity: {
            kind: 'commitment',
            topic: 'cabin master key',
            speaker: 'Marcus',
            status: 'delivered',
            fulfillment: { kind: 'possession', itemId: 'unknown-id-999' },
          },
        },
      ],
    });

    const result = await extractStructuredLore('prose', undefined, {
      acquiredItems: [{ id: 'key-101', name: 'Cabin Master Key' }],
    });

    expect(result.events[0].continuity?.fulfillment).toBeUndefined();
  });

  it('drops annotations with an unknown kind or bad status', async () => {
    respondWith({
      characters: [],
      locations: [],
      rules: [],
      events: [
        { description: 'A', continuity: { kind: 'vibe', topic: 'x' } },
        { description: 'B', continuity: { kind: 'commitment', status: 'maybe' } },
        { description: 'C' },
      ],
    });

    const result = await extractStructuredLore('prose');

    expect(result.events[0].continuity).toBeUndefined();
    expect(result.events[1].continuity).toEqual({
      kind: 'commitment',
      topic: undefined,
      speaker: undefined,
      status: undefined,
      fulfillment: undefined,
    });
    expect(result.events[2].continuity).toBeUndefined();
  });

  it('feeds known continuity topics into the prompt so labels get reused', async () => {
    const generateContent = respondWith({ characters: [], locations: [], rules: [], events: [] });

    await extractStructuredLore('prose', undefined, {
      continuityTopics: ['mill debt', 'appraisal documents'],
      acquiredItems: [{ id: 'key-101', name: 'Master Key' }],
    });

    const prompt = generateContent.mock.calls[0][0] as string;
    expect(prompt).toContain('mill debt');
    expect(prompt).toContain('appraisal documents');
    expect(prompt).toContain('key-101');
    expect(prompt).toContain('Master Key');
    expect(prompt).toContain('"continuity"');
  });
});
