/**
 * @jest-environment node
 */

/**
 * The factory used to return the mock for anything at all once the test runner
 * was active, which made its real branches — the descriptor dispatch and
 * `toDescriptor` — impossible to reach from a test. Now an explicitly-passed
 * descriptor that actually carries a key wins over that branch, and everything
 * else keeps the mock.
 *
 * Node environment on purpose: this factory is server-side, and jsdom would hit
 * the browser-proxy branch instead.
 */

import { createDefaultGeminiClient, toDescriptor } from '../defaultGeminiClient';
import { GeminiClient } from '../geminiClient';
import { OpenAICompatibleClient } from '../providers/openai-compatible/client';
import type { ProviderDescriptor } from '../providers/types';

const geminiDescriptor: ProviderDescriptor = {
  type: 'gemini',
  endpoint: '',
  model: 'gemini-2.5-flash',
  apiKey: 'player-supplied-key',
};

const openAiDescriptor: ProviderDescriptor = {
  type: 'openai-compatible',
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  model: 'anthropic/claude-3.5-sonnet',
  apiKey: 'player-supplied-key',
};

describe('createDefaultGeminiClient', () => {
  const originalEnvKey = process.env.GEMINI_API_KEY;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    process.env.GEMINI_API_KEY = originalEnvKey;
  });

  it.each([undefined, null])('requires a player key outside the test runner (%s)', (credential) => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalWorkerId = process.env.JEST_WORKER_ID;
    try {
      Object.assign(process.env, { NODE_ENV: 'production' });
      delete process.env.JEST_WORKER_ID;
      process.env.GEMINI_API_KEY = 'server-key';
      expect(() => createDefaultGeminiClient(credential)).toThrow('API key not configured');
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      Object.assign(process.env, { NODE_ENV: originalNodeEnv });
      process.env.JEST_WORKER_ID = originalWorkerId;
    }
  });

  describe('an explicit descriptor with a key reaches the real factory', () => {
    it('builds a GeminiClient for a gemini descriptor, without any network call', () => {
      const client = createDefaultGeminiClient(geminiDescriptor);

      expect(client).toBeInstanceOf(GeminiClient);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('builds an OpenAICompatibleClient for an openai-compatible descriptor, without any network call', () => {
      const client = createDefaultGeminiClient(openAiDescriptor);

      expect(client).toBeInstanceOf(OpenAICompatibleClient);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('everything else still gets the mock', () => {
    it('returns the mock when no credential is passed', () => {
      expect(createDefaultGeminiClient().constructor.name).toBe('MockGeminiClient');
    });

    it('returns the mock for an explicit null credential', () => {
      expect(createDefaultGeminiClient(null).constructor.name).toBe('MockGeminiClient');
    });

    it('returns the mock for a descriptor with no apiKey', () => {
      const keyless: ProviderDescriptor = { ...geminiDescriptor, apiKey: null };

      expect(createDefaultGeminiClient(keyless).constructor.name).toBe('MockGeminiClient');
    });

    it('returns the mock for a descriptor with an empty apiKey', () => {
      const empty: ProviderDescriptor = { ...geminiDescriptor, apiKey: '' };

      expect(createDefaultGeminiClient(empty).constructor.name).toBe('MockGeminiClient');
    });

    it('returns the mock for a bare string key', () => {
      expect(createDefaultGeminiClient('a-bare-gemini-key').constructor.name).toBe(
        'MockGeminiClient'
      );
    });

    it('returns the mock when the env key is the MOCK_API_KEY sentinel', () => {
      process.env.GEMINI_API_KEY = 'MOCK_API_KEY';

      expect(createDefaultGeminiClient().constructor.name).toBe('MockGeminiClient');
    });

    it('returns the mock even when a real env key is configured', () => {
      process.env.GEMINI_API_KEY = 'a-real-looking-env-key';

      expect(createDefaultGeminiClient().constructor.name).toBe('MockGeminiClient');
    });

    it('makes no network call on any of those', () => {
      createDefaultGeminiClient();
      createDefaultGeminiClient(null);
      createDefaultGeminiClient('a-bare-gemini-key');

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});

describe('toDescriptor', () => {
  const originalEnvKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnvKey;
  });

  it('passes an object credential through when it carries a key', () => {
    expect(toDescriptor(geminiDescriptor)).toBe(geminiDescriptor);
  });

  it('rejects an object credential with no key', () => {
    expect(toDescriptor({ ...geminiDescriptor, apiKey: null })).toBeNull();
  });

  it('requires a player credential even when the server has a key', () => {
    process.env.GEMINI_API_KEY = 'a-real-looking-env-key';
    expect(toDescriptor()).toBeNull();
  });

  it('does not fall back to the env key for an explicit null', () => {
    process.env.GEMINI_API_KEY = 'a-real-looking-env-key';

    expect(toDescriptor(null)).toBeNull();
  });

  it('treats the MOCK_API_KEY sentinel as no env key at all', () => {
    process.env.GEMINI_API_KEY = 'MOCK_API_KEY';

    expect(toDescriptor()).toBeNull();
  });

  it('wraps a bare string key, honouring the model override', () => {
    expect(toDescriptor('a-bare-gemini-key', 'gemini-2.5-pro')).toEqual({
      type: 'gemini',
      endpoint: '',
      model: 'gemini-2.5-pro',
      apiKey: 'a-bare-gemini-key',
    });
  });
});
