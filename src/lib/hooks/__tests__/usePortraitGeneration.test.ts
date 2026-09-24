import { renderHook, act } from '@testing-library/react';
import { usePortraitGeneration } from '../usePortraitGeneration';

describe('usePortraitGeneration', () => {
  const originalFetch = global.fetch;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
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
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [endpoint, init] = mockFetch.mock.calls[0];
    expect(endpoint).toBe('/api/generate-portrait');
    const body = JSON.parse(init.body);
    expect(body.world.name).toBe('Solaria');
    expect(body.world.image).toBeUndefined();
  });
});
