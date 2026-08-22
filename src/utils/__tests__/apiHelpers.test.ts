// Mock Next.js modules
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn()
  }
}));

jest.mock('../rateLimiter', () => ({
  globalRateLimiter: {
    checkLimit: jest.fn(() => ({ allowed: true, remaining: 50, resetTime: Date.now() + 3600000 }))
  },
  RateLimiter: {
    getErrorMessage: jest.fn()
  }
}));

import {
  makeGeminiRequest,
  processAIStreamingTextRequest,
} from '../apiHelpers';
import { DEFAULT_TEXT_MODEL, getAIConfig } from '../../lib/ai/config';
import { GEMINI_ATTEMPT_TIMEOUT_MS } from '../../lib/constants/aiTimeouts';
import { PROVIDER_API_KEY_HEADER, PROVIDER_MODEL_HEADER } from '../../lib/ai/providerKeyHeader';
import { globalRateLimiter } from '../rateLimiter';
import { NextResponse, type NextRequest } from 'next/server';

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
    // makeGeminiRequest's describe block above calls jest.resetAllMocks() in
    // its own afterEach, which wipes the module-level rateLimiter mock's
    // implementation for every test that runs after it in this file.
    (globalRateLimiter.checkLimit as jest.Mock).mockReturnValue({
      allowed: true,
      remaining: 50,
      resetTime: Date.now() + 3600000,
    });
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
    expect(NextResponse.json).toHaveBeenCalledWith(
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
