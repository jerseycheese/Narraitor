/**
 * @jest-environment node
 */

jest.mock('@/lib/ai/geminiImageGenerator', () => ({
  generateAndSaveImageWithGemini: jest.fn(),
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
import { generateAndSaveImageWithGemini } from '@/lib/ai/geminiImageGenerator';
import type { JournalEntry } from '@/types/journal.types';
import type { World } from '@/types/world.types';

const mockGenerateAndSave = generateAndSaveImageWithGemini as jest.MockedFunction<
  typeof generateAndSaveImageWithGemini
>;

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

const makeRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/generate-journal-image', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('/api/generate-journal-image', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it('returns 400 when no entry is provided', async () => {
    const response = await POST(makeRequest({ world: mockWorld }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Journal entry data is required');
  });

  it('rejects an entry id with unsafe path characters', async () => {
    const response = await POST(
      makeRequest({ entry: { ...mockEntry, id: '../../etc/passwd' }, world: mockWorld })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid journal entry id');
    expect(mockGenerateAndSave).not.toHaveBeenCalled();
  });

  it('builds a prompt from the entry content and saves the image', async () => {
    mockGenerateAndSave.mockResolvedValue({ url: '/uploads/journals/entry-1.png', fileSize: 2048 });

    const response = await POST(makeRequest({ entry: mockEntry, world: mockWorld }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.aiGenerated).toBe(true);
    expect(data.placeholder).toBe(false);
    expect(data.imageUrl).toBe('/uploads/journals/entry-1.png');

    const [prompt, , entityId, category] = mockGenerateAndSave.mock.calls[0];
    expect(prompt).toContain('burning bridge');
    expect(prompt).toContain('A Turning Point');
    expect(entityId).toBe('entry-1');
    expect(category).toBe('journals');
  });

  it('uses the custom prompt verbatim when provided', async () => {
    mockGenerateAndSave.mockResolvedValue({ url: '/uploads/journals/entry-1.png', fileSize: 2048 });

    await POST(makeRequest({ entry: mockEntry, world: mockWorld, customPrompt: 'A lone lighthouse' }));

    expect(mockGenerateAndSave.mock.calls[0][0]).toBe('A lone lighthouse');
  });

  it('falls back to a placeholder when the API key is missing', async () => {
    delete process.env.GEMINI_API_KEY;

    const response = await POST(makeRequest({ entry: mockEntry, world: mockWorld }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.aiGenerated).toBe(false);
    expect(data.placeholder).toBe(true);
    expect(data.imageUrl).toContain('picsum.photos');
    expect(mockGenerateAndSave).not.toHaveBeenCalled();
  });

  it('falls back to a placeholder when generation returns null', async () => {
    mockGenerateAndSave.mockResolvedValue(null);

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
    expect(data.error).toBe('Failed to generate journal image. Please try again.');
  });
});
