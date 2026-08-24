jest.mock('@/lib/ai/aiFetch', () => ({
  aiFetch: jest.fn(),
}));

import { generateEndingImage, generateEndingImagePrompt } from '../endingImageApi';
import { aiFetch } from '@/lib/ai/aiFetch';
import type { StoryEnding } from '@/types/narrative.types';

const mockAiFetch = aiFetch as jest.MockedFunction<typeof aiFetch>;

const params = {
  ending: { id: 'ending-1', tone: 'hopeful' } as StoryEnding,
  recentNarrative: ['The hero rested.'],
};

describe('endingImageApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('asks for the prompt alone without generating an image', async () => {
    mockAiFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ prompt: 'A hopeful vista' }),
    } as unknown as Response);

    const result = await generateEndingImagePrompt(params);

    expect(result.prompt).toBe('A hopeful vista');
    const [url, init] = mockAiFetch.mock.calls[0];
    expect(url).toBe('/api/generate-ending-image');
    expect(JSON.parse(init?.body as string)).toMatchObject({ promptOnly: true });
  });

  it('omits the prompt-only flag for a full generation', async () => {
    mockAiFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ imageUrl: 'image-url' }),
    } as unknown as Response);

    const result = await generateEndingImage(params);

    expect(result.imageUrl).toBe('image-url');
    const [, init] = mockAiFetch.mock.calls[0];
    expect(JSON.parse(init?.body as string).promptOnly).toBeUndefined();
  });

  it('throws the server error message on a failed response', async () => {
    mockAiFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Couldn't generate the ending image. Try again in a moment." }),
    } as unknown as Response);

    await expect(generateEndingImage(params)).rejects.toThrow(
      "Couldn't generate the ending image. Try again in a moment."
    );
  });

  it('falls back to the status when the error body is unparseable', async () => {
    mockAiFetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('bad json');
      },
    } as unknown as Response);

    await expect(generateEndingImage(params)).rejects.toThrow(
      'Failed to load ending image (502)'
    );
  });
});
