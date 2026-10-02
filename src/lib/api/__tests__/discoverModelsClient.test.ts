/**
 * @jest-environment jsdom
 */

import { discoverProviderModels } from '../discoverModelsClient';
import { PROVIDER_API_KEY_HEADER } from '@/lib/ai/providerKeyHeader';

describe('discoverProviderModels', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('sends candidate key in header and returns discovered models', async () => {
    const mockModels = [{ id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' }];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: mockModels }),
    });

    const result = await discoverProviderModels({
      type: 'gemini',
      apiKey: 'test-key',
    });

    expect(result.models).toEqual(mockModels);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/ai/models',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          [PROVIDER_API_KEY_HEADER]: 'test-key',
        }),
        body: JSON.stringify({
          type: 'gemini',
          endpoint: undefined,
        }),
      })
    );
  });

  it('handles keyless requests without header', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [{ id: 'llama3.2', name: 'llama3.2' }] }),
    });

    const result = await discoverProviderModels({
      type: 'ollama',
      endpoint: 'https://ollama.example.com/v1/chat/completions',
    });

    expect(result.models).toHaveLength(1);
    const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
    expect(headers[PROVIDER_API_KEY_HEADER]).toBeUndefined();
  });

  it('handles network error gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await discoverProviderModels({
      type: 'gemini',
      apiKey: 'test-key',
    });

    expect(result.models).toEqual([]);
    expect(result.error).toBe('NETWORK');
  });

  it('handles abort signal cleanly', async () => {
    const controller = new AbortController();
    controller.abort();

    global.fetch = jest.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));

    const result = await discoverProviderModels({
      type: 'gemini',
      apiKey: 'test-key',
      signal: controller.signal,
    });

    expect(result.models).toEqual([]);
    expect(result.error).toBe('ABORTED');
  });
});
