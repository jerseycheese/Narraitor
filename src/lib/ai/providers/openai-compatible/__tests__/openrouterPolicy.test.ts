/** @jest-environment node */

import {
  clearOpenRouterModelCache,
  determineOpenRouterReasoning,
  getOpenRouterModelMetadata,
  isOpenRouterChatEndpoint,
  supportsReasoning,
  OPENROUTER_CHAT_ENDPOINT,
} from '../openrouterPolicy';

describe('openrouterPolicy', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
    clearOpenRouterModelCache();
  });

  describe('isOpenRouterChatEndpoint', () => {
    it('matches the exact OpenRouter chat completions endpoint', () => {
      expect(isOpenRouterChatEndpoint(OPENROUTER_CHAT_ENDPOINT)).toBe(true);
    });

    it('rejects substring host matches and unrelated endpoints', () => {
      expect(isOpenRouterChatEndpoint('https://api.openai.com/v1/chat/completions')).toBe(false);
      expect(isOpenRouterChatEndpoint('https://openrouter.ai/api/v1/models')).toBe(false);
      expect(isOpenRouterChatEndpoint('https://fake-openrouter.ai/api/v1/chat/completions')).toBe(false);
      expect(isOpenRouterChatEndpoint('https://openrouter.ai.attacker.com/api/v1/chat/completions')).toBe(false);
      expect(isOpenRouterChatEndpoint(undefined)).toBe(false);
    });
  });

  describe('supportsReasoning', () => {
    it('returns true when reasoning is in supported_parameters', () => {
      expect(supportsReasoning({ id: 'm1', supported_parameters: ['reasoning', 'max_tokens'] })).toBe(true);
    });

    it('returns true when reasoning object is defined', () => {
      expect(supportsReasoning({ id: 'm2', reasoning: { mandatory: false } })).toBe(true);
    });

    it('returns false when neither is present', () => {
      expect(supportsReasoning({ id: 'm3', supported_parameters: ['max_tokens', 'temperature'] })).toBe(false);
    });
  });

  describe('determineOpenRouterReasoning', () => {
    it('returns undefined for undefined metadata or unsupported models', () => {
      expect(determineOpenRouterReasoning(undefined)).toBeUndefined();
      expect(determineOpenRouterReasoning({ id: 'plain', supported_parameters: ['max_tokens'] })).toBeUndefined();
    });

    it('disables optional reasoning with enabled: false', () => {
      expect(
        determineOpenRouterReasoning({
          id: 'optional-1',
          supported_parameters: ['reasoning'],
          reasoning: { mandatory: false, default_enabled: true },
        })
      ).toEqual({ enabled: false });

      expect(
        determineOpenRouterReasoning({
          id: 'optional-2',
          supported_parameters: ['reasoning'],
        })
      ).toEqual({ enabled: false });
    });

    it('picks the least supported effort for mandatory reasoning models', () => {
      expect(
        determineOpenRouterReasoning({
          id: 'mandatory-1',
          reasoning: {
            mandatory: true,
            supported_efforts: ['high', 'low', 'medium'],
          },
        })
      ).toEqual({ effort: 'low' });

      expect(
        determineOpenRouterReasoning({
          id: 'mandatory-2',
          reasoning: {
            mandatory: true,
            supported_efforts: ['max', 'xhigh', 'high'],
          },
        })
      ).toEqual({ effort: 'high' });
    });

    it('falls back to default_effort or low when supported_efforts is missing', () => {
      expect(
        determineOpenRouterReasoning({
          id: 'mandatory-default',
          reasoning: {
            mandatory: true,
            default_effort: 'minimal',
          },
        })
      ).toEqual({ effort: 'minimal' });

      expect(
        determineOpenRouterReasoning({
          id: 'mandatory-fallback',
          reasoning: {
            mandatory: true,
          },
        })
      ).toEqual({ effort: 'low' });
    });
  });

  describe('getOpenRouterModelMetadata caching and fetching', () => {
    it('fetches metadata from the models endpoint and caches it', async () => {
      const mockModel = {
        id: 'test/cached-model',
        supported_parameters: ['reasoning'],
        reasoning: { mandatory: false },
      };
      const fetchMock = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: [mockModel] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
      global.fetch = fetchMock as typeof fetch;

      const first = await getOpenRouterModelMetadata('test/cached-model', 'key123');
      expect(first).toEqual(mockModel);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
        Authorization: 'Bearer key123',
      });

      // Second call uses cached result
      const second = await getOpenRouterModelMetadata('test/cached-model', 'key123');
      expect(second).toEqual(mockModel);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('handles non-200 responses gracefully without throwing', async () => {
      const fetchMock = jest.fn().mockResolvedValue(
        new Response('Service Unavailable', { status: 503 })
      );
      global.fetch = fetchMock as typeof fetch;

      const result = await getOpenRouterModelMetadata('test/model');
      expect(result).toBeUndefined();
    });

    it('handles fetch exceptions gracefully without throwing', async () => {
      const fetchMock = jest.fn().mockRejectedValue(new Error('Network offline'));
      global.fetch = fetchMock as typeof fetch;

      const result = await getOpenRouterModelMetadata('test/model');
      expect(result).toBeUndefined();
    });
  });
});
