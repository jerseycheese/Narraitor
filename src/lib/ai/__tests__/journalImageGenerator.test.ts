import { generateJournalImage } from '../journalImageGenerator';
import type { JournalEntry } from '@/types/journal.types';

const entry: JournalEntry = {
  id: 'entry-1',
  sessionId: 'session-1',
  worldId: 'world-1',
  characterId: 'char-1',
  type: 'character_event',
  title: 'A Turning Point',
  content: 'Short summary.',
  significance: 'major',
  isRead: false,
  relatedEntities: [],
  metadata: { tags: [], automaticEntry: false },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('generateJournalImage', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('posts the entry to the journal image endpoint and maps the response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        imageUrl: '/uploads/journals/entry-1.png',
        prompt: 'a generated prompt',
        aiGenerated: true,
      }),
    } as Response);

    const result = await generateJournalImage(entry);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/generate-journal-image',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.type).toBe('ai-generated');
    expect(result.url).toBe('/uploads/journals/entry-1.png');
    expect(result.prompt).toBe('a generated prompt');
    expect(result.generatedAt).toBeTruthy();
  });

  it('marks placeholder results as placeholder type', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ imageUrl: 'https://picsum.photos/seed/x/800/600', aiGenerated: false }),
    } as Response);

    const result = await generateJournalImage(entry);

    expect(result.type).toBe('placeholder');
  });

  it('throws when the request fails', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'boom' }),
    } as Response);

    await expect(generateJournalImage(entry)).rejects.toThrow('boom');
  });
});
