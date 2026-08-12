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
  getSafetySettingsFromPrompt,
  makeGeminiRequest,
  consumeGeminiStreamEvents,
  processGeminiStreamingTextRequest,
} from '../apiHelpers';
import { DEFAULT_TEXT_MODEL, getAIConfig } from '../../lib/ai/config';
import { GEMINI_ATTEMPT_TIMEOUT_MS } from '../../lib/constants/aiTimeouts';
import { PROVIDER_API_KEY_HEADER, PROVIDER_MODEL_HEADER } from '../../lib/ai/providerKeyHeader';
import { globalRateLimiter } from '../rateLimiter';
import { NextResponse, type NextRequest } from 'next/server';

describe('getSafetySettingsFromPrompt', () => {
  it('returns BLOCK_MEDIUM_AND_ABOVE for G-rated content', () => {
    const prompt = `
      Generate a story about adventure.
      
      G-RATED CONTENT GUIDELINES:
      - NO violence, weapons, fighting, or physical harm
      - Focus on wholesome adventure and friendship
    `;
    
    const safetySettings = getSafetySettingsFromPrompt(prompt);
    
    expect(safetySettings).toEqual([
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
    ]);
  });

  it('returns BLOCK_ONLY_HIGH for PG-rated content', () => {
    const prompt = `
      PG-RATED CONTENT GUIDELINES:
      - Mild fantasy violence only
      - Gentle themes of conflict and resolution
    `;
    
    const safetySettings = getSafetySettingsFromPrompt(prompt);
    
    expect(safetySettings).toEqual([
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
    ]);
  });

  it('returns BLOCK_ONLY_HIGH for PG-13 content', () => {
    const prompt = `
      PG-13 CONTENT GUIDELINES:
      - Moderate fantasy violence with some detail
      - Themes of loss and sacrifice
    `;
    
    const safetySettings = getSafetySettingsFromPrompt(prompt);
    
    expect(safetySettings).toEqual([
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
    ]);
  });

  it('returns BLOCK_NONE for sexually explicit content for R-rated', () => {
    const prompt = `
      R-RATED CONTENT GUIDELINES:
      - Realistic violence with consequences
      - Strong language and mature themes
    `;

    const safetySettings = getSafetySettingsFromPrompt(prompt);

    expect(safetySettings).toEqual([
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
    ]);
  });

  it('returns default BLOCK_MEDIUM_AND_ABOVE when no content rating found', () => {
    const prompt = 'Generate a story about adventure.';
    
    const safetySettings = getSafetySettingsFromPrompt(prompt);
    
    expect(safetySettings).toEqual([
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
    ]);
  });

  it('returns BLOCK_NONE for sexually explicit content for NC-17', () => {
    const prompt = `
      NC-17 CONTENT GUIDELINES:
      - Intense, realistic scenarios with serious consequences
      - Strong language and complex mature themes
    `;

    const safetySettings = getSafetySettingsFromPrompt(prompt);

    expect(safetySettings).toEqual([
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
    ]);
  });

  it('is case insensitive when matching content ratings', () => {
    const prompt = `
      g-rated content guidelines:
      - NO violence, weapons, fighting, or physical harm
      - Focus on wholesome adventure and friendship
    `;
    
    const safetySettings = getSafetySettingsFromPrompt(prompt);
    
    expect(safetySettings).toEqual([
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
    ]);
  });
});

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

describe('consumeGeminiStreamEvents', () => {
  const encoder = new TextEncoder();

  /** A fake reader that yields the given SSE `data:` payloads one chunk per
   * read(), then signals done — matches the ByteStreamReader shape without
   * needing a real web ReadableStream (unavailable in this jsdom test env). */
  function fakeReader(payloads: unknown[]) {
    const frames = payloads.map((payload) => encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
    let index = 0;
    return {
      read: jest.fn(async () => {
        if (index >= frames.length) return { done: true };
        return { done: false, value: frames[index++] };
      }),
    };
  }

  it('yields growing content deltas as candidate text streams in, then a done event', async () => {
    const reader = fakeReader([
      { candidates: [{ content: { parts: [{ text: '{"content": "Once upon a ' }] } }] },
      { candidates: [{ content: { parts: [{ text: 'time, a hero' }] } }] },
      {
        candidates: [
          { content: { parts: [{ text: ' arose.", "type": "scene"}' }] }, finishReason: 'STOP' },
        ],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
      },
    ]);

    const events = [];
    for await (const event of consumeGeminiStreamEvents(reader, 'Test')) {
      events.push(event);
    }

    const deltas = events.filter((e): e is { delta: string } => 'delta' in e);
    expect(deltas.map((d) => d.delta).join('')).toBe('Once upon a time, a hero arose.');

    const last = events[events.length - 1];
    expect(last).toEqual({
      done: true,
      content: '{"content": "Once upon a time, a hero arose.", "type": "scene"}',
      finishReason: 'STOP',
      promptTokens: 10,
      completionTokens: 5,
    });
  });

  it('skips an unparsable SSE frame instead of aborting the turn', async () => {
    const badFrame = encoder.encode('data: {not json\n\n');
    const goodFrame = encoder.encode(`data: ${JSON.stringify({
      candidates: [{ content: { parts: [{ text: '{"content": "Still works"}' }] }, finishReason: 'STOP' }],
    })}\n\n`);
    let index = 0;
    const reader = {
      read: jest.fn(async () => {
        const frames = [badFrame, goodFrame];
        if (index >= frames.length) return { done: true };
        return { done: false, value: frames[index++] };
      }),
    };

    const events = [];
    for await (const event of consumeGeminiStreamEvents(reader, 'Test')) {
      events.push(event);
    }

    const last = events[events.length - 1];
    expect(last).toMatchObject({ done: true, content: '{"content": "Still works"}' });
  });

  it('yields an error event when the reader itself fails mid-stream', async () => {
    const reader = {
      read: jest.fn().mockRejectedValue(new Error('connection reset')),
    };

    const events = [];
    for await (const event of consumeGeminiStreamEvents(reader, 'Test')) {
      events.push(event);
    }

    expect(events).toEqual([{ error: 'connection reset' }]);
  });
});

describe('processGeminiStreamingTextRequest', () => {
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
    await processGeminiStreamingTextRequest(fakeRequest({}), { errorContext: 'Test' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('errors without calling Gemini when no API key resolves', async () => {
    // No header key, and jest.setup.ts pins GEMINI_API_KEY to the MOCK_API_KEY
    // sentinel, which resolveApiKey treats as unset.
    await processGeminiStreamingTextRequest(fakeRequest({ prompt: 'hello' }), { errorContext: 'Test' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('surfaces an upstream non-ok response as an error instead of streaming', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: async () => 'rate limited upstream',
    });

    await processGeminiStreamingTextRequest(
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

    await processGeminiStreamingTextRequest(
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

    await processGeminiStreamingTextRequest(
      fakeRequest({ prompt: 'hello' }, 'player-supplied-key'),
      { errorContext: 'Test' }
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/models/${DEFAULT_TEXT_MODEL}:streamGenerateContent`),
      expect.any(Object)
    );
  });
});
