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
        summary: 'Maera disbands the council, forcing the player underground.',
        highlights: ['Council dissolved', 'Royal guard split'],
        majorEvents: ['Maera disbands the council'],
        characterDevelopment: ['Player now leads a resistance cell'],
        nextHooks: ['Secure funding'],
        themes: ['Desperation'],
        includedEvents: 1,
        includedDecisions: 1,
        lastEventTimestamp: '2025-11-20T18:00:00Z',
        model: 'gemini-test',
      }),
    });

    const result = await generateStoryCheckpointSummary(basePayload);

    expect(result.summary).toContain('Maera disbands the council');
    expect(result.highlights).toEqual(['Council dissolved', 'Royal guard split']);
    expect(result.majorEvents).toEqual(['Maera disbands the council']);
    expect(result.model).toBe('gemini-test');
    expect(mockClient.generateContent).toHaveBeenCalledTimes(1);
  });

  it('falls back to concatenated events when response cannot be parsed', async () => {
    mockClient.generateContent.mockResolvedValue({ content: 'not json at all' });

    const result = await generateStoryCheckpointSummary(basePayload);

    expect(result.summary).toContain('Maera dissolved the council');
    expect(result.highlights).toHaveLength(1);
    expect(result.majorEvents).toEqual(['Maera dissolved the council']);
    expect(result.model).toBe('fallback');
  });
});
