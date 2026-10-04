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
    const largeImageData = `data:image/png;base64,${'A'.repeat(1_000_000)}`;
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

    await generateWorldImage(world, 'A moonlit citadel');

    expect(mockAiFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockAiFetch.mock.calls[0];
    expect(url).toBe('/api/generate-world-image');

    const requestBodyJson = init?.body as string;
    const requestBody = JSON.parse(requestBodyJson);
    expect(requestBody).toEqual({
      world: {
        name: world.name,
        description: world.description,
        genre: world.genre,
        attributes: world.attributes.map(({ name }) => ({ name })),
        skills: world.skills.map(({ name }) => ({ name })),
      },
      customPrompt: 'A moonlit citadel',
    });
    expect(requestBodyJson.includes(largeImageData)).toBe(false);
    expect(world.image?.url).toBe(largeImageData);
  });
});
