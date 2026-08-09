/**
 * Unit tests for JournalTable component
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { JournalTable } from '../JournalTable';
import type { JournalEntry } from '@/types/journal.types';
import type { EntityID } from '@/types/common.types';

const baseEntry = (overrides: Partial<JournalEntry>): JournalEntry => ({
  id: 'entry-1' as EntityID,
  sessionId: 'session-1' as EntityID,
  worldId: 'world-1' as EntityID,
  characterId: 'char-1' as EntityID,
  type: 'discovery',
  title: 'Found the hidden cave',
  content: 'A cave entrance was hidden behind the waterfall.',
  significance: 'major',
  isRead: true,
  relatedEntities: [],
  metadata: { tags: [], automaticEntry: false },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const mockEntries: JournalEntry[] = [
  baseEntry({
    id: 'entry-1' as EntityID,
    type: 'discovery',
    title: 'Found the hidden cave',
    significance: 'major',
  }),
  baseEntry({
    id: 'entry-2' as EntityID,
    type: 'combat',
    title: 'Ambushed on the road',
    content: 'Bandits attacked near the crossroads.',
    significance: 'critical',
  }),
];

describe('JournalTable', () => {
  const mockOnEntrySelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a row for each entry with title, type, and significance', () => {
    render(
      <JournalTable
        entries={mockEntries}
        selectedEntryId={null}
        onEntrySelect={mockOnEntrySelect}
      />
    );

    const table = screen.getByRole('table', { name: 'Journal entries table' });
    expect(within(table).getByText('Found the hidden cave')).toBeInTheDocument();
    expect(within(table).getByText('Ambushed on the road')).toBeInTheDocument();
    expect(within(table).getByText('Discovery')).toBeInTheDocument();
    expect(within(table).getByText('Combat')).toBeInTheDocument();
    expect(within(table).getByText('Major')).toBeInTheDocument();
    expect(within(table).getByText('Critical')).toBeInTheDocument();
  });

  it('calls onEntrySelect when a title cell is clicked', () => {
    render(
      <JournalTable
        entries={mockEntries}
        selectedEntryId={null}
        onEntrySelect={mockOnEntrySelect}
      />
    );

    fireEvent.click(screen.getByText('Found the hidden cave'));

    expect(mockOnEntrySelect).toHaveBeenCalledWith(mockEntries[0]);
  });

  it('calls onEntrySelect when a view action button is clicked', () => {
    render(
      <JournalTable
        entries={mockEntries}
        selectedEntryId={null}
        onEntrySelect={mockOnEntrySelect}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'View Ambushed on the road' })
    );

    expect(mockOnEntrySelect).toHaveBeenCalledWith(mockEntries[1]);
  });

  it('filters rows by entry type', () => {
    render(
      <JournalTable
        entries={mockEntries}
        selectedEntryId={null}
        onEntrySelect={mockOnEntrySelect}
      />
    );

    fireEvent.change(screen.getByLabelText('Filter by entry type'), {
      target: { value: 'combat' },
    });

    expect(screen.queryByText('Found the hidden cave')).not.toBeInTheDocument();
    expect(screen.getByText('Ambushed on the road')).toBeInTheDocument();
  });

  it('filters rows via the search box by title text', () => {
    render(
      <JournalTable
        entries={mockEntries}
        selectedEntryId={null}
        onEntrySelect={mockOnEntrySelect}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Search entries...'), {
      target: { value: 'cave' },
    });

    expect(screen.getByText('Found the hidden cave')).toBeInTheDocument();
    expect(screen.queryByText('Ambushed on the road')).not.toBeInTheDocument();
  });
});
