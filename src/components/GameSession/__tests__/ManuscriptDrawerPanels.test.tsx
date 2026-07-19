import React from 'react';
import { render, screen } from '@testing-library/react';
import type { JournalEntry } from '@/types/journal.types';
import { useJournalStore } from '@/state/journalStore';
import { JournalSnapshotDrawerContent } from '../ManuscriptDrawerPanels';

jest.mock('@/state/journalStore', () => ({
  useJournalStore: jest.fn(),
}));

const mockUseJournalStore = useJournalStore as unknown as jest.Mock;

const createEntry = (id: string, createdAt: string): JournalEntry => ({
  id,
  sessionId: 'session-1',
  worldId: 'world-1',
  characterId: 'char-1',
  type: 'decision',
  title: `Entry ${id}`,
  content: `Content ${id}`,
  significance: 'major',
  isRead: false,
  relatedEntities: [{ type: 'character', id: 'char-1', name: 'Avery' }],
  metadata: {
    tags: [],
    automaticEntry: false,
  },
  createdAt,
  updatedAt: createdAt,
});

const mockJournalEntries = (entries: JournalEntry[]) => {
  mockUseJournalStore.mockImplementation((selector: (state: unknown) => unknown) =>
    selector({
      getSessionEntries: () => entries,
    })
  );
};

describe('ManuscriptDrawerPanels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJournalEntries([]);
  });

  it('renders empty state when no journal entries exist for the session', () => {
    render(<JournalSnapshotDrawerContent sessionId="session-1" />);
    expect(screen.getByText(/no journal entries found for this session/i)).toBeInTheDocument();
  });

  it('renders at most five journal entries in snapshot cards', () => {
    mockJournalEntries([
      createEntry('1', '2026-02-16T12:00:00.000Z'),
      createEntry('2', '2026-02-16T11:00:00.000Z'),
      createEntry('3', '2026-02-16T10:00:00.000Z'),
      createEntry('4', '2026-02-16T09:00:00.000Z'),
      createEntry('5', '2026-02-16T08:00:00.000Z'),
      createEntry('6', '2026-02-16T07:00:00.000Z'),
    ]);

    const { container } = render(<JournalSnapshotDrawerContent sessionId="session-1" />);
    expect(container.querySelectorAll('.manuscript-journal-snapshot-entry')).toHaveLength(5);
    expect(screen.getByText('Entry 1')).toBeInTheDocument();
    expect(screen.queryByText('Entry 6')).toBeNull();
  });
});
