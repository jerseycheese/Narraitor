/**
 * @jest-environment node
 */

/**
 * The route's own work is everything that happens to the model's string after
 * it arrives — recovering the JSON out of whatever prose surrounds it, and
 * filling in defaults when a field is missing — plus the exact-match
 * short-circuit that answers without asking the model at all. So the client is
 * faked and the shared handler runs for real.
 *
 * Faking `fetch` instead would prove nothing here: `createDefaultGeminiClient`
 * hands back a canned mock under the test runner, so no request ever reaches
 * the provider adapter on this path.
 */

jest.mock('@/lib/ai/defaultGeminiClient');

import { POST } from '../route';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { buildAIRequest } from '../../../__tests__/routeHarness';

const mockCreateClient = createDefaultGeminiClient as jest.MockedFunction<
  typeof createDefaultGeminiClient
>;

function respondWith(content: string) {
  mockCreateClient.mockReturnValue({
    generateContent: jest.fn().mockResolvedValue({ content }),
  } as unknown as ReturnType<typeof createDefaultGeminiClient>);
}

const similarityRequest = (body: unknown) =>
  buildAIRequest('/api/inventory/check-similarity', body);

describe('POST /api/inventory/check-similarity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a request missing one of the names before calling the model', async () => {
    respondWith('{}');

    const response = await POST(similarityRequest({ name1: 'Iron Sword' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Both name1 and name2 are required');
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('answers an exact match without spending a model call', async () => {
    respondWith('{}');

    const response = await POST(
      similarityRequest({ name1: 'Iron Sword', name2: '  iron sword  ' })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      similar: true,
      confidence: 1.0,
      rationale: 'Exact match',
    });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('reads the verdict out of a response wrapped in prose', async () => {
    respondWith(
      'Sure, here you go:\n{"similar": true, "confidence": 0.92, "rationale": "Both name the same blade"}\nHope that helps.'
    );

    const response = await POST(
      similarityRequest({ name1: 'Rusty Iron Sword', name2: 'Iron Sword' })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      similar: true,
      confidence: 0.92,
      rationale: 'Both name the same blade',
    });
  });

  it('falls back to not-similar when the model returns no JSON at all', async () => {
    respondWith('They look about the same to me.');

    const response = await POST(
      similarityRequest({ name1: 'Gold Coins', name2: 'Silver Coins' })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.similar).toBe(false);
    expect(data.confidence).toBe(0.0);
    expect(data.rationale).toBe('Could not parse AI response');
  });

  it('returns 500 when the body is not JSON', async () => {
    respondWith('{}');

    const response = await POST(similarityRequest('{"name1": "Iron Sword",'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to check item similarity');
  });
});
