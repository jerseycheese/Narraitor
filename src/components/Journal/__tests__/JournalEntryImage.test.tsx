import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JournalEntryImage } from '../JournalEntryImage';
import { useJournalStore } from '@/state/journalStore';
import { JournalEntry } from '@/types/journal.types';
import { generateJournalImage } from '@/lib/ai/journalImageGenerator';

jest.mock('@/lib/ai/journalImageGenerator', () => ({
  generateJournalImage: jest.fn(),
}));

const mockGenerate = generateJournalImage as jest.MockedFunction<typeof generateJournalImage>;

const entry: JournalEntry = {
  id: 'entry-1',
  sessionId: 'session-1',
  worldId: 'world-1',
  characterId: 'char-1',
  type: 'character_event',
  title: 'A Turning Point',
  content: 'Short summary.',
  detailedContent: 'Full details.',
  significance: 'major',
  isRead: false,
  relatedEntities: [],
  metadata: { tags: [], automaticEntry: false },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('JournalEntryImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useJournalStore.setState({
      entries: { [entry.id]: entry },
      sessionEntries: { [entry.sessionId]: [entry.id] },
    });
  });

  it('shows the generate control and an empty placeholder when no image exists', () => {
    render(<JournalEntryImage entry={entry} />);

    expect(screen.getByRole('button', { name: /generate image/i })).toBeInTheDocument();
    expect(screen.getByText(/no image/i)).toBeInTheDocument();
  });

  it('renders the section heading as h4 to fit the detail panel heading order', () => {
    render(<JournalEntryImage entry={entry} />);

    expect(screen.getByRole('heading', { level: 4, name: 'Entry Image' })).toBeInTheDocument();
  });

  it('persists the generated image to the journal store', async () => {
    mockGenerate.mockResolvedValue({
      type: 'ai-generated',
      url: '/uploads/journals/entry-1.png',
      generatedAt: '2024-01-02T00:00:00.000Z',
      prompt: 'a prompt',
    });

    render(<JournalEntryImage entry={entry} />);
    fireEvent.click(screen.getByRole('button', { name: /generate image/i }));

    await waitFor(() => {
      expect(useJournalStore.getState().entries[entry.id].metadata.image?.url).toBe(
        '/uploads/journals/entry-1.png'
      );
    });
  });

  it('clears a stale load error when a new image url arrives', () => {
    const withImage = (url: string): JournalEntry => ({
      ...entry,
      metadata: {
        ...entry.metadata,
        image: { type: 'ai-generated', url, generatedAt: '2024-01-02T00:00:00.000Z', prompt: 'p' },
      },
    });

    useJournalStore.setState({
      entries: { [entry.id]: withImage('/a.png') },
      sessionEntries: { [entry.sessionId]: [entry.id] },
    });

    const { rerender } = render(<JournalEntryImage entry={withImage('/a.png')} />);

    fireEvent.error(screen.getByAltText(/illustration for/i));
    expect(screen.getByText(/error loading image/i)).toBeInTheDocument();

    rerender(<JournalEntryImage entry={withImage('/b.png')} />);

    expect(screen.getByAltText(/illustration for/i)).toBeInTheDocument();
    expect(screen.queryByText(/error loading image/i)).not.toBeInTheDocument();
  });

  it('surfaces an error message when generation fails', async () => {
    mockGenerate.mockRejectedValue(new Error('generation failed'));

    render(<JournalEntryImage entry={entry} />);
    fireEvent.click(screen.getByRole('button', { name: /generate image/i }));

    expect(await screen.findByText('generation failed')).toBeInTheDocument();
  });
});
