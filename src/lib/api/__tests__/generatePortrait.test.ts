jest.mock('@/lib/ai/aiFetch', () => ({
  aiFetch: jest.fn(),
}));

import { generatePortrait } from '../generatePortrait';
import { aiFetch } from '@/lib/ai/aiFetch';

const mockAiFetch = aiFetch as jest.MockedFunction<typeof aiFetch>;

describe('generatePortrait', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POSTs payload and returns portrait response', async () => {
    const resultData = { portrait: { url: 'https://example.com/portrait.png' } };
    mockAiFetch.mockResolvedValue({
      ok: true,
      json: async () => resultData,
    } as unknown as Response);

    const result = await generatePortrait({
      character: { name: 'Aria' },
      world: { genre: 'fantasy' },
    });

    expect(result).toEqual(resultData);
    const [url, init] = mockAiFetch.mock.calls[0];
    expect(url).toBe('/api/generate-portrait');
    expect(JSON.parse(init?.body as string)).toMatchObject({
      character: { name: 'Aria' },
      world: { genre: 'fantasy' },
    });
  });

  it('omits world.image from the request payload to avoid exceeding body limits', async () => {
    mockAiFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ portrait: { url: 'https://example.com/portrait.png' } }),
    } as unknown as Response);

    await generatePortrait({
      character: { name: 'Aria' },
      world: {
        genre: 'cyberpunk',
        image: { url: 'data:image/png;base64,hugeImageData...' },
      },
    });

    const [, init] = mockAiFetch.mock.calls[0];
    const body = JSON.parse(init?.body as string);
    expect(body.world).toBeDefined();
    expect(body.world.image).toBeUndefined();
    expect(body.world.genre).toBe('cyberpunk');
  });

  it('throws error message on failure', async () => {
    mockAiFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Generation failed' }),
    } as unknown as Response);

    await expect(
      generatePortrait({ character: { name: 'Aria' } })
    ).rejects.toThrow('Generation failed');
  });
});
