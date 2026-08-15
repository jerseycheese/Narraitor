/**
 * @jest-environment node
 */

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

import { generateImageWithGemini } from '@/lib/ai/geminiImageGenerator';
import {
  generateImageWithFallback,
  resolveGeneratedImageUrl,
} from '../imageGenerationHelpers';

const mockGenerate = generateImageWithGemini as jest.MockedFunction<typeof generateImageWithGemini>;

const request = (overrides: Partial<Parameters<typeof resolveGeneratedImageUrl>[0]> = {}) => ({
  prompt: 'a lone lighthouse',
  apiKey: 'test-api-key',
  fallbackUrl: 'https://example.test/placeholder.svg',
  loggerContext: 'test route',
  onHardFailure: 'fallback' as const,
  ...overrides,
});

describe('resolveGeneratedImageUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the placeholder without calling the model when there is no key', async () => {
    const result = await resolveGeneratedImageUrl(request({ apiKey: null }));

    expect(result).toEqual({
      url: 'https://example.test/placeholder.svg',
      aiGenerated: false,
    });
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('returns the generated URL when generation succeeds', async () => {
    mockGenerate.mockResolvedValue({
      url: 'data:image/png;base64,abc123',
      mimeType: 'image/png',
      base64Data: 'abc123',
    });

    const result = await resolveGeneratedImageUrl(request());

    expect(result).toEqual({ url: 'data:image/png;base64,abc123', aiGenerated: true });
    expect(mockGenerate).toHaveBeenCalledWith('a lone lighthouse', 'test-api-key');
  });

  it('returns the placeholder on a soft failure', async () => {
    mockGenerate.mockResolvedValue(null);

    const result = await resolveGeneratedImageUrl(request());

    expect(result).toEqual({
      url: 'https://example.test/placeholder.svg',
      aiGenerated: false,
    });
  });

  it('returns the placeholder on a hard failure when the route asked for fallback', async () => {
    mockGenerate.mockRejectedValue(new Error('rate limited'));

    const result = await resolveGeneratedImageUrl(request({ onHardFailure: 'fallback' }));

    expect(result).toEqual({
      url: 'https://example.test/placeholder.svg',
      aiGenerated: false,
    });
  });

  it('rethrows a hard failure when the route asked to throw', async () => {
    mockGenerate.mockRejectedValue(new Error('rate limited'));

    await expect(
      resolveGeneratedImageUrl(request({ onHardFailure: 'throw' }))
    ).rejects.toThrow('rate limited');
  });
});

describe('generateImageWithFallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('answers with a placeholder-typed image when there is no key', async () => {
    const response = await generateImageWithFallback({
      prompt: 'a rusted sword',
      apiKey: null,
      fallback: { variant: 'shapes', seed: 'Rusted Sword', imageType: 'placeholder' },
      loggerContext: 'test route',
    });
    const data = await response.json();

    expect(data.image.type).toBe('placeholder');
    expect(data.image.url).toContain('api.dicebear.com/7.x/shapes/svg');
    expect(data.image.prompt).toBe('a rusted sword');
  });

  it('answers with the generated image when generation succeeds', async () => {
    mockGenerate.mockResolvedValue({
      url: 'data:image/png;base64,abc123',
      mimeType: 'image/png',
      base64Data: 'abc123',
    });

    const response = await generateImageWithFallback({
      prompt: 'a rusted sword',
      apiKey: 'test-api-key',
      fallback: { variant: 'shapes', seed: 'Rusted Sword', imageType: 'placeholder' },
      loggerContext: 'test route',
    });
    const data = await response.json();

    expect(data.image.type).toBe('ai-generated');
    expect(data.image.url).toBe('data:image/png;base64,abc123');
  });
});
