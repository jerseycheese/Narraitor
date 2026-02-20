import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { JournalEntry } from '@/types/journal.types';
import { useJournalStore } from '@/state/journalStore';
import {
  ToolsMenuPanelContent,
  JournalSnapshotDrawerContent,
} from '../ManuscriptDrawerPanels';

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

  it('shows Journal Snapshot in the tools menu', () => {
    render(
      <ToolsMenuPanelContent
        activeDrawer={null}
        onOpenDrawer={jest.fn()}
        onClosePanel={jest.fn()}
        onOpenJournalRoute={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /journal snapshot/i })).toBeInTheDocument();
  });

  it('opens the journal drawer when Journal Snapshot is clicked', () => {
    const onOpenDrawer = jest.fn();

    render(
      <ToolsMenuPanelContent
        activeDrawer={null}
        onOpenDrawer={onOpenDrawer}
        onClosePanel={jest.fn()}
        onOpenJournalRoute={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /journal snapshot/i }));
    expect(onOpenDrawer).toHaveBeenCalledWith('journal');
  });

  it('renders prototype-parity tools controls when optional handlers are provided', () => {
    render(
      <ToolsMenuPanelContent
        activeDrawer={null}
        onOpenDrawer={jest.fn()}
        onClosePanel={jest.fn()}
        onOpenJournalRoute={jest.fn()}
        onOpenCharacterPanel={jest.fn()}
        onSimulateTurn={jest.fn()}
        onToggleStreamingPreview={jest.fn()}
        onToggleEndingSuggestionPreview={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /^character$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /character details/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /inventory/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /story so far/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choice history/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /journal snapshot/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open journal route/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /simulate next turn/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /toggle streaming state/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show ending suggestion/i })).toBeInTheDocument();
  });

  it('calls optional tools parity handlers', () => {
    const onClosePanel = jest.fn();
    const onOpenCharacterPanel = jest.fn();
    const onSimulateTurn = jest.fn();
    const onToggleStreamingPreview = jest.fn();
    const onToggleEndingSuggestionPreview = jest.fn();

    render(
      <ToolsMenuPanelContent
        activeDrawer={null}
        onOpenDrawer={jest.fn()}
        onClosePanel={onClosePanel}
        onOpenJournalRoute={jest.fn()}
        onOpenCharacterPanel={onOpenCharacterPanel}
        onSimulateTurn={onSimulateTurn}
        onToggleStreamingPreview={onToggleStreamingPreview}
        onToggleEndingSuggestionPreview={onToggleEndingSuggestionPreview}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /^character$/i }));
    expect(onClosePanel).toHaveBeenCalled();
    expect(onOpenCharacterPanel).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /simulate next turn/i }));
    expect(onSimulateTurn).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /toggle streaming state/i }));
    expect(onToggleStreamingPreview).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /show ending suggestion/i }));
    expect(onToggleEndingSuggestionPreview).toHaveBeenCalled();
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
