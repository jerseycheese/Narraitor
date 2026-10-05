/**
 * @jest-environment node
 */

jest.mock('@/lib/ai/defaultGeminiClient');

import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { generateStoryCheckpointSummary } from '../storyCheckpointGenerator';
import type { StoryCheckpointRequestBody } from '@/types/story-checkpoint.types';

const mockCreateDefaultGeminiClient = createDefaultGeminiClient as jest.MockedFunction<typeof createDefaultGeminiClient>;

const basePayload: StoryCheckpointRequestBody = {
  worldId: 'world-1',
  sessionId: 'session-1',
  characterId: 'char-1',
  events: [
    {
      id: 'event-1',
      description: 'Maera dissolved the council',
      timestamp: '2025-11-20T18:00:00Z',
      characterId: 'char-1',
      characterName: 'Maera',
      sessionId: 'session-1',
    },
  ],
  decisions: [
    {
      id: 'decision-1',
      text: 'Demand Maera step down',
      consequence: 'Guard loyalty fractured',
      alignment: 'chaotic',
    },
  ],
};

describe('generateStoryCheckpointSummary', () => {
  const mockClient = {
    generateContent: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateDefaultGeminiClient.mockReturnValue(mockClient as never);
  });

  it('parses structured JSON from Gemini responses', async () => {
    mockClient.generateContent.mockResolvedValue({
      content: JSON.stringify({
        segment: 'Maera disbanded the council, forcing the player underground.',
        highlights: ['Council dissolved', 'Royal guard split'],
        majorEvents: ['Maera disbands the council'],
        includedEvents: 1,
        includedDecisions: 1,
        lastEventTimestamp: '2025-11-20T18:00:00Z',
        // Stale value the prompt example used to teach the model to echo (#1430 F37).
        model: 'gemini-1.5-pro',
      }),
    });

    const result = await generateStoryCheckpointSummary(basePayload);

    expect(result.segment).toContain('Maera disbanded the council');
    expect(result.highlights).toEqual(['Council dissolved', 'Royal guard split']);
    expect(result.majorEvents).toEqual(['Maera disbands the council']);
    // Records the model the default client actually runs on, not the AI echo.
    expect(result.model).toBe('gemini-2.5-flash');
    expect(mockClient.generateContent).toHaveBeenCalledTimes(1);
  });

  it('falls back to concatenated events when response cannot be parsed', async () => {
    mockClient.generateContent.mockResolvedValue({ content: 'not json at all' });

    const result = await generateStoryCheckpointSummary(basePayload);

    expect(result.segment).toContain('Maera dissolved the council');
    expect(result.highlights).toHaveLength(1);
    expect(result.majorEvents).toEqual(['Maera dissolved the council']);
    expect(result.model).toBe('fallback');
  });
});


describe('chapter recap', () => {
  const generateContent = jest.fn();
  beforeEach(() => {
    generateContent.mockClear();
    mockCreateDefaultGeminiClient.mockReturnValue({ generateContent } as never);
    process.env.NEXT_PUBLIC_FEATURE_CHAPTERS = 'true';
  });
  afterEach(() => { delete process.env.NEXT_PUBLIC_FEATURE_CHAPTERS; });

  it('returns five labeled bounded lines from one provider request', async () => {
    generateContent.mockResolvedValue({ content: JSON.stringify({ recap: {
      previously: 'The council fell. '.repeat(100), whereItStopped: 'At the gate.',
      cast: 'Maera: missing.', holding: 'Council seal.', openThreads: 'Find Maera.',
    } }) });
    const result = await generateStoryCheckpointSummary({ ...basePayload, mode: 'chapter' });
    expect(result.chapterRecap?.split('\n').map(line => line.split(':')[0])).toEqual([
      'Previously', 'Where it stopped', 'Cast', 'Holding', 'Open threads',
    ]);
    expect(result.chapterRecap?.length).toBeLessThanOrEqual(850);
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it('uses canon for a malformed response without making a second request', async () => {
    generateContent.mockResolvedValue({ content: 'not json' });
    const result = await generateStoryCheckpointSummary({ ...basePayload, mode: 'chapter', holding: ['Council seal'] });
    expect(result.chapterRecap).toContain('Previously: Maera dissolved the council');
    expect(result.chapterRecap).toContain('Holding: Council seal');
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
});
