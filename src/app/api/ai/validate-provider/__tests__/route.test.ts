/**
 * @jest-environment node
 */

jest.mock('@/utils/apiHelpers', () => ({
  makeGeminiRequest: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { makeGeminiRequest } from '@/utils/apiHelpers';

const mockMakeGeminiRequest = makeGeminiRequest as jest.MockedFunction<typeof makeGeminiRequest>;

const URL = 'http://localhost:3000/api/ai/validate-provider';
const KEY = 'AIza-candidate-key';

function buildRequest(opts: { key?: string; body?: unknown } = {}): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.key) headers['x-provider-api-key'] = opts.key;
  return new NextRequest(URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(opts.body ?? { type: 'gemini', model: 'gemini-2.5-flash' }),
  });
}

function fakeResponse(status: number, body: unknown = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/ai/validate-provider', () => {
  test('rejects when no key header is present', async () => {
    const response = await POST(buildRequest({ key: undefined }));
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toBe('NO_KEY');
    expect(mockMakeGeminiRequest).not.toHaveBeenCalled();
  });

  test('reports valid for a working key and never echoes it', async () => {
    mockMakeGeminiRequest.mockResolvedValue(fakeResponse(200));

    const response = await POST(buildRequest({ key: KEY }));
    const data = await response.json();

    expect(data.valid).toBe(true);
    expect(data.capabilities).toEqual({ text: true, images: true, streaming: true });
    // The candidate key flows to the upstream call as the second arg...
    expect(mockMakeGeminiRequest).toHaveBeenCalledWith(
      expect.stringContaining('gemini-2.5-flash'),
      KEY,
      expect.any(Object),
      expect.any(Number)
    );
    // ...but never leaks into the response.
    expect(JSON.stringify(data)).not.toContain(KEY);
  });

  test('maps a 401 to INVALID_KEY', async () => {
    mockMakeGeminiRequest.mockResolvedValue(fakeResponse(401));

    const response = await POST(buildRequest({ key: KEY }));
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toBe('INVALID_KEY');
  });

  test('maps Google 400 "API key not valid" to INVALID_KEY', async () => {
    // Gemini returns 400 INVALID_ARGUMENT (not 401) for a bad key.
    mockMakeGeminiRequest.mockResolvedValue(
      fakeResponse(400, {
        error: { status: 'INVALID_ARGUMENT', message: 'API key not valid. Please pass a valid API key.' },
      })
    );

    const response = await POST(buildRequest({ key: KEY }));
    const data = await response.json();

    expect(data.error).toBe('INVALID_KEY');
  });

  test('maps a 429 to RATE_LIMITED', async () => {
    mockMakeGeminiRequest.mockResolvedValue(fakeResponse(429));

    const response = await POST(buildRequest({ key: KEY }));
    const data = await response.json();

    expect(data.error).toBe('RATE_LIMITED');
  });

  test('rejects a provider type with no adapter without calling upstream', async () => {
    // Anthropic's own API is not OpenAI-shaped and has no adapter; reaching
    // Claude through OpenRouter is an `openai-compatible` provider instead.
    const response = await POST(buildRequest({ key: KEY, body: { type: 'claude' } }));
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toBe('UNSUPPORTED_PROVIDER');
    expect(mockMakeGeminiRequest).not.toHaveBeenCalled();
  });
});

describe('POST /api/ai/validate-provider — OpenAI-compatible providers', () => {
  const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  function openAIRequest(body: Record<string, unknown>) {
    return buildRequest({ key: KEY, body: { type: 'openai-compatible', ...body } });
  }

  test('validates through the provider abstraction instead of rejecting outright', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(200));

    const response = await POST(openAIRequest({ endpoint: ENDPOINT, model: 'openai/gpt-4o' }));
    const data = await response.json();

    expect(data.valid).toBe(true);
    expect(data.model).toBe('openai/gpt-4o');
    // Images are Gemini-only for now, and the registry says so.
    expect(data.capabilities).toEqual({ text: true, images: false, streaming: true });
    expect(global.fetch).toHaveBeenCalledWith(
      ENDPOINT,
      expect.objectContaining({ method: 'POST' })
    );
    expect(JSON.stringify(data)).not.toContain(KEY);
  });

  test('sends the key as a bearer token and never in the URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(200));

    await POST(openAIRequest({ endpoint: ENDPOINT, model: 'openai/gpt-4o' }));

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).not.toContain(KEY);
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${KEY}`);
  });

  test('refuses an endpoint the server should never dereference', async () => {
    const response = await POST(
      openAIRequest({ endpoint: 'http://169.254.169.254/latest/meta-data', model: 'gpt-4o' })
    );
    const data = await response.json();

    expect(data.error).toBe('INVALID_ENDPOINT');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('maps a 401 to INVALID_KEY', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(401));

    const response = await POST(openAIRequest({ endpoint: ENDPOINT, model: 'openai/gpt-4o' }));

    expect((await response.json()).error).toBe('INVALID_KEY');
  });

  test('maps a 400 naming the model to INVALID_MODEL', async () => {
    // OpenRouter and Together answer 400 for an unknown model where OpenAI 404s.
    (global.fetch as jest.Mock).mockResolvedValue(
      fakeResponse(400, { error: { message: 'No endpoints found for model nope/nope-1.' } })
    );

    const response = await POST(openAIRequest({ endpoint: ENDPOINT, model: 'nope/nope-1' }));

    expect((await response.json()).error).toBe('INVALID_MODEL');
  });
});
