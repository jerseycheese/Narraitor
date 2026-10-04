/**
 * @jest-environment node
 */

/**
 * The ending route owns three allowlists and a catch block that maps a thrown
 * message onto 404, 503 or 500 by substring. None of that had a test, and
 * substring-matched error mapping is the kind that breaks silently when a
 * message downstream is reworded.
 */

jest.mock('@/lib/ai/endingGenerator');
jest.mock('@/lib/telemetry/reportServerError');

import { POST, GET } from '../route';
import { generateEnding } from '@/lib/ai/endingGenerator';
import { buildAIRequest } from '../../../__tests__/routeHarness';

const mockGenerateEnding = generateEnding as jest.MockedFunction<typeof generateEnding>;

const VALID_BODY = {
  sessionId: 'session-1',
  characterId: 'char-1',
  worldId: 'world-1',
  endingType: 'story-complete',
};

function endingRequest(body: Record<string, unknown>) {
  return buildAIRequest('/api/narrative/ending', body);
}

describe('/api/narrative/ending', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateEnding.mockResolvedValue({
      epilogue: 'The road ended at the sea.',
      characterLegacy: 'Remembered for the crossing.',
      worldImpact: 'The bridge stayed open.',
      tone: 'hopeful',
      achievements: ['Crossed the bridge'],
      playTime: 42,
    } as never);
  });

  it('asks for a player key before generation', async () => {
    const response = await POST(buildAIRequest('/api/narrative/ending', VALID_BODY, { withoutKey: true }));
    expect(response.status).toBe(412);
    expect(await response.json()).toMatchObject({
      suggestion: 'Add your API key in Settings > Provider Setup to play.',
      retryable: false,
    });
    expect(mockGenerateEnding).not.toHaveBeenCalled();
  });

  it('returns 400 when provider configuration is invalid', async () => {
    const response = await POST(
      buildAIRequest('/api/narrative/ending', VALID_BODY, {
        headers: {
          'x-provider-type': 'unsupported-type',
        },
      })
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.title).toBe('Check Your Input');
    expect(data.error).toBe("Some of what you entered doesn't look right.");
    expect(mockGenerateEnding).not.toHaveBeenCalled();
  });

  it('rejects a body missing required ids without generating', async () => {
    const response = await POST(endingRequest({ endingType: 'story-complete' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('sessionId');
    expect(mockGenerateEnding).not.toHaveBeenCalled();
  });

  it('rejects an ending type outside the allowlist', async () => {
    const response = await POST(
      endingRequest({ ...VALID_BODY, endingType: 'player-gave-up' })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid ending type');
    expect(mockGenerateEnding).not.toHaveBeenCalled();
  });

  it('rejects a tone outside the allowlist', async () => {
    const response = await POST(
      endingRequest({ ...VALID_BODY, desiredTone: 'bittersweet' })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid tone');
  });

  it('returns the generated ending on the happy path', async () => {
    const response = await POST(endingRequest(VALID_BODY));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.epilogue).toBe('The road ended at the sea.');
  });

  it('maps a provider failure to 503 rather than a generic 500', async () => {
    mockGenerateEnding.mockRejectedValue(new Error('API request failed'));

    const response = await POST(endingRequest(VALID_BODY));
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Model provider unavailable');
  });

  it('maps a missing resource to 404 and anything else to 500', async () => {
    mockGenerateEnding.mockRejectedValue(new Error('session not found'));
    const notFound = await POST(endingRequest(VALID_BODY));
    expect(notFound.status).toBe(404);

    mockGenerateEnding.mockRejectedValue(new Error('something else broke'));
    const serverError = await POST(endingRequest(VALID_BODY));
    expect(serverError.status).toBe(500);
  });

  it('refuses GET', async () => {
    const response = await GET();
    expect(response.status).toBe(405);
  });
});
