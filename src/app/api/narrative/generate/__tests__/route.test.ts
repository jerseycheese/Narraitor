/**
 * @jest-environment node
 */

/**
 * The one route that streams, and the only place the produce side of the
 * NDJSON contract meets the consume side in `clientGeminiClient`. Only the
 * network is faked here: the real Gemini adapter builds the upstream body and
 * parses every frame, and the route's own encoder turns those frames into the
 * lines the browser reads.
 */

jest.mock('@/lib/telemetry/reportServerError');

import { POST } from '../route';
import {
  buildAIRequest,
  readNdjsonEvents,
  sentUpstreamBody,
  stubUpstreamStream,
  stubUpstreamFailure,
} from '../../../__tests__/routeHarness';
import {
  FLATTENED_METADATA_DUMP,
  geminiStreamFrames,
} from '../../../__tests__/fixtures/geminiPayloads';

const originalFetch = global.fetch;

function generateRequest(body: Record<string, unknown>) {
  return buildAIRequest('/api/narrative/generate', body);
}

describe('/api/narrative/generate', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('rejects a request with no prompt without reaching the provider', async () => {
    const upstream = stubUpstreamStream([]);

    const response = await POST(generateRequest({ config: {} }));

    expect(response.status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('rejects a request carrying no provider key', async () => {
    const upstream = stubUpstreamStream([]);

    const response = await POST(
      buildAIRequest('/api/narrative/generate', { prompt: 'Continue.' }, { withoutKey: true })
    );

    expect(response.status).toBe(412);
    expect(upstream).not.toHaveBeenCalled();
    const data = await response.json();
    expect(data.title).toBe('API Key Required');
    expect(data.error).toBe('No API key configured for this provider.');
  });

  it('sends a Gemini-shaped body built by the real adapter', async () => {
    const upstream = stubUpstreamStream(geminiStreamFrames(['{"content":"Hello"}']));

    await POST(generateRequest({ prompt: 'Continue the scene.' }));

    const [url] = upstream.mock.calls[0] as [string];
    expect(url).toContain(':streamGenerateContent');
    expect(url).toContain('alt=sse');

    const body = sentUpstreamBody(upstream) as {
      contents: Array<{ parts: Array<{ text: string }> }>;
      generationConfig: { maxOutputTokens: number };
      safetySettings: unknown[];
    };
    expect(body.contents[0].parts[0].text).toContain('Continue the scene.');
    expect(body.safetySettings).toHaveLength(4);
    // The route's own ceiling, not the shared 1024 default.
    expect(body.generationConfig.maxOutputTokens).toBe(2048);
  });

  it('answers NDJSON the client consumer can read line by line', async () => {
    stubUpstreamStream(
      geminiStreamFrames(['{"content":"The bridge ', 'held.","type":"scene"}'])
    );

    const response = await POST(generateRequest({ prompt: 'Continue.' }));

    expect(response.headers.get('Content-Type')).toContain('application/x-ndjson');

    const events = await readNdjsonEvents(response);
    const done = events.at(-1) as { done: boolean; content: string; finishReason: string };

    expect(done.done).toBe(true);
    expect(done.content).toBe('{"content":"The bridge held.","type":"scene"}');
    expect(done.finishReason).toBe('STOP');

    // The prose is revealed progressively rather than only at the end.
    const revealed = events
      .filter((event): event is { delta: string } => 'delta' in event)
      .map((event) => event.delta)
      .join('');
    expect(revealed).toBe('The bridge held.');
  });

  it('carries a flattened metadata dump through to the parse layer intact', async () => {
    stubUpstreamStream(geminiStreamFrames([FLATTENED_METADATA_DUMP]));

    const response = await POST(generateRequest({ prompt: 'Continue.' }));
    const events = await readNdjsonEvents(response);
    const done = events.at(-1) as { content: string };

    // The route must not mangle or truncate a response the parse layer knows
    // how to recover prose from — its job is delivery, not interpretation.
    expect(done.content).toBe(FLATTENED_METADATA_DUMP);
  });

  it('passes an upstream rate limit through as 429 without leaking the body', async () => {
    stubUpstreamFailure(429, 'Too Many Requests');

    const response = await POST(generateRequest({ prompt: 'Continue.' }));
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(JSON.stringify(data)).not.toContain('upstream detail');
  });
});
