const mockJson = jest.fn((body: unknown, init?: { status?: number; headers?: Record<string, string> }) => {
  const headers = new Headers(init?.headers);
  return {
    status: init?.status ?? 200,
    headers,
    json: async () => body,
  };
});

// Mock Next.js modules
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) =>
      mockJson(body, init),
  },
}));

jest.mock('../rateLimiter', () => ({
  globalRateLimiter: {
    checkLimit: jest.fn(() => ({ allowed: true, remaining: 50, resetTime: Date.now() + 3600000 }))
  },
  RateLimiter: {
    getErrorMessage: jest.fn(() => 'Rate limit exceeded')
  }
}));

import {
  makeGeminiRequest,
  processAITextRequest,
  processAIStreamingTextRequest,
  withAIRoute,
  MAX_AI_BODY_BYTES,
} from '../apiHelpers';
import { DEFAULT_TEXT_MODEL, getAIConfig } from '../../lib/ai/config';
import { GEMINI_ATTEMPT_TIMEOUT_MS } from '../../lib/constants/aiTimeouts';
import { PROVIDER_API_KEY_HEADER, PROVIDER_MODEL_HEADER } from '../../lib/ai/providerKeyHeader';
import { globalRateLimiter } from '../rateLimiter';
import { NextResponse, type NextRequest } from 'next/server';

function resetDefaultMocks() {
  mockJson.mockImplementation((body: unknown, init?: { status?: number; headers?: Record<string, string> }) => {
    const headers = new Headers(init?.headers);
    return {
      status: init?.status ?? 200,
      headers,
      json: async () => body,
    };
  });
  (globalRateLimiter.checkLimit as jest.Mock).mockReturnValue({
    allowed: true,
    remaining: 50,
    resetTime: Date.now() + 3600000,
  });
}

describe('makeGeminiRequest', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('uses configured text model name in request URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({}) });

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${getAIConfig().modelName}:generateContent`;
    await makeGeminiRequest(endpoint, 'test-key', {});

    expect(global.fetch).toHaveBeenCalledWith(endpoint, expect.any(Object));
  });

  it('rejects at the shared single-attempt budget when the upstream hangs', async () => {
    jest.useFakeTimers();
    try {
      // Hang forever, but honor the abort signal like a real fetch would.
      (global.fetch as jest.Mock).mockImplementation(
        (_endpoint: string, init: RequestInit) =>
          new Promise((_, reject) => {
            init.signal?.addEventListener('abort', () =>
              reject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }))
            );
          })
      );

      const pending = makeGeminiRequest('https://example.test/gemini', 'test-key', {});
      const outcome = expect(pending).rejects.toThrow('Request timeout - please try again');

      // Still in-flight just before the 30s budget…
      jest.advanceTimersByTime(GEMINI_ATTEMPT_TIMEOUT_MS - 1);
      // …and aborted the moment it elapses.
      jest.advanceTimersByTime(1);

      await outcome;
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('processAIStreamingTextRequest', () => {
  function fakeRequest(body: unknown, headerKey?: string, headerModel?: string): NextRequest {
    const headers: Record<string, string | undefined> = {
      [PROVIDER_API_KEY_HEADER]: headerKey,
      [PROVIDER_MODEL_HEADER]: headerModel,
    };
    return {
      headers: { get: (name: string) => headers[name] ?? null },
      json: async () => body,
    } as unknown as NextRequest;
  }

  beforeEach(() => {
    global.fetch = jest.fn();
    resetDefaultMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('rejects a request with no prompt before ever calling Gemini', async () => {
    await processAIStreamingTextRequest(fakeRequest({}), { errorContext: 'Test' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('errors without calling Gemini when no API key resolves', async () => {
    // No header key, and jest.setup.ts pins GEMINI_API_KEY to the MOCK_API_KEY
    // sentinel, which resolveApiKey treats as unset.
    await processAIStreamingTextRequest(fakeRequest({ prompt: 'hello' }), { errorContext: 'Test' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('surfaces an upstream non-ok response as an error instead of streaming', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: async () => 'rate limited upstream',
    });

    await processAIStreamingTextRequest(
      fakeRequest({ prompt: 'hello' }, 'player-supplied-key'),
      { errorContext: 'Test' }
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(':streamGenerateContent?alt=sse'),
      expect.any(Object)
    );
    expect(mockJson).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ status: 429 })
    );
  });

  it('generates with the model the player configured', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      text: async () => 'upstream boom',
    });

    await processAIStreamingTextRequest(
      fakeRequest({ prompt: 'hello' }, 'player-supplied-key', 'gemini-2.5-pro'),
      { errorContext: 'Test' }
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/models/gemini-2.5-pro:streamGenerateContent'),
      expect.any(Object)
    );
  });

  it('generates with the default model when none is configured', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      text: async () => 'upstream boom',
    });

    await processAIStreamingTextRequest(
      fakeRequest({ prompt: 'hello' }, 'player-supplied-key'),
      { errorContext: 'Test' }
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/models/${DEFAULT_TEXT_MODEL}:streamGenerateContent`),
      expect.any(Object)
    );
  });
});

