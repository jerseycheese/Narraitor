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

import { generateProviderText, sendProviderRequest } from '../core/request';
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
  return mockFetch.mock.calls[0][1].headers as Record<string, string>;
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
