import { generateWorldImage } from '../worldImageGenerator';
import { aiFetch } from '../aiFetch';
import { World } from '../../../types/world.types';

jest.mock('../aiFetch');

describe('generateWorldImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (aiFetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        imageUrl: 'generated-image-url',
        aiGenerated: true,
      }),
    });
  });

  it('omits the stored image and unused world fields without mutating the world', async () => {
    const existingImageUrl = `data:image/png;base64,${'a'.repeat(1_000_000)}`;
    const world: World = {
      id: 'world-1',
      name: 'The Shattered Veil',
      createdAt: '2026-10-04T00:00:00.000Z',
      updatedAt: '2026-10-04T00:00:00.000Z',
      description: 'A fractured fantasy realm',
      genre: 'fantasy',
      attributes: [
        {
          id: 'attribute-1',
          worldId: 'world-1',
          name: 'Resolve',
          description: 'Determination',
          baseValue: 1,
          minValue: 0,
          maxValue: 5,
        },
      ],
      skills: [],
      settings: {
        maxAttributes: 4,
        maxSkills: 6,
        attributePointPool: 12,
        skillPointPool: 10,
      },
      image: {
        type: 'ai-generated',
        url: existingImageUrl,
        generatedAt: '2026-10-04T00:00:00.000Z',
        prompt: 'Existing image',
      },
      reference: 'unused world reference',
    };

    await generateWorldImage(world, 'A moonlit citadel');

    const [, request] = (aiFetch as jest.Mock).mock.calls[0];
    const requestBody = JSON.parse(request.body);

    expect(request.body.includes(existingImageUrl)).toBe(false);
    expect(Object.keys(requestBody.world).sort()).toEqual([
      'attributes',
      'description',
      'genre',
      'name',
      'skills',
    ]);
    expect(requestBody.world.attributes).toEqual([{ name: 'Resolve' }]);
    expect(requestBody.customPrompt).toBe('A moonlit citadel');
    expect(world.image?.url).toBe(existingImageUrl);
  });
});
