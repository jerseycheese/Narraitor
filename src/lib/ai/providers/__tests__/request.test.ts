/**
 * @jest-environment node
 */

/**
 * The endpoint guard does DNS and network-policy work that has nothing to do
 * with headers, and has its own suite. Stubbed so these tests are about what
 * gets sent rather than about where.
 */
jest.mock('../endpointGuard', () => ({
  assertPublicProviderEndpoint: jest.fn().mockResolvedValue(undefined),
  isSafeProviderEndpoint: jest.fn().mockReturnValue(true),
}));

import { generateProviderText, readBoundedJson, sendProviderRequest } from '../core/request';
import { assertPublicProviderEndpoint } from '../endpointGuard';
import { openAICompatibleAdapter } from '../openai-compatible/adapter';
import type { ProviderDescriptor, TextGenerationSpec } from '../types';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

const SPEC: TextGenerationSpec = {
  prompt: 'Continue the story.',
  temperature: 0.7,
  maxTokens: 2048,
  contentRating: 'pg-13',
  stream: false,
};

const DESCRIPTOR: ProviderDescriptor = {
  type: 'openai-compatible',
  endpoint: ENDPOINT,
  model: 'openai/gpt-4o',
  apiKey: 'player-key',
};

const mockFetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content: 'A scene.' }, finish_reason: 'stop' }],
    }),
  });
});

/** The headers the last fetch actually went out with. */
function headersSent(): Record<string, string> {
  const lastCall = mockFetch.mock.calls.at(-1);
  return (lastCall?.[1]?.headers ?? {}) as Record<string, string>;
}

const AUTH_HEADERS = { 'Content-Type': 'application/json', Authorization: 'Bearer player-key' };

describe('custom headers', () => {
  it('sends them alongside the headers the adapter built', async () => {
    await sendProviderRequest(ENDPOINT, AUTH_HEADERS, { model: 'x' }, {
      customHeaders: { 'HTTP-Referer': 'https://narraitor-six.vercel.app', 'X-OpenRouter-Title': 'Narraitor' },
    });

    expect(headersSent()).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer player-key',
      'HTTP-Referer': 'https://narraitor-six.vercel.app',
      'X-OpenRouter-Title': 'Narraitor',
    });
  });

  /**
   * The casing cases are the point. HTTP header names are case-insensitive but
   * object keys are not, so a lowercased `authorization` would survive a plain
   * spread and reach fetch beside the real one.
   */
  it.each([
    ['Authorization', 'Bearer stolen'],
    ['authorization', 'Bearer stolen'],
    ['AUTHORIZATION', 'Bearer stolen'],
  ])('refuses to let a preset set %s', async (name, value) => {
    await sendProviderRequest(ENDPOINT, AUTH_HEADERS, { model: 'x' }, {
      customHeaders: { [name]: value, 'HTTP-Referer': 'https://narraitor-six.vercel.app' },
    });

    const sent = headersSent();
    expect(Object.values(sent)).not.toContain('Bearer stolen');
    expect(sent.Authorization).toBe('Bearer player-key');
    // The rest of the preset's headers still go — one bad name is dropped, not the batch.
    expect(sent['HTTP-Referer']).toBe('https://narraitor-six.vercel.app');
  });

  it.each(['Content-Type', 'content-type'])(
    'refuses to let a preset override the Content-Type header as %s',
    async (name) => {
      await sendProviderRequest(ENDPOINT, AUTH_HEADERS, { model: 'x' }, {
        customHeaders: { [name]: 'text/plain' },
      });

      const sent = headersSent();
      expect(Object.values(sent)).not.toContain('text/plain');
      expect(sent['Content-Type']).toBe('application/json');
    }
  );

  it("carries a descriptor's custom headers through a real generation", async () => {
    await generateProviderText(
      openAICompatibleAdapter,
      { ...DESCRIPTOR, customHeaders: { 'HTTP-Referer': 'https://narraitor-six.vercel.app' } },
      SPEC
    );

    const sent = headersSent();
    expect(sent['HTTP-Referer']).toBe('https://narraitor-six.vercel.app');
    expect(sent.Authorization).toBe('Bearer player-key');
  });

  it('sends only the adapter\'s headers when the preset asks for none', async () => {
    await generateProviderText(openAICompatibleAdapter, DESCRIPTOR, SPEC);

    expect(headersSent()).toEqual(AUTH_HEADERS);
  });
});

