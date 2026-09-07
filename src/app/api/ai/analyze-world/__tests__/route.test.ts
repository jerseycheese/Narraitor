/**
 * @jest-environment node
 */

/**
 * The interesting behavior on this path is downstream of the model's string:
 * the analyzer recovers JSON out of fences or prose, then fills in the bounds
 * and base values the wizard needs, and falls back to a default set when none
 * of that works. The client is faked so all of that runs for real.
 *
 * `fetch` would be the wrong seam: `createDefaultGeminiClient` returns a canned
 * mock under the test runner, so nothing on this route ever reaches the
 * provider adapter.
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

const analyzeRequest = (body: unknown) =>
  buildAIRequest('/api/ai/analyze-world', body);

const ANALYSIS = {
  attributes: [
    { name: 'Grit', description: 'Endurance under pressure', category: 'Physical' },
    { name: 'Cunning', description: 'Reading a room', minValue: 2, maxValue: 8 },
  ],
  skills: [
    {
      name: 'Duelling',
      description: 'Formal single combat',
      difficulty: 'hard',
      linkedAttributeNames: ['Grit'],
    },
  ],
};

describe('POST /api/ai/analyze-world', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a blank description before calling the model', async () => {
    respondWith('{}');

    const response = await POST(analyzeRequest({ description: '   ' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('World description is required');
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('turns a fenced analysis into wizard-ready suggestions', async () => {
    respondWith('```json\n' + JSON.stringify(ANALYSIS) + '\n```');

    const response = await POST(
      analyzeRequest({ description: 'A duelling culture built on debt and honour.' })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.attributes).toEqual([
      {
        name: 'Grit',
        description: 'Endurance under pressure',
        // Bounds the model omitted are filled in, and the base value is the midpoint.
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
        category: 'Physical',
        accepted: true,
      },
      {
        name: 'Cunning',
        description: 'Reading a room',
        minValue: 2,
        maxValue: 8,
        baseValue: 5,
        category: undefined,
        accepted: true,
      },
    ]);
    expect(data.skills).toEqual([
      {
        name: 'Duelling',
        description: 'Formal single combat',
        difficulty: 'hard',
        category: undefined,
        linkedAttributeNames: ['Grit'],
        accepted: true,
        baseValue: 5,
        minValue: 1,
        maxValue: 10,
      },
    ]);
  });

  it('serves the default suggestion set when the model returns nothing usable', async () => {
    respondWith('I would rather not answer that.');

    const response = await POST(
      analyzeRequest({ description: 'A duelling culture built on debt and honour.' })
    );
    const data = await response.json();

    // The wizard always gets something to work with rather than an error page.
    expect(response.status).toBe(200);
    expect(data.attributes.map((a: { name: string }) => a.name)).toContain('Strength');
    expect(data.skills.map((s: { name: string }) => s.name)).toContain('Perception');
  });

  it('returns 500 when the body is not JSON', async () => {
    respondWith('{}');

    const response = await POST(analyzeRequest('{"description":'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to analyze world description');
    expect(mockCreateClient).not.toHaveBeenCalled();
  });
});
