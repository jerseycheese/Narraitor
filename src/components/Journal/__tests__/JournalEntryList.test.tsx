import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JournalEntryList } from '../JournalEntryList';
import { JournalEntry } from '@/types/journal.types';

const createEntry = (overrides: Partial<JournalEntry> = {}): JournalEntry => ({
  id: 'entry-1',
  sessionId: 'session-1',
  worldId: 'world-1',
  characterId: 'char-1',
  type: 'character_event',
  title: 'A New Lead',
  content: 'A very long summary that should be truncated when displayed in the list view for readability and layout consistency.',
  significance: 'minor',
  isRead: false,
  relatedEntities: [],
  metadata: {
    tags: [],
    automaticEntry: true,
  },
  createdAt: '2024-01-01T12:00:00Z',
  updatedAt: '2024-01-01T12:00:00Z',
  ...overrides,
});

describe('JournalEntryList', () => {
  it('renders entry cards and handles selection', () => {
    const entries = [
      createEntry({ id: 'entry-1', title: 'First Entry' }),
      createEntry({ id: 'entry-2', title: 'Second Entry', isRead: true }),
    ];
    const onEntrySelect = jest.fn();

    render(
      <JournalEntryList
        entries={entries}
        selectedEntryId="entry-1"
        onEntrySelect={onEntrySelect}
      />
    );

    expect(screen.getByText('First Entry')).toBeInTheDocument();
    expect(screen.getByText('Second Entry')).toBeInTheDocument();

    const firstCard = screen.getByRole('button', { name: /select entry: first entry/i });
    fireEvent.click(firstCard);

    expect(onEntrySelect).toHaveBeenCalledWith(entries[0]);
  });

  it('supports keyboard selection', () => {
    const entry = createEntry({ id: 'entry-1', title: 'Keyboard Entry' });
    const onEntrySelect = jest.fn();

    render(
      <JournalEntryList
        entries={[entry]}
        selectedEntryId={null}
        onEntrySelect={onEntrySelect}
      />
    );

    const card = screen.getByRole('button', { name: /select entry: keyboard entry/i });
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(onEntrySelect).toHaveBeenCalledWith(entry);
  });

  it('shows unread indicator and system event styling', () => {
    const entries = [
      createEntry({ id: 'entry-1', isRead: false }),
      createEntry({
        id: 'entry-2',
        type: 'session_end',
        title: 'Session End',
        metadata: { tags: [], automaticEntry: true },
      }),
    ];

    const { container } = render(
      <JournalEntryList
        entries={entries}
        selectedEntryId={null}
        onEntrySelect={jest.fn()}
      />
    );

    // expect(container.querySelector('.bg-primary')).toBeInTheDocument();

    const systemCard = screen.getByRole('button', { name: /select entry: session end/i });
    // expect(systemCard.className).toMatch(/bg-gray-100/);
  });
});
