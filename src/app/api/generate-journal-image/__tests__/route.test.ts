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
jest.mock('@/lib/utils/genrePromptGuide', () => ({
  getGenreStyleGuidance: jest.fn((genre: string, context: string) => `style for ${genre} ${context}`),
  getGenreFallbackImage: jest.fn((genre: string, seed: string) => `https://picsum.photos/seed/${seed}/800/600`),
}));

import { NextRequest } from 'next/server';
import { POST } from '../route';
import { generateImageWithGemini } from '@/lib/ai/geminiImageGenerator';
import type { JournalEntry } from '@/types/journal.types';
import type { World } from '@/types/world.types';

const mockGenerate = generateImageWithGemini as jest.MockedFunction<typeof generateImageWithGemini>;

const mockEntry: JournalEntry = {
  id: 'entry-1',
  sessionId: 'session-1',
  worldId: 'world-1',
  characterId: 'char-1',
  type: 'character_event',
  title: 'A Turning Point',
  content: 'Short summary.',
  detailedContent: 'The hero crossed the burning bridge as the city fell behind them.',
  significance: 'major',
  isRead: false,
  relatedEntities: [],
  metadata: { tags: [], automaticEntry: false },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

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

const makeRequest = (body: unknown, withoutKey = false) =>
  new NextRequest('http://localhost:3000/api/generate-journal-image', {
    method: 'POST',
    headers: withoutKey ? {} : {
      'x-provider-api-key': 'player-gemini-key',
      'x-provider-type': 'gemini',
      'x-provider-model': 'gemini-2.5-flash',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const originalGeminiKey = process.env.GEMINI_API_KEY;

describe('/api/generate-journal-image', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    if (originalGeminiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalGeminiKey;
    }
  });

  it('returns 400 when no entry is provided', async () => {
    const response = await POST(makeRequest({ world: mockWorld }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Journal entry data is required');
  });

  it('builds a prompt from the entry content and returns the generated image', async () => {
    mockGenerate.mockResolvedValue({
      url: 'data:image/png;base64,abc123',
      mimeType: 'image/png',
      base64Data: 'abc123',
    });

    const response = await POST(makeRequest({ entry: mockEntry, world: mockWorld }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.aiGenerated).toBe(true);
    expect(data.placeholder).toBe(false);
    expect(data.imageUrl).toBe('data:image/png;base64,abc123');

    const prompt = mockGenerate.mock.calls[0][0];
    expect(prompt).toContain('burning bridge');
    expect(prompt).toContain('A Turning Point');
  });

  it('uses the custom prompt verbatim when provided', async () => {
    mockGenerate.mockResolvedValue({
      url: 'data:image/png;base64,abc123',
      mimeType: 'image/png',
      base64Data: 'abc123',
    });

    await POST(makeRequest({ entry: mockEntry, world: mockWorld, customPrompt: 'A lone lighthouse' }));

    expect(mockGenerate.mock.calls[0][0]).toBe('A lone lighthouse');
  });

  it('falls back to a placeholder when the player key is missing even with a server key', async () => {
    const response = await POST(makeRequest({ entry: mockEntry, world: mockWorld }, true));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.aiGenerated).toBe(false);
    expect(data.placeholder).toBe(true);
    expect(data.imageUrl).toContain('picsum.photos');
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('falls back to a placeholder when generation returns null', async () => {
    mockGenerate.mockResolvedValue(null);

    const response = await POST(makeRequest({ entry: mockEntry, world: mockWorld }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.aiGenerated).toBe(false);
    expect(data.placeholder).toBe(true);
    expect(data.imageUrl).toContain('picsum.photos');
  });

  it('returns 500 when request parsing fails', async () => {
    const response = await POST(makeRequest('invalid json'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Couldn't generate the journal image. Try again in a moment.");
  });
});
