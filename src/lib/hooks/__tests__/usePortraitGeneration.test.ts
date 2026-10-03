import { renderHook, act } from '@testing-library/react';
import { usePortraitGeneration } from '../usePortraitGeneration';

jest.mock('@/state/providerStore', () => ({
  checkActiveProviderRateLimit: jest.fn(() => true),
  getActiveProviderAdvancedSettings: jest.fn(() => null),
  getActiveProviderKey: jest.fn().mockResolvedValue(null),
  getActiveProviderModel: jest.fn(() => null),
  getActiveProviderRouting: jest.fn(() => null),
}));

describe('usePortraitGeneration', () => {
  const originalFetch = global.fetch;
  let mockFetch: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('omits world.image from request payload and returns portrait', async () => {
    const mockData = { portrait: { url: 'http://example.com/portrait.png' } };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => usePortraitGeneration());

    let portrait;
    await act(async () => {
      portrait = await result.current.generate({
        character: { name: 'Aria' },
        world: {
          name: 'Solaria',
          genre: 'sci-fi',
          image: { url: 'data:image/png;base64,hugeImageData...' },
        },
      });
    });

    expect(portrait).toEqual(mockData.portrait);
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [endpoint, init] = mockFetch.mock.calls[0];
    expect(endpoint).toBe('/api/generate-portrait');
    const body = JSON.parse(init.body);
    expect(body.world.name).toBe('Solaria');
    expect(body.world.image).toBeUndefined();
  });

  it('transforms raw server error into plain language, logs raw error, and rethrows', async () => {
    const rawServerError = 'Payload too large';
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 413,
      json: async () => ({ error: rawServerError, code: 'PAYLOAD_TOO_LARGE' }),
    });

    const { result } = renderHook(() => usePortraitGeneration());

    await act(async () => {
      await expect(
        result.current.generate({
          character: { name: 'Aria' },
        })
      ).rejects.toThrow(rawServerError);
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBe(
      "Couldn't generate this content because the input is too large. Try shortening your physical description or prompt and try again."
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[usePortraitGeneration]'),
      expect.anything(),
      expect.stringContaining('Failed to generate portrait:'),
      expect.objectContaining({ message: rawServerError })
    );
  });

  it('clears error with clearError', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    });

    const { result } = renderHook(() => usePortraitGeneration());

    await act(async () => {
      await expect(
        result.current.generate({ character: { name: 'Aria' } })
      ).rejects.toThrow();
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('forwards provider headers via aiFetch when an active provider key is configured (#2195)', async () => {
    const { getActiveProviderKey } = jest.requireMock('@/state/providerStore');
    getActiveProviderKey.mockResolvedValueOnce('test-player-key');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ portrait: { url: 'http://example.com/portrait.png' } }),
    });

    const { result } = renderHook(() => usePortraitGeneration());

    await act(async () => {
      await result.current.generate({ character: { name: 'Aria' } });
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, fetchOptions] = mockFetch.mock.calls[0];
    const headers = new Headers(fetchOptions.headers);
    expect(headers.get('x-provider-api-key')).toBe('test-player-key');
  });
});
