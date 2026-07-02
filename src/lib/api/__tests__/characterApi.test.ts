jest.mock('@/lib/ai/aiFetch', () => ({
  aiFetch: jest.fn(),
}));

import { characterApi } from '../characterApi';
import { aiFetch } from '@/lib/ai/aiFetch';

const mockAiFetch = aiFetch as jest.MockedFunction<typeof aiFetch>;

describe('characterApi.generateCharacter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POSTs the params and returns the generated data', async () => {
    const generated = { name: 'Hero' };
    mockAiFetch.mockResolvedValue({
      ok: true,
      json: async () => generated,
    } as unknown as Response);

    const result = await characterApi.generateCharacter({
      characterType: 'original',
      existingNames: ['Alice'],
    });

    expect(result).toEqual(generated);
    const [url, init] = mockAiFetch.mock.calls[0];
    expect(url).toBe('/api/generate-character');
    expect(JSON.parse(init?.body as string)).toMatchObject({
      characterType: 'original',
      existingNames: ['Alice'],
    });
  });

  it('throws the server error message on a failed response', async () => {
    mockAiFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'World not found' }),
    } as unknown as Response);

    await expect(
      characterApi.generateCharacter({ characterType: 'known', existingNames: [] })
    ).rejects.toThrow('World not found');
  });

  it('falls back to a generic message when the error body is unparseable', async () => {
    mockAiFetch.mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error('bad json');
      },
    } as unknown as Response);

    await expect(
      characterApi.generateCharacter({ characterType: 'known', existingNames: [] })
    ).rejects.toThrow('Failed to generate character');
  });
});
