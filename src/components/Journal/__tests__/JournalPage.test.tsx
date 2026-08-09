import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JournalPage } from '../JournalPage';
import { JournalEntry } from '@/types/journal.types';
import { useJournalStore } from '@/state/journalStore';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { ErrorType } from '@/lib/utils/errorUtils';
import { World } from '@/types/world.types';

jest.mock('@/state/journalStore');
jest.mock('@/state/worldStore');
jest.mock('@/state/sessionStore');

jest.mock('@/components/shared/BackNavigation', () => ({
  BackNavigation: ({ label, href }: { label: string; href?: string }) => (
    <button data-href={href}>{label}</button>
  ),
}));

const createEntry = (overrides: Partial<JournalEntry> = {}): JournalEntry => ({
  id: 'entry-1',
  sessionId: 'session-1',
  worldId: 'world-1',
  characterId: 'char-1',
  type: 'character_event',
  title: 'A New Lead',
  content: 'Summary content',
  detailedContent: 'Detailed content',
  significance: 'major',
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

const createEntries = (count: number): JournalEntry[] =>
  Array.from({ length: count }, (_, index) =>
    createEntry({
      id: `entry-${index + 1}`,
      title: `Entry ${index + 1}`,
      createdAt: `2024-01-01T12:${String(index).padStart(2, '0')}:00Z`,
      updatedAt: `2024-01-01T12:${String(index).padStart(2, '0')}:00Z`,
    })
  );

describe('JournalPage', () => {
  const mockUseJournalStore = useJournalStore as jest.MockedFunction<typeof useJournalStore>;
  const mockUseWorldStore = useWorldStore as jest.MockedFunction<typeof useWorldStore>;
  const mockUseSessionStore = useSessionStore as jest.MockedFunction<typeof useSessionStore>;
  const worldId = 'world-1';

  const mockWorld: World = {
    id: worldId,
    name: 'Test World',
    description: 'A test world for journal rendering.',
    genre: 'fantasy',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 6,
      maxSkills: 8,
      attributePointPool: 12,
      skillPointPool: 10,
    },
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  };

  type JournalStoreState = ReturnType<typeof useJournalStore.getState>;
  type SessionStoreState = ReturnType<typeof useSessionStore.getState>;
  type WorldStoreState = ReturnType<typeof useWorldStore.getState>;

  const buildStore = (overrides: Partial<JournalStoreState> = {}): JournalStoreState => ({
    getSessionEntriesWithCharacter: jest.fn().mockReturnValue([]),
    markAsRead: jest.fn(),
    error: null,
    loading: false,
    addEntry: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
    deleteSessionEntries: jest.fn(),
    getEntriesByType: jest.fn(),
    reset: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    setLoading: jest.fn(),
    entries: {},
    sessionEntries: {},
    ...overrides,
  } as JournalStoreState);

  const buildJournalEntriesState = (entries: JournalEntry[]) => {
    const entriesRecord = entries.reduce<Record<string, JournalEntry>>((acc, entry) => {
      acc[entry.id] = entry;
      return acc;
    }, {});

    const sessionId = entries[0]?.sessionId || 'session-1';
    const sessionEntries = entries.reduce<Record<string, string[]>>((acc, entry) => {
      acc[entry.sessionId] = acc[entry.sessionId] || [];
      acc[entry.sessionId].push(entry.id);
      return acc;
    }, {});

    if (!sessionEntries[sessionId]) {
      sessionEntries[sessionId] = entries.map((entry) => entry.id);
    }

    return { entries: entriesRecord, sessionEntries };
  };

  const buildSessionState = (overrides: Partial<SessionStoreState> = {}): SessionStoreState => ({
    ...overrides,
  } as SessionStoreState);

  const buildWorldState = (overrides: Partial<WorldStoreState> = {}): WorldStoreState => ({
    worlds: { [worldId]: mockWorld },
    entities: { [worldId]: mockWorld },
    ...overrides,
  } as WorldStoreState);

  const mockJournalSelector = (state: JournalStoreState) => (
    selector?: (store: JournalStoreState) => unknown
  ) => (typeof selector === 'function' ? selector(state) : state);

  const mockWorldSelector = (state: WorldStoreState) => (
    selector?: (store: WorldStoreState) => unknown
  ) => (typeof selector === 'function' ? selector(state) : state);

  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mockUseWorldStore.mockImplementation(mockWorldSelector(buildWorldState()));
  });

  it('renders empty state when no entries exist', () => {
    const journalStore = buildStore();
    mockUseJournalStore.mockImplementation(mockJournalSelector(journalStore));
    mockUseSessionStore.mockImplementation((selector) =>
      selector(buildSessionState({ id: 'session-1', characterId: 'char-1' }))
    );

    render(<JournalPage worldId={worldId} />);

    expect(screen.getByText('This journal awaits its first entry')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Journal in Test World' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to Play' })).toHaveAttribute('data-href', `/worlds/${worldId}/play`);
  });

  it('renders entries and marks them as read when selected', () => {
    const entry = createEntry();
    const journalStore = buildStore({
      getSessionEntriesWithCharacter: jest.fn().mockReturnValue([entry]),
      ...buildJournalEntriesState([entry]),
    });
    mockUseJournalStore.mockImplementation(mockJournalSelector(journalStore));
    mockUseSessionStore.mockImplementation((selector) =>
      selector(buildSessionState({ id: 'session-1', characterId: 'char-1' }))
    );

    render(<JournalPage worldId={worldId} />);

    const card = screen.getByRole('button', { name: /select entry: a new lead/i });
    fireEvent.click(card);

    expect(journalStore.markAsRead).toHaveBeenCalledWith('entry-1');
    expect(screen.getByText('Detailed content')).toBeInTheDocument();
  });

  it('switches to table view, renders the journal table, and persists the choice', async () => {
    const entries = createEntries(2);
    const journalStore = buildStore({
      getSessionEntriesWithCharacter: jest.fn().mockReturnValue(entries),
      ...buildJournalEntriesState(entries),
    });
    mockUseJournalStore.mockImplementation(mockJournalSelector(journalStore));
    mockUseSessionStore.mockImplementation((selector) =>
      selector(buildSessionState({ id: 'session-1', characterId: 'char-1' }))
    );

    render(<JournalPage worldId={worldId} />);

    fireEvent.click(screen.getByRole('button', { name: 'Table view' }));

    const table = await screen.findByRole('table', {
      name: 'Journal entries table',
    });
    expect(within(table).getByText('Entry 1')).toBeInTheDocument();
    expect(window.localStorage.getItem('journal-view-mode')).toBe('table');
  });

  it('resolves a table-view selection against the full entry list, not a stale list-view search', async () => {
    const entries = createEntries(2);
    const journalStore = buildStore({
      getSessionEntriesWithCharacter: jest.fn().mockReturnValue(entries),
      ...buildJournalEntriesState(entries),
    });
    mockUseJournalStore.mockImplementation(mockJournalSelector(journalStore));
    mockUseSessionStore.mockImplementation((selector) =>
      selector(buildSessionState({ id: 'session-1', characterId: 'char-1' }))
    );

    render(<JournalPage worldId={worldId} />);

    // Narrow the list view so "Entry 2" is excluded from filteredEntries.
    fireEvent.change(screen.getByLabelText('Search entries'), {
      target: { value: 'Entry 1' },
    });
    expect(screen.queryByText('Entry 2')).not.toBeInTheDocument();

    // Table view ignores the stale list-view query and shows every entry.
    fireEvent.click(screen.getByRole('button', { name: 'Table view' }));
    const table = await screen.findByRole('table', {
      name: 'Journal entries table',
    });
    fireEvent.click(within(table).getByText('Entry 2'));

    const detailPane = screen.getByTestId('journal-detail-pane');
    expect(within(detailPane).getByText('Entry 2')).toBeInTheDocument();
  });

  it('restores table view from a saved preference on load', async () => {
    window.localStorage.setItem('journal-view-mode', 'table');
    const entries = createEntries(1);
    const journalStore = buildStore({
      getSessionEntriesWithCharacter: jest.fn().mockReturnValue(entries),
      ...buildJournalEntriesState(entries),
    });
    mockUseJournalStore.mockImplementation(mockJournalSelector(journalStore));
    mockUseSessionStore.mockImplementation((selector) =>
      selector(buildSessionState({ id: 'session-1', characterId: 'char-1' }))
    );

    render(<JournalPage worldId={worldId} />);

    expect(
      await screen.findByRole('table', { name: 'Journal entries table' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Table view' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('shows error state when journal store has an error', () => {
    const journalStore = buildStore({
      error: {
        title: 'Something went wrong',
        message: 'Unable to load journal',
        retryable: false,
        type: ErrorType.UNKNOWN,
        severity: 'error',
      },
    });
    mockUseJournalStore.mockImplementation(mockJournalSelector(journalStore));
    mockUseSessionStore.mockImplementation((selector) =>
      selector(buildSessionState({ id: 'session-1', characterId: 'char-1' }))
    );

    render(<JournalPage worldId={worldId} />);

    expect(screen.getByText('Unable to load journal')).toBeInTheDocument();
  });

  it('shows loading state when journal is loading', () => {
    const journalStore = buildStore({
      loading: true,
    });
    mockUseJournalStore.mockImplementation(mockJournalSelector(journalStore));
    mockUseSessionStore.mockImplementation((selector) =>
      selector(buildSessionState({ id: 'session-1', characterId: 'char-1' }))
    );

    render(<JournalPage worldId={worldId} />);

    expect(screen.getByText('Loading journal entries...')).toBeInTheDocument();
  });

  it('returns to list view when back button is clicked', () => {
    const entry = createEntry();
    const journalStore = buildStore({
      getSessionEntriesWithCharacter: jest.fn().mockReturnValue([entry]),
      ...buildJournalEntriesState([entry]),
    });
    mockUseJournalStore.mockImplementation(mockJournalSelector(journalStore));
    mockUseSessionStore.mockImplementation((selector) =>
      selector(buildSessionState({ id: 'session-1', characterId: 'char-1' }))
    );

    render(<JournalPage worldId={worldId} />);

    fireEvent.click(screen.getByRole('button', { name: /select entry: a new lead/i }));
    fireEvent.click(screen.getByRole('button', { name: /back to entries/i }));

    expect(screen.getByTestId('journal-list-pane').className).not.toMatch(/hidden/);
    expect(screen.getByTestId('journal-detail-pane').className).toMatch(/hidden/);
  });

  it('shows no active session state when session is missing', () => {
    const journalStore = buildStore();
    mockUseJournalStore.mockImplementation(mockJournalSelector(journalStore));
    mockUseSessionStore.mockImplementation((selector) =>
      selector(buildSessionState({ id: null, characterId: null }))
    );

    render(<JournalPage worldId={worldId} />);

    expect(screen.getByRole('heading', { name: 'No active session' })).toBeInTheDocument();
  });

  it('loads more entries when requested', () => {
    const entries = createEntries(25);
    const journalStore = buildStore({
      getSessionEntriesWithCharacter: jest.fn().mockReturnValue(entries),
      ...buildJournalEntriesState(entries),
    });
    mockUseJournalStore.mockImplementation(mockJournalSelector(journalStore));
    mockUseSessionStore.mockImplementation((selector) =>
      selector(buildSessionState({ id: 'session-1', characterId: 'char-1' }))
    );

    render(<JournalPage worldId={worldId} />);

    const listPane = screen.getByTestId('journal-list-pane');
    const listScope = within(listPane);

    expect(listScope.getByText('Entry 25')).toBeInTheDocument();
    expect(listScope.queryByText('Entry 15')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /load more/i }));

    expect(listScope.getByText('Entry 15')).toBeInTheDocument();
  });

  it('filters entries by search query', () => {
    const entries = [
      createEntry({ id: 'entry-1', title: 'The Lost Map', content: 'A dusty map of ruins.' }),
      createEntry({ id: 'entry-2', title: 'Campfire Tales', content: 'Stories by the fire.' }),
    ];
    const journalStore = buildStore({
      getSessionEntriesWithCharacter: jest.fn().mockReturnValue(entries),
      ...buildJournalEntriesState(entries),
    });
    mockUseJournalStore.mockImplementation(mockJournalSelector(journalStore));
    mockUseSessionStore.mockImplementation((selector) =>
      selector(buildSessionState({ id: 'session-1', characterId: 'char-1' }))
    );

    render(<JournalPage worldId={worldId} />);

    fireEvent.change(screen.getByPlaceholderText('Search entries...'), { target: { value: 'map' } });

    const listPane = screen.getByTestId('journal-list-pane');
    const listScope = within(listPane);

    expect(listScope.getByText('The Lost Map')).toBeInTheDocument();
    expect(listScope.queryByText('Campfire Tales')).not.toBeInTheDocument();
  });
});
