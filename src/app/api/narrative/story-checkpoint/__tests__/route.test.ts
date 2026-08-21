/**
 * @jest-environment node
 */

jest.mock('@/lib/ai/storyCheckpointGenerator');

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { generateStoryCheckpointSummary } from '@/lib/ai/storyCheckpointGenerator';

const mockGenerateStoryCheckpointSummary = generateStoryCheckpointSummary as jest.MockedFunction<typeof generateStoryCheckpointSummary>;

describe('/api/narrative/story-checkpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const buildRequest = (body: Record<string, unknown>) =>
    new NextRequest('http://localhost:3000/api/narrative/story-checkpoint', {
      method: 'POST',
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
    // The route forwards a resolved provider descriptor, not a key and a model.
    // Null here because the test env pins GEMINI_API_KEY to the MOCK sentinel.
    expect(mockGenerateStoryCheckpointSummary).toHaveBeenCalledWith(
      expect.objectContaining({ worldId: 'world-1', sessionId: 'session-1' }),
      null
    );
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
    expect(data.error).toContain('Gemini unavailable');
  });
});
