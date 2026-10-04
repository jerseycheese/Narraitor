jest.mock('@/lib/ai/aiFetch', () => ({
  aiFetch: jest.fn(),
}));

import { worldApi } from '../worldApi';
import { aiFetch } from '@/lib/ai/aiFetch';

const mockAiFetch = aiFetch as jest.MockedFunction<typeof aiFetch>;

describe('worldApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateWorld', () => {
    it('POSTs the params and returns the generated world data', async () => {
      const generated = { name: 'New Realm', genre: 'fantasy' };
      mockAiFetch.mockResolvedValue({
        ok: true,
        json: async () => generated,
      } as unknown as Response);

      const result = await worldApi.generateWorld({
        worldReference: 'Middle Earth',
      });

      expect(result).toEqual(generated);
      const [url, init] = mockAiFetch.mock.calls[0];
      expect(url).toBe('/api/generate-world');
      expect(JSON.parse(init?.body as string)).toMatchObject({
        worldReference: 'Middle Earth',
      });
    });

    it('throws the server error message on a failed response', async () => {
      mockAiFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to generate world' }),
      } as unknown as Response);

      await expect(
        worldApi.generateWorld({ worldReference: 'Test' })
      ).rejects.toThrow('Failed to generate world');
    });
  });

  describe('generateWorldImage', () => {
    it('omits world.image from the request payload to avoid exceeding body limits', async () => {
      const largeImageData = `data:image/png;base64,${'B'.repeat(100_000)}`;
      mockAiFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ imageUrl: '/uploads/world.png', aiGenerated: true }),
      } as unknown as Response);

      const worldWithImage = {
        id: 'world-1',
        name: 'Fantasy Realm',
        description: 'A magical kingdom',
        genre: 'fantasy',
        image: { url: largeImageData, type: 'ai-generated' },
      };

      const result = await worldApi.generateWorldImage({
        world: worldWithImage as unknown as { id: string; name: string; description: string; genre: string },
      });

      expect(result.imageUrl).toBe('/uploads/world.png');
      const [url, init] = mockAiFetch.mock.calls[0];
      expect(url).toBe('/api/generate-world-image');
      const body = JSON.parse(init?.body as string);
      expect(body.world.name).toBe('Fantasy Realm');
      expect(body.world.image).toBeUndefined();
      expect(init?.body).not.toContain(largeImageData);
    });
  });
});