describe('withAIRoute', () => {
  beforeEach(() => {
    resetDefaultMocks();
    (globalRateLimiter.checkLimit as jest.Mock).mockReturnValue({
      allowed: true,
      remaining: 49,
      resetTime: Date.now() + 3600000,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  function createMockRequest(options: {
    contentLength?: string;
    bodyBuffer?: ArrayBuffer;
    headers?: Record<string, string>;
  }): NextRequest {
    const headersMap = new Map<string, string>(Object.entries(options.headers || {}));
    if (options.contentLength) {
      headersMap.set('content-length', options.contentLength);
    }
    const buffer = options.bodyBuffer ?? new ArrayBuffer(10);
    const req = {
      headers: {
        get: (key: string) => headersMap.get(key.toLowerCase()) ?? null,
      },
      clone: () => ({
        body: {
          getReader: () => {
            let done = false;
            return {
              read: async () => {
                if (done) return { done: true, value: undefined };
                done = true;
                return { done: false, value: new Uint8Array(buffer) };
              },
              cancel: async () => {},
            };
          },
        },
        arrayBuffer: async () => buffer,
      }),
    } as unknown as NextRequest;

    return req;
  }

  it('rejects early with 413 when Content-Length header exceeds MAX_AI_BODY_BYTES', async () => {
    const handler = jest.fn();
    const wrapped = withAIRoute(handler);

    const req = createMockRequest({ contentLength: '70000' });
    const response = await wrapped(req);

    expect(handler).not.toHaveBeenCalled();
    expect(response.status).toBe(413);
  });

  it('rejects with 413 when actual body exceeds MAX_AI_BODY_BYTES without Content-Length', async () => {
    const handler = jest.fn();
    const wrapped = withAIRoute(handler);

    const oversizedBuffer = new ArrayBuffer(MAX_AI_BODY_BYTES + 100);
    const req = createMockRequest({ bodyBuffer: oversizedBuffer });
    const response = await wrapped(req);

    expect(handler).not.toHaveBeenCalled();
    expect(response.status).toBe(413);
  });

  it('returns 429 when rate limit is exceeded', async () => {
    (globalRateLimiter.checkLimit as jest.Mock).mockReturnValue({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
    });

    const handler = jest.fn();
    const wrapped = withAIRoute(handler);

    const req = createMockRequest({});
    const response = await wrapped(req);

    expect(handler).not.toHaveBeenCalled();
    expect(response.status).toBe(429);
  });

  it('invokes handler and attaches rate limit headers on success', async () => {
    const handler = jest.fn(async () =>
      NextResponse.json({ ok: true })
    );
    const wrapped = withAIRoute(handler);

    const req = createMockRequest({});
    const response = await wrapped(req);

    expect(handler).toHaveBeenCalledWith(req);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('50');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('49');
    expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
  });
});

describe('parameter clamping & error sanitization', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    resetDefaultMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  function fakeRequest(body: unknown, headerKey = 'player-key'): NextRequest {
    const headers: Record<string, string | undefined> = {
      [PROVIDER_API_KEY_HEADER]: headerKey,
    };
    return {
      headers: { get: (name: string) => headers[name] ?? null },
      json: async () => body,
    } as unknown as NextRequest;
  }

  it('preserves temperature: 0 instead of overriding with default', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'response text' }] } }],
      }),
    });

    await processAITextRequest(
      fakeRequest({
        prompt: 'test prompt',
        config: { temperature: 0 },
      }),
      { errorContext: 'Test' }
    );

    expect(global.fetch).toHaveBeenCalled();
    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const sentBody = JSON.parse(callArgs[1].body);
    expect(sentBody.generationConfig.temperature).toBe(0);
  });

  it('clamps maxTokens to server ceiling (4096) when client requests exceeding value', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'response text' }] } }],
      }),
    });

    await processAITextRequest(
      fakeRequest({
        prompt: 'test prompt',
        config: { maxTokens: 99999 },
      }),
      { errorContext: 'Test', maxTokens: 4096 }
    );

    expect(global.fetch).toHaveBeenCalled();
    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const sentBody = JSON.parse(callArgs[1].body);
    expect(sentBody.generationConfig.maxOutputTokens).toBe(4096);
  });

  it('does not leak raw upstream error body to caller on upstream error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Error',
      text: async () => 'sensitive internal server detail with token sk-12345',
    });

    const response = await processAITextRequest(
      fakeRequest({ prompt: 'test prompt' }),
      { errorContext: 'Test' }
    );

    expect(response.status).toBe(500);
    const data = await response.json();
    const rawString = JSON.stringify(data);
    expect(rawString).not.toContain('sk-12345');
  });
});