describe('request cancellation and timeout', () => {
  it('aborts immediately when signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      sendProviderRequest(ENDPOINT, AUTH_HEADERS, { model: 'x' }, { signal: controller.signal })
    ).rejects.toThrow('Request aborted');
  });

  it('aborts pending fetch when signal aborts during request', async () => {
    const controller = new AbortController();
    mockFetch.mockImplementation(
      () =>
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        })
    );

    const promise = sendProviderRequest(ENDPOINT, AUTH_HEADERS, { model: 'x' }, { signal: controller.signal });
    controller.abort();

    await expect(promise).rejects.toThrow('Request aborted');
  });

  it('translates fetch AbortError without signal into timeout message', async () => {
    mockFetch.mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));

    await expect(sendProviderRequest(ENDPOINT, AUTH_HEADERS, { model: 'x' })).rejects.toThrow(
      'Request timeout - please try again'
    );
  });

  it('aborts when signal aborts during asynchronous endpoint guard', async () => {
    const controller = new AbortController();
    (assertPublicProviderEndpoint as jest.Mock).mockImplementationOnce(async () => {
      controller.abort();
    });

    await expect(
      sendProviderRequest(
        'https://custom.endpoint.com/v1/chat/completions',
        AUTH_HEADERS,
        { model: 'x' },
        { playerSuppliedEndpoint: true, signal: controller.signal }
      )
    ).rejects.toThrow('Request aborted');

    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('token limit failure on empty content', () => {
  it('throws ProviderUpstreamError when provider outputs empty content with length finish reason', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: '' }, finish_reason: 'length' }],
      }),
    });

    await expect(
      generateProviderText(openAICompatibleAdapter, DESCRIPTOR, SPEC)
    ).rejects.toThrow('Service error: output token limit reached before generation completed');
  });
});

describe('bounded JSON response reading', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('times out a stalled body and cancels/releases its reader', async () => {
    jest.useFakeTimers();
    const cancel = jest.fn();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{'));
      },
      cancel,
    });
    const response = new Response(body);

    const reading = readBoundedJson(response, 1024, { timeoutMs: 100 });
    const rejection = expect(reading).rejects.toThrow('Request timeout - please try again');
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(100);

    await rejection;
    expect(cancel).toHaveBeenCalled();
    expect(() => response.body?.getReader()).not.toThrow();
  });

  it('cancels a pending body read when the caller aborts', async () => {
    const cancel = jest.fn();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{'));
      },
      cancel,
    });
    const response = new Response(body);
    const controller = new AbortController();
    const removeListener = jest.spyOn(controller.signal, 'removeEventListener');
    const reading = readBoundedJson(response, 1024, { signal: controller.signal });
    const rejection = expect(reading).rejects.toThrow('Request aborted');

    controller.abort();

    await rejection;
    expect(cancel).toHaveBeenCalled();
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(() => response.body?.getReader()).not.toThrow();
  });

  it('uses one deadline for a body that keeps trickling chunks', async () => {
    jest.useFakeTimers();
    const cancel = jest.fn();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{'));
      },
      pull(controller) {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            controller.enqueue(new TextEncoder().encode(' '));
            resolve();
          }, 40);
        });
      },
      cancel,
    });
    const response = new Response(body);
    const reading = readBoundedJson(response, 1024, { timeoutMs: 100 });
    const rejection = expect(reading).rejects.toThrow('Request timeout - please try again');

    await jest.advanceTimersByTimeAsync(100);

    await rejection;
    expect(cancel).toHaveBeenCalled();
    expect(() => response.body?.getReader()).not.toThrow();
  });

  it('cancels and releases the reader when the size limit is exceeded', async () => {
    const cancel = jest.fn();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('too large'));
      },
      cancel,
    });
    const response = new Response(body);
    await expect(readBoundedJson(response, 2)).rejects.toThrow(
      'Service error: response exceeded maximum size'
    );
    expect(cancel).toHaveBeenCalled();
    expect(() => response.body?.getReader()).not.toThrow();
  });
});
