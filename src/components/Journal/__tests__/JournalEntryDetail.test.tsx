import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JournalEntryDetail } from '../JournalEntryDetail';
import { JournalEntry } from '@/types/journal.types';

jest.mock('@/lib/utils', () => {
  const actual = jest.requireActual('@/lib/utils');
  return {
    ...actual,
    formatAIResponse: jest.fn(() => '<p>Formatted content</p><script>alert("x")</script>'),
  };
});

const createEntry = (overrides: Partial<JournalEntry> = {}): JournalEntry => ({
  id: 'entry-1',
  sessionId: 'session-1',
  worldId: 'world-1',
  characterId: 'char-1',
  type: 'character_event',
  title: 'A Turning Point',
  content: 'Short summary of the event.',
  detailedContent: 'Full details of the event.',
  significance: 'major',
  isRead: false,
  relatedEntities: [
    { id: 'entity-1', type: 'character', name: 'Elder Thorne' },
  ],
  metadata: {
    tags: ['prophecy', 'warning'],
    automaticEntry: true,
  },
  createdAt: '2024-01-01T12:00:00Z',
  updatedAt: '2024-01-01T12:00:00Z',
  ...overrides,
});

describe('JournalEntryDetail', () => {
  it('renders entry content and metadata', () => {
    const entry = createEntry();
    render(<JournalEntryDetail entry={entry} />);

    expect(screen.getByText('A Turning Point')).toBeInTheDocument();
    expect(screen.getByText('Full details of the event.')).toBeInTheDocument();
    expect(screen.getByText('Related')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('sanitizes formatted discovery content', () => {
    const entry = createEntry({
      type: 'discovery',
      detailedContent: 'Some discovery text',
    });
    const { container } = render(<JournalEntryDetail entry={entry} />);

    expect(screen.getByText('Formatted content')).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });

  it('shows session duration for session end entries', () => {
    const entry = createEntry({
      type: 'session_end',
      title: '',
      metadata: {
        tags: [],
        automaticEntry: true,
        sessionDuration: 5400,
      },
    });

    render(<JournalEntryDetail entry={entry} />);

    expect(screen.getByText(/Duration:/i)).toBeInTheDocument();
    expect(screen.getByText('Session End')).toBeInTheDocument();
  });

  it('renders back button when enabled', () => {
    const entry = createEntry();
    const onBack = jest.fn();

    render(
      <JournalEntryDetail
        entry={entry}
        showBackButton
        onBack={onBack}
      />
    );

    const backButton = screen.getByRole('button', { name: /back to entries/i });
    fireEvent.click(backButton);

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
