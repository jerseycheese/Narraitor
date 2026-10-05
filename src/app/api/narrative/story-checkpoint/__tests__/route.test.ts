/**
 * @jest-environment node
 */

jest.mock('@/lib/ai/storyCheckpointGenerator');

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { generateStoryCheckpointSummary } from '@/lib/ai/storyCheckpointGenerator';

const mockGenerateStoryCheckpointSummary = generateStoryCheckpointSummary as jest.MockedFunction<typeof generateStoryCheckpointSummary>;

const originalGeminiKey = process.env.GEMINI_API_KEY;
afterEach(() => {
  if (originalGeminiKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = originalGeminiKey;
  }
});

describe('/api/narrative/story-checkpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const buildRequest = (body: Record<string, unknown>, headers: Record<string, string> = {
    'x-provider-api-key': 'openrouter-key',
    'x-provider-type': 'openai-compatible',
    'x-provider-endpoint': 'https://openrouter.ai/api/v1/chat/completions',
    'x-provider-model': '~deepseek/deepseek-flash-latest',
  }) =>
    new NextRequest('http://localhost:3000/api/narrative/story-checkpoint', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

  it('returns 400 when required ids are missing', async () => {
    const response = await POST(buildRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('worldId');
  });

  it('returns 400 when no events provided', async () => {
    const response = await POST(
      buildRequest({
        worldId: 'world-1',
        sessionId: 'session-1',
        events: [],
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('At least one major event');
  });

  it('returns summary payload from generator', async () => {
    const summary = {
      summary: 'Recap',
      highlights: ['Highlight'],
      majorEvents: ['Event'],
      includedEvents: 1,
      includedDecisions: 0,
      lastEventTimestamp: '2025-11-20T18:00:00Z',
      model: 'gemini-test',
    };
    mockGenerateStoryCheckpointSummary.mockResolvedValue(summary as never);

    const response = await POST(
      buildRequest({
        worldId: 'world-1',
        sessionId: 'session-1',
        characterId: 'char-1',
        events: [
          {
            id: 'event-1',
            description: 'Saved the village',
            timestamp: '2025-11-20T18:00:00Z',
          },
        ],
      }),
    );

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.summary).toBe('Recap');
    expect(mockGenerateStoryCheckpointSummary).toHaveBeenCalledWith(
      expect.objectContaining({ worldId: 'world-1', sessionId: 'session-1' }),
      expect.objectContaining({ type: 'openai-compatible', model: '~deepseek/deepseek-flash-latest' }),
      '~deepseek/deepseek-flash-latest'
    );
  });

  it('accepts chapter context and returns its recap with the flag on', async () => {
    process.env.NEXT_PUBLIC_FEATURE_CHAPTERS = 'true';
    const chapterRecap = 'Previously: Saved the village.\nWhere it stopped: Gate.\nCast: Maera: alive.\nHolding: Seal.\nOpen threads: Find the council.';
    mockGenerateStoryCheckpointSummary.mockResolvedValue({ chapterRecap } as never);
    const response = await POST(buildRequest({
      worldId: 'world-1', sessionId: 'session-1', mode: 'chapter',
      events: [{ id: 'event-1', description: 'Saved the village', timestamp: '2025-11-20T18:00:00Z' }],
      cast: ['Maera: alive'], holding: ['Seal'], openThreads: ['Find the council'],
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ chapterRecap });
    expect(mockGenerateStoryCheckpointSummary).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'chapter', cast: ['Maera: alive'], holding: ['Seal'], openThreads: ['Find the council'] }),
      expect.anything(), expect.anything(),
    );
    delete process.env.NEXT_PUBLIC_FEATURE_CHAPTERS;
  });

  it('asks for a player key even when the server has a Gemini key', async () => {
    process.env.GEMINI_API_KEY = 'env-key';
    const response = await POST(buildRequest({
      worldId: 'world-1',
      sessionId: 'session-1',
      events: [{ id: 'event-1', description: 'Saved the village', timestamp: '2025-11-20T18:00:00Z' }],
    }, {}));
    expect(response.status).toBe(412);
    expect(await response.json()).toMatchObject({
      suggestion: 'Add your API key in Settings > Provider Setup to play.',
      retryable: false,
    });
    expect(mockGenerateStoryCheckpointSummary).not.toHaveBeenCalled();
  });

  it('returns 400 when provider endpoint is invalid', async () => {
    const response = await POST(buildRequest({
      worldId: 'world-1',
      sessionId: 'session-1',
      events: [{ id: 'event-1', description: 'Saved the village', timestamp: '2025-11-20T18:00:00Z' }],
    }, {
      'x-provider-api-key': 'openrouter-key',
      'x-provider-type': 'openai-compatible',
      'x-provider-endpoint': 'http://insecure-endpoint.local',
      'x-provider-model': '~deepseek/deepseek-flash-latest',
    }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.title).toBe('Check Your Input');
    expect(data.error).toBe("Some of what you entered doesn't look right.");
    expect(mockGenerateStoryCheckpointSummary).not.toHaveBeenCalled();
  });

  it('handles generator failures with 500', async () => {
    mockGenerateStoryCheckpointSummary.mockRejectedValue(new Error('Gemini unavailable'));

    const response = await POST(
      buildRequest({
        worldId: 'world-1',
        sessionId: 'session-1',
        events: [
          {
            id: 'event-1',
            description: 'Saved the village',
            timestamp: '2025-11-20T18:00:00Z',
          },
        ],
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to generate checkpoint summary.');
  });
});
