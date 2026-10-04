jest.mock('@/lib/ai/aiFetch', () => ({
  aiFetch: jest.fn(),
}));

import { generateWorldImage } from '../worldImageGenerator';
import { aiFetch } from '@/lib/ai/aiFetch';
import { createMockWorld } from '@/lib/test-utils/testDataFactory';

const mockAiFetch = aiFetch as jest.MockedFunction<typeof aiFetch>;

describe('worldImageGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('omits world image data URL when generating world image', async () => {
    const largeImageData = `data:image/png;base64,${'A'.repeat(100_000)}`;
    const world = createMockWorld({
      id: 'world-1',
      name: 'Cyber City',
      description: 'A sprawling neon metropolis.',
      genre: 'cyberpunk',
      image: {
        url: largeImageData,
        type: 'ai-generated',
      },
    });

    mockAiFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        imageUrl: '/uploads/worlds/new-world.png',
        aiGenerated: true,
        prompt: 'test prompt',
      }),
    } as unknown as Response);

    await generateWorldImage(world);

    expect(mockAiFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockAiFetch.mock.calls[0];
    expect(url).toBe('/api/generate-world-image');

    const body = JSON.parse(init?.body as string);
    expect(body.world.name).toBe('Cyber City');
    expect(body.world.image).toBeUndefined();
    expect(init?.body).not.toContain(largeImageData);
    expect(world.image?.url).toBe(largeImageData);
  });
});
