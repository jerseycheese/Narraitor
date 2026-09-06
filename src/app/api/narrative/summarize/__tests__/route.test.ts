/**
 * @jest-environment node
 */

/**
 * The route's own job is everything that happens to the model's string after it
 * arrives: stripping fences, trimming to the outermost braces, validating the
 * structure, and falling back when none of that works. That logic is what these
 * tests drive, so the client is faked above it — the provider path underneath is
 * covered by the provider suites and apiHelpers' own tests.
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

function summarizeRequest(body: Record<string, unknown>) {
  return buildAIRequest('/api/narrative/summarize', body);
}

const VALID_BODY = {
  content: 'She crossed the bridge and the lantern went out behind her.',
  type: 'scene',
  instructions: 'Summarize this.',
};

describe('/api/narrative/summarize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a request with no content before calling the model', async () => {
    respondWith('{}');

    const response = await POST(summarizeRequest({ type: 'scene' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Content is required');
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('reads a summary out of a fenced json response', async () => {
    respondWith(
      '```json\n{"summary":"I crossed the bridge","entryType":"discovery","significance":"major"}\n```'
    );

    const response = await POST(summarizeRequest(VALID_BODY));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      // The route appends terminal punctuation when the model omits it.
      summary: 'I crossed the bridge.',
      entryType: 'discovery',
      significance: 'major',
    });
  });

  it('reads a summary out of a response wrapped in prose on both sides', async () => {
    respondWith(
      'Here is the JSON you asked for:\n{"summary":"The lantern went out.","entryType":"world_event","significance":"minor"}\nLet me know if you need more.'
    );

    const response = await POST(summarizeRequest(VALID_BODY));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary).toBe('The lantern went out.');
    expect(data.entryType).toBe('world_event');
  });

  it('replaces an entryType and significance outside the taxonomy with defaults', async () => {
    respondWith(
      '{"summary":"Something happened.","entryType":"invented_category","significance":"catastrophic"}'
    );

    const response = await POST(summarizeRequest(VALID_BODY));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.entryType).toBe('character_event');
    expect(data.significance).toBe('minor');
  });

  it('falls back to the raw text and the decision weight when the structure is incomplete', async () => {
    respondWith('{"summary":"I crossed the bridge","entryType":"discovery"}');

    const response = await POST(
      summarizeRequest({ ...VALID_BODY, decisionWeight: 'critical' })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.entryType).toBe('character_event');
    // The weight the caller declared, not the hardcoded floor.
    expect(data.significance).toBe('critical');
  });

  it('returns 500 when the model produces nothing', async () => {
    respondWith('');

    const response = await POST(summarizeRequest(VALID_BODY));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to generate summary');
  });
});
