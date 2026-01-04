import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    <a href={href}>{label}</a>
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

describe('JournalPage', () => {
  const mockUseJournalStore = useJournalStore as jest.MockedFunction<typeof useJournalStore>;
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

  const buildSessionState = (overrides: Partial<SessionStoreState> = {}): SessionStoreState => ({
    ...overrides,
  } as SessionStoreState);

  const mockJournalSelector = (state: JournalStoreState) => (
    selector?: (store: JournalStoreState) => unknown
  ) => (typeof selector === 'function' ? selector(state) : state);

  beforeEach(() => {
    jest.clearAllMocks();
    useWorldStore.setState({
      worlds: { [worldId]: mockWorld },
      entities: { [worldId]: mockWorld },
    });
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
    expect(screen.getByRole('link', { name: 'Back to Play' })).toHaveAttribute('href', `/worlds/${worldId}/play`);
  });

  it('renders entries and marks them as read when selected', () => {
    const entry = createEntry();
    const journalStore = buildStore({
      getSessionEntriesWithCharacter: jest.fn().mockReturnValue([entry]),
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

  it('shows error state when journal store has an error', () => {
    const journalStore = buildStore({
      error: {
        title: 'Something went wrong',
        message: 'Unable to load journal',
        retryable: false,
        type: ErrorType.UNKNOWN,
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
});
