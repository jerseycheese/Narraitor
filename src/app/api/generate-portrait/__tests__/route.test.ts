/**
 * @jest-environment node
 */

jest.mock('@/lib/ai/geminiImageGenerator', () => ({
  generateImageWithGemini: jest.fn(),
}));
jest.mock('@/lib/ai/portraitGenerator', () => ({
  buildPortraitPrompt: jest.fn(),
}));
jest.mock('@/lib/utils/logger', () => {
  return jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }));
});

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { generateImageWithGemini } from '@/lib/ai/geminiImageGenerator';
import { buildPortraitPrompt } from '@/lib/ai/portraitGenerator';

const mockGenerate = generateImageWithGemini as jest.MockedFunction<typeof generateImageWithGemini>;
const mockBuildPortraitPrompt = buildPortraitPrompt as jest.MockedFunction<typeof buildPortraitPrompt>;

// The direct-prompt input format skips the AI-assisted prompt builder, which
// keeps these tests on the generate-and-fall-back path they're about.
const makeRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/generate-portrait', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('/api/generate-portrait', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it('returns 400 when neither a prompt nor a character is provided', async () => {
    const response = await POST(makeRequest({ world: { genre: 'fantasy' } }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Either prompt string or character object is required');
  });

  it('returns the generated portrait when generation succeeds', async () => {
    mockGenerate.mockResolvedValue({
      url: 'data:image/png;base64,abc123',
      mimeType: 'image/png',
      base64Data: 'abc123',
    });

    const response = await POST(makeRequest({ prompt: 'a weathered knight' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.portrait.url).toBe('data:image/png;base64,abc123');
    expect(data.portrait.type).toBe('ai-generated');
    expect(data.portrait.prompt).toBe('a weathered knight');
  });

  it('falls back to a dicebear avatar when the API key is missing', async () => {
    delete process.env.GEMINI_API_KEY;

    const response = await POST(makeRequest({ prompt: 'a weathered knight' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.portrait.url).toContain('api.dicebear.com/7.x/avataaars/svg');
    expect(data.portrait.type).toBe('ai-generated');
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('falls back to a dicebear avatar when generation returns null', async () => {
    mockGenerate.mockResolvedValue(null);

    const response = await POST(makeRequest({ prompt: 'a weathered knight' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.portrait.url).toContain('api.dicebear.com/7.x/avataaars/svg');
  });

  it('still answers with a portrait when generation throws', async () => {
    mockGenerate.mockRejectedValue(new Error('rate limited'));

    const response = await POST(makeRequest({ prompt: 'a weathered knight' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.portrait.url).toContain('api.dicebear.com/7.x/avataaars/svg');
    expect(data.portrait.prompt).toBe('Character portrait fallback');
  });

  it('uses recognizable source material fallback when prompt generation fails for a known figure', async () => {
    mockBuildPortraitPrompt.mockRejectedValue(new Error('AI detection failed'));

    const response = await POST(
      makeRequest({
        character: {
          name: 'Sherlock Holmes',
          background: {
            physicalDescription: 'tall with a deerstalker hat',
            isKnownFigure: true,
          },
        },
        world: { genre: 'mystery' },
        promptOnly: true,
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prompt).toContain(
      'This should be recognizable as Sherlock Holmes from the source material.'
    );
  });

  it('uses original character fallback when prompt generation fails for a non-known figure', async () => {
    mockBuildPortraitPrompt.mockRejectedValue(new Error('AI detection failed'));

    const response = await POST(
      makeRequest({
        character: {
          name: 'Original Hero',
          background: {
            physicalDescription: 'armored warrior',
            isKnownFigure: false,
          },
        },
        world: { genre: 'fantasy' },
        promptOnly: true,
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prompt).toContain('This is an original character.');
  });
});
