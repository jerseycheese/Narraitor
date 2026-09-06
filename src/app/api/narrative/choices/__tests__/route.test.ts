/**
 * @jest-environment node
 */

/**
 * The non-streaming half of the loop. Same seam as the generate route — only
 * the network is faked — so the adapter's parseTextResponse runs for real,
 * including the two ways a 200 can still be unusable.
 */

jest.mock('@/lib/telemetry/reportServerError');

import { POST } from '../route';
import {
  buildAIRequest,
  sentUpstreamBody,
  stubUpstreamJson,
  stubUpstreamFailure,
} from '../../../__tests__/routeHarness';
import {
  GEMINI_REFUSAL_PAYLOAD,
  geminiTextPayload,
} from '../../../__tests__/fixtures/geminiPayloads';

const originalFetch = global.fetch;

const CHOICES_JSON = '{"choices":[{"text":"Cross the bridge"},{"text":"Turn back"}]}';

function choicesRequest(body: Record<string, unknown>) {
  return buildAIRequest('/api/narrative/choices', body);
}

describe('/api/narrative/choices', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('returns the parsed content and token counts on the happy path', async () => {
    stubUpstreamJson(geminiTextPayload(CHOICES_JSON));

    const response = await POST(choicesRequest({ prompt: 'Offer choices.' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.content).toBe(CHOICES_JSON);
    expect(data.finishReason).toBe('STOP');
    expect(data.promptTokens).toBe(128);
  });

  it('asks the non-streaming endpoint and clamps to the route ceiling', async () => {
    const upstream = stubUpstreamJson(geminiTextPayload(CHOICES_JSON));

    await POST(choicesRequest({ prompt: 'Offer choices.', config: { maxTokens: 99999 } }));

    const [url] = upstream.mock.calls[0] as [string];
    expect(url).toContain(':generateContent');
    expect(url).not.toContain('alt=sse');

    const body = sentUpstreamBody(upstream) as {
      generationConfig: { maxOutputTokens: number };
    };
    expect(body.generationConfig.maxOutputTokens).toBe(2048);
  });

  it('reports a refusal as a server error rather than empty choices', async () => {
    stubUpstreamJson(GEMINI_REFUSAL_PAYLOAD);

    const response = await POST(choicesRequest({ prompt: 'Offer choices.' }));

    expect(response.status).toBe(500);
  });

  it('passes an upstream auth failure through as 401 without leaking the body', async () => {
    stubUpstreamFailure(401, 'Unauthorized');

    const response = await POST(choicesRequest({ prompt: 'Offer choices.' }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(JSON.stringify(data)).not.toContain('upstream detail');
  });

  it('rejects a request with no prompt without reaching the provider', async () => {
    const upstream = stubUpstreamJson(geminiTextPayload(CHOICES_JSON));

    const response = await POST(choicesRequest({}));

    expect(response.status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });
});
