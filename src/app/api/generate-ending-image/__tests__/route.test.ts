/**
 * @jest-environment node
 */

jest.mock('@/lib/ai/defaultGeminiClient');
jest.mock('@/lib/ai/geminiImageGenerator', () => ({
  generateImageWithGemini: jest.fn(),
}));
jest.mock('@/lib/utils/logger', () => {
  return jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }));
});
jest.mock('@/lib/utils/genrePromptGuide', () => ({
  getGenreStyleGuidance: jest.fn((genre: string, context: string) => `style for ${genre} ${context}`),
  getGenreFallbackImage: jest.fn((genre: string, seed: string) => `https://picsum.photos/seed/${seed}/1200/400`),
}));

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { generateImageWithGemini } from '@/lib/ai/geminiImageGenerator';
import type { StoryEnding } from '@/types/narrative.types';
import type { World } from '@/types/world.types';

const mockCreateClient = createDefaultGeminiClient as jest.MockedFunction<typeof createDefaultGeminiClient>;
const mockGenerate = generateImageWithGemini as jest.MockedFunction<typeof generateImageWithGemini>;
const mockClient = { generateContent: jest.fn() };

const mockEnding = {
  id: 'ending-1',
  sessionId: 'session-1',
  characterId: 'char-1',
  tone: 'hopeful',
  epilogue: 'The city rebuilt itself over the following winter.',
  characterLegacy: 'Remembered as the one who stayed.',
  worldImpact: 'The bridge district never burned again.',
  timestamp: '2024-01-01T00:00:00.000Z',
} as unknown as StoryEnding;

const mockWorld: World = {
  id: 'world-1',
  name: 'Test Realm',
  description: 'A fantasy realm',
  genre: 'fantasy',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  attributes: [],
  skills: [],
  settings: { maxAttributes: 10, maxSkills: 20, attributePointPool: 25, skillPointPool: 30 },
};

const makeRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/generate-ending-image', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('/api/generate-ending-image', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockClient as unknown as ReturnType<typeof createDefaultGeminiClient>);
    mockClient.generateContent.mockResolvedValue({ content: 'A sunrise over rebuilt rooftops.' });
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it('returns 400 when no ending is provided', async () => {
    const response = await POST(makeRequest({ world: mockWorld }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Ending data is required');
  });

  it('returns the generated image with its diagnostic fields', async () => {
    mockGenerate.mockResolvedValue({
      url: 'data:image/png;base64,abc123',
      mimeType: 'image/png',
      base64Data: 'abc123',
    });

    const response = await POST(makeRequest({ ending: mockEnding, world: mockWorld }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.imageUrl).toBe('data:image/png;base64,abc123');
    expect(data.aiGenerated).toBe(true);
    expect(data.placeholder).toBe(false);
    expect(data.service).toBe('gemini-image-generation');
    expect(data.tone).toBe('hopeful');
    expect(data.description).toBe('A sunrise over rebuilt rooftops.');
    expect(data.imageGenerationPrompt).toBe('A sunrise over rebuilt rooftops.');
  });

  it('falls back to a placeholder when the API key is missing', async () => {
    delete process.env.GEMINI_API_KEY;

    const response = await POST(makeRequest({ ending: mockEnding, world: mockWorld }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.aiGenerated).toBe(false);
    expect(data.placeholder).toBe(true);
    expect(data.service).toBe('fallback');
    expect(data.imageUrl).toContain('picsum.photos');
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('falls back to a placeholder when generation returns null', async () => {
    mockGenerate.mockResolvedValue(null);

    const response = await POST(makeRequest({ ending: mockEnding, world: mockWorld }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.aiGenerated).toBe(false);
    expect(data.placeholder).toBe(true);
    expect(data.imageUrl).toContain('picsum.photos');
  });

  it('falls back to a placeholder when generation throws', async () => {
    mockGenerate.mockRejectedValue(new Error('rate limited'));

    const response = await POST(makeRequest({ ending: mockEnding, world: mockWorld }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.aiGenerated).toBe(false);
    expect(data.placeholder).toBe(true);
    expect(data.imageUrl).toContain('picsum.photos');
  });

  it('returns prompts only, and no image, when promptOnly is set', async () => {
    const response = await POST(
      makeRequest({ ending: mockEnding, world: mockWorld, promptOnly: true })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.promptOnly).toBe(true);
    expect(data.imageGenerationPrompt).toBe('A sunrise over rebuilt rooftops.');
    expect(data.imageUrl).toBeUndefined();
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  // CONTEXT.md rules "hero" out of the vocabulary: a world can be a slasher or a
  // civic drama, and this prompt steers the image model. "hero banner" further
  // down is the layout term and is meant to stay.
  it('puts the character in the scene rather than casting them as a hero', async () => {
    await POST(
      makeRequest({
        ending: { ...mockEnding, tone: 'triumphant' },
        world: { ...mockWorld, name: 'Camp Crystal Lake', genre: 'slasher' },
        characterName: 'Sarah',
      })
    );

    const prompt = mockClient.generateContent.mock.calls[0][0] as string;
    expect(prompt).toContain('Sarah standing tall');
    expect(prompt).not.toMatch(/\bthe hero\b/i);
  });

  it('falls back to the character when no name is given', async () => {
    await POST(
      makeRequest({ ending: { ...mockEnding, tone: 'triumphant' }, world: mockWorld })
    );

    const prompt = mockClient.generateContent.mock.calls[0][0] as string;
    expect(prompt).toContain("the character's story");
    expect(prompt).not.toMatch(/\bthe hero\b/i);
  });

  it('returns 500 when request parsing fails', async () => {
    const response = await POST(makeRequest('invalid json'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Couldn't generate the ending image. Try again in a moment.");
  });
});
