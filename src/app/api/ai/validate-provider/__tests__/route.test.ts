/**
 * @jest-environment node
 */

jest.mock('@/utils/apiHelpers', () => {
  const actual = jest.requireActual('@/utils/apiHelpers');
  return {
    ...actual,
    makeGeminiRequest: jest.fn(),
  };
});

jest.mock('@/utils/rateLimiter', () => ({
  globalRateLimiter: {
    checkLimit: jest.fn(() => ({
      allowed: true,
      remaining: 50,
      resetTime: Date.now() + 3600000,
    })),
  },
  RateLimiter: {
    getErrorMessage: jest.fn(() => 'Rate limit exceeded'),
  },
}));

// The endpoint guard resolves the hostname before any player-supplied URL is
// fetched. Pinned to a public address here so these stay unit tests rather than
// quietly depending on DNS.
jest.mock('node:dns/promises', () => ({
  lookup: jest.fn(async () => [{ address: '104.18.0.1', family: 4 }]),
}));

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { makeGeminiRequest } from '@/utils/apiHelpers';
import { globalRateLimiter } from '@/utils/rateLimiter';
import { lookup } from 'node:dns/promises';

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
  /**
   * This route dereferences a URL the caller names and reports whether that
   * host answered. Unmetered it is a request forwarder with a reachability
   * oracle, so the limit has to come before anything else the route does.
   */
  test('stops at the rate limit before dereferencing anything', async () => {
    (globalRateLimiter.checkLimit as jest.Mock).mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
    });

    const response = await POST(buildRequest({ key: KEY }));

    expect(response.status).toBe(429);
    expect(mockMakeGeminiRequest).not.toHaveBeenCalled();
  });

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
    // resetAllMocks in afterEach strips the module mock's implementation too.
    (lookup as jest.Mock).mockResolvedValue([{ address: '104.18.0.1', family: 4 }]);
    (globalRateLimiter.checkLimit as jest.Mock).mockReturnValue({
      allowed: true,
      remaining: 50,
      resetTime: Date.now() + 3600000,
    });
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

  test("sends the preset's declared headers on the validation ping too", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(200));

    await POST(openAIRequest({ endpoint: ENDPOINT, model: 'openai/gpt-4o' }));

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const headers = init.headers as Record<string, string>;
    // A service that requires its headers would otherwise fail verification
    // while generating fine, since only the generation path supplied them.
    expect(headers['HTTP-Referer']).toBe('https://narraitor-six.vercel.app');
    expect(headers['X-OpenRouter-Title']).toBe('Narraitor');
    expect(headers.Authorization).toBe(`Bearer ${KEY}`);
  });

  test("names the output cap the way the generation path does, not always max_tokens", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(200));

    await POST(
      openAIRequest({
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-5.6-luna',
      })
    );

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body as string);
    // Hardcoding max_tokens here made the wizard reject a key that generates
    // fine, so the provider looked enabled and could never be configured.
    expect(body).not.toHaveProperty('max_tokens');
    expect(body.max_completion_tokens).toBeGreaterThan(0);
  });

  test('still says max_tokens for a service that never renamed it', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(200));

    await POST(openAIRequest({ endpoint: ENDPOINT, model: 'openai/gpt-4o' }));

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.max_tokens).toBeGreaterThan(0);
    expect(body).not.toHaveProperty('max_completion_tokens');
  });

  test('sends no extra headers for an endpoint no preset claims', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(200));

    await POST(
      openAIRequest({ endpoint: 'https://api.example.com/v1/chat/completions', model: 'some-model' })
    );

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers as Record<string, string>).not.toHaveProperty('HTTP-Referer');
  });

  test('refuses a public hostname that resolves to a private address', async () => {
    // The string check passes — this is the DNS-level bypass it cannot catch.
    (lookup as jest.Mock).mockResolvedValueOnce([{ address: '169.254.169.254', family: 4 }]);

    const response = await POST(openAIRequest({ endpoint: ENDPOINT, model: 'openai/gpt-4o' }));

    expect((await response.json()).error).toBe('NETWORK');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('refuses to follow a redirect, which would sidestep the guard entirely', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(fakeResponse(200));

    await POST(openAIRequest({ endpoint: ENDPOINT, model: 'openai/gpt-4o' }));

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.redirect).toBe('error');
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
