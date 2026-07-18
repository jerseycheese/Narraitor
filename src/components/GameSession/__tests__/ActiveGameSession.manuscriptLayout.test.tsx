import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ActiveGameSession from '../ActiveGameSession';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useJournalStore } from '@/state/journalStore';
import { useTutorial } from '@/components/TutorialProvider';
import { useRouter } from 'next/navigation';
import { useAutoSave } from '@/hooks/useAutoSave';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { useWorldStore } from '@/state/worldStore';
import { createMockWorld } from '@/lib/test-utils';

// Mock dependencies
jest.mock('@/state/narrativeStore');
jest.mock('@/state/sessionStore');
jest.mock('@/state/characterStore');
jest.mock('@/state/inventoryStore');
jest.mock('@/state/journalStore');
jest.mock('@/state/worldStore');
// StorySummaryDrawerContent mounts the checkpoint manager; its return value is
// unused there, so a no-op keeps the drawer test focused on the header.
jest.mock('../hooks/useStoryCheckpointManager', () => ({
  useStoryCheckpointManager: jest.fn(),
}));
jest.mock('@/hooks/useAutoSave');
jest.mock('@/components/TutorialProvider');
jest.mock('@/lib/featureFlags');
jest.mock('@/lib/theme/ThemeProvider', () => ({
  useTheme: () => ({ colorScheme: 'light', resolvedColorScheme: 'light', setColorScheme: jest.fn() }),
}));
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock child components to isolate layout testing
jest.mock('../ActiveGameSessionNarrativeColumn', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="narrative-column" />),
}));

jest.mock('../ActiveGameSessionChoicesColumn', () => ({
  __esModule: true,
  default: ({ inputActions, endStoryAction }: { inputActions?: React.ReactNode; endStoryAction?: React.ReactNode }) => (
    <div data-testid="choices-column">
      {inputActions}
      {endStoryAction}
    </div>
  ),
}));

jest.mock('../ActiveGameSessionControls', () => ({
  __esModule: true,
  default: () => <div data-testid="active-session-controls" />,
}));

jest.mock('../GameSessionSkeleton', () => ({
  GameSessionSkeleton: () => <div data-testid="game-session-skeleton" />,
}));

jest.mock('@/components/Narrative/NarrativeController', () => ({
  NarrativeController: () => <div data-testid="narrative-controller" />,
}));

jest.mock('../ManuscriptActionRail', () => ({
  ManuscriptActionRail: jest.fn(({ children }) => <div data-testid="manuscript-action-rail">{children}</div>),
}));

describe('ActiveGameSession Manuscript Layout', () => {
  const mockWorldId = 'world-1';
  const mockSessionId = 'session-1';
  const mockCharacterId = 'char-1';

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup store mocks
    const mockNarrativeState = {
      segments: {
        'seg-1': { id: 'seg-1', content: 'Story starts...', characterIds: [] },
      },
      sessionSegments: { [mockSessionId]: ['seg-1'] },
      sessionDecisions: {},
      decisions: {},
      currentEnding: null,
      isGeneratingEnding: false,
      isSessionEnded: () => false,
      generateEnding: jest.fn(),
      getSessionSegments: (sid: string) => {
        const segments = mockNarrativeState.segments as Record<string, unknown>;
        const ids = (mockNarrativeState.sessionSegments as Record<string, string[]>)[sid] ?? [];
        return ids.map((id) => segments[id]).filter(Boolean);
      },
      getSessionDecisions: () => [],
    };
    (useNarrativeStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector ? selector(mockNarrativeState) : mockNarrativeState
    );
    (useNarrativeStore as unknown as { getState: jest.Mock }).getState = jest.fn(() => mockNarrativeState);
    (useNarrativeStore as unknown as { subscribe: jest.Mock }).subscribe = jest.fn(() => jest.fn());

    (useSessionStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ characterId: mockCharacterId, shouldShowTutorialPhase: () => false })
    );

    (useCharacterStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ characters: { [mockCharacterId]: { id: mockCharacterId, name: 'Hero', worldId: mockWorldId, skills: [] } } })
    );

    (useInventoryStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        getCharacterItems: () => [],
        characterInventories: {},
        itemsObject: {},
      })
    );

    (useJournalStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        getSessionEntries: () => [],
        addEntry: jest.fn(),
      };
      return selector ? selector(state) : state;
    });

    (useWorldStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ worlds: {}, worldStates: {} })
    );

    (useTutorial as jest.Mock).mockReturnValue({
      startTour: jest.fn(),
      isTourActive: false,
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });

    (useAutoSave as jest.Mock).mockReturnValue({
      isSaving: false,
      lastSaved: null,
      saveError: null,
    });

    (isFeatureEnabled as jest.Mock).mockReturnValue(false);
  });

  it('renders a manuscript shell instead of legacy columns', async () => {
    render(
      <ActiveGameSession
        worldId={mockWorldId}
        sessionId={mockSessionId}
        onChoiceSelected={jest.fn()}
      />
    );

    // Use findByTestId to wait for async initialization
    expect(await screen.findByTestId('manuscript-session-shell')).toBeInTheDocument();
    expect(screen.queryByTestId('game-session-active')).not.toBeInTheDocument(); // legacy container
  });

  it('renders a bottom action rail', async () => {
    render(
      <ActiveGameSession
        worldId={mockWorldId}
        sessionId={mockSessionId}
        onChoiceSelected={jest.fn()}
      />
    );

    expect(await screen.findByTestId('manuscript-action-rail')).toBeInTheDocument();
  });

  it('renders a floating HUD with character toggle button', async () => {
    // When progressive disclosure is OFF, we should see the character toggle
    (isFeatureEnabled as jest.Mock).mockReturnValue(false);

    render(
      <ActiveGameSession
        worldId={mockWorldId}
        sessionId={mockSessionId}
        onChoiceSelected={jest.fn()}
      />
    );

    // DS3's pill shows the character's actual name, not a generic "Character" label.
    const hudToggle = await screen.findByRole('button', { name: /hero/i });
    expect(hudToggle).toHaveAttribute('aria-expanded');

    // Character button should be functional
    expect(hudToggle).toBeEnabled();
  });

  it('renders session control buttons in the action rail when progressive disclosure is ON', async () => {
    (isFeatureEnabled as jest.Mock).mockImplementation((flag) => flag === 'PROGRESSIVE_DISCLOSURE');
    render(
      <ActiveGameSession
        worldId={mockWorldId}
        sessionId={mockSessionId}
        onChoiceSelected={jest.fn()}
      />
    );

    expect(await screen.findByTestId('manuscript-action-rail')).toBeInTheDocument();
    const choicesColumn = await screen.findByTestId('choices-column');

    // The mocked ChoicesColumn receives endStoryAction which renders "End Story"
    // (scoped: the HUD also has its own always-visible "End Story" icon button)
    expect(within(choicesColumn).getByRole('button', { name: /end story/i })).toBeInTheDocument();
  });

  it('renders End Story button in the action rail', async () => {
    (isFeatureEnabled as jest.Mock).mockImplementation((flag) => flag === 'PROGRESSIVE_DISCLOSURE');

    render(
      <ActiveGameSession
        worldId={mockWorldId}
        sessionId={mockSessionId}
        onChoiceSelected={jest.fn()}
      />
    );

    const choicesColumn = await screen.findByTestId('choices-column');
    const endStoryButton = within(choicesColumn).getByRole('button', { name: /end story/i });
    expect(endStoryButton).toBeInTheDocument();
  });

  it('does not have narrativeMaxHeight constraint in manuscript mode', async () => {
    // We'll verify this by checking that ActiveGameSessionNarrativeColumn
    // doesn't receive the narrativeMaxHeight prop anymore
    const ActiveGameSessionNarrativeColumn = require('../ActiveGameSessionNarrativeColumn').default;

    render(
      <ActiveGameSession
        worldId={mockWorldId}
        sessionId={mockSessionId}
        onChoiceSelected={jest.fn()}
      />
    );

    // Wait for initialization
    await screen.findByTestId('manuscript-session-shell');

    // Check last call to the mock
    const lastCall = (ActiveGameSessionNarrativeColumn as jest.Mock).mock.calls.slice(-1)[0][0];
    expect(lastCall.narrativeMaxHeight).toBeUndefined();
  });

  it('closes character summary when Escape key is pressed', async () => {
    // When PROGRESSIVE_DISCLOSURE is OFF, Character button exists
    (isFeatureEnabled as jest.Mock).mockReturnValue(false);

    render(
      <ActiveGameSession
        worldId={mockWorldId}
        sessionId={mockSessionId}
        onChoiceSelected={jest.fn()}
      />
    );

    const hudToggle = await screen.findByRole('button', { name: /hero/i });

    // Open it first
    fireEvent.click(hudToggle);
    expect(hudToggle).toHaveAttribute('aria-expanded', 'true');

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    // Assert it closed
    expect(hudToggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('passes isStreaming to ManuscriptActionRail when generating', async () => {
    const ManuscriptActionRail = require('../ManuscriptActionRail').ManuscriptActionRail;

    // Segments exist (so the session shell renders) but choices are still
    // generating - that is the streaming state the action rail reflects.
    (useNarrativeStore as unknown as { subscribe: jest.Mock }).subscribe = jest.fn(
      (cb: (state: unknown) => void) => {
        cb({
          sessionSegments: { [mockSessionId]: ['seg-1'] },
          sessionDecisions: {},
          decisions: {},
        });
        return jest.fn();
      }
    );

    render(
      <ActiveGameSession
        worldId={mockWorldId}
        sessionId={mockSessionId}
        onChoiceSelected={jest.fn()}
      />
    );

    // Wait for initialization
    await screen.findByTestId('manuscript-session-shell');

    const lastCall = (ManuscriptActionRail as jest.Mock).mock.calls.slice(-1)[0][0];
    expect(lastCall.isStreaming).toBe(true);
  });

  it('renders the scene status rail when the latest segment has participants', async () => {
    // Override narrative state with a segment that has characterIds
    const mockNarrativeStateWithChars = {
      segments: {
        'seg-1': { id: 'seg-1', content: 'Story starts...', characterIds: ['npc-1'] },
      },
      sessionSegments: { [mockSessionId]: ['seg-1'] },
      currentEnding: null,
      isGeneratingEnding: false,
      isSessionEnded: () => false,
      generateEnding: jest.fn(),
    };
    (useNarrativeStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector ? selector(mockNarrativeStateWithChars) : mockNarrativeStateWithChars
    );

    render(
      <ActiveGameSession
        worldId={mockWorldId}
        sessionId={mockSessionId}
        onChoiceSelected={jest.fn()}
      />
    );

    // Scene status lives inside the <aside> rail and reflects the latest segment.
    const aside = await screen.findByRole('complementary', { name: /scene status/i });
    expect(aside).toBeInTheDocument();
    expect(aside).toHaveClass('manuscript-characters-rail');
    expect(screen.getByText('Characters Present')).toBeInTheDocument();
  });

  describe('drawer subtitles use readable labels (#1534)', () => {
    // mockSessionId ('session-1') slices to 'session-', so the old
    // `sessionId.slice(0, 8)` subtitle rendered exactly "Session session-".
    const worldWithName = createMockWorld({ id: mockWorldId, name: 'Cyberpunk Neo-Tokyo' });

    beforeEach(() => {
      (isFeatureEnabled as jest.Mock).mockImplementation(
        (flag) => flag === 'PROGRESSIVE_DISCLOSURE'
      );
    });

    // The three session-scoped drawers share one subtitle branch.
    it.each(['Journal', 'Story Summary', 'Choice History'])(
      'shows the world name instead of a truncated session ID in the %s drawer',
      async (triggerLabel) => {
        render(
          <ActiveGameSession
            worldId={mockWorldId}
            sessionId={mockSessionId}
            world={worldWithName}
            onChoiceSelected={jest.fn()}
          />
        );

        fireEvent.click(await screen.findByRole('button', { name: triggerLabel }));

        const drawer = await screen.findByTestId('manuscript-drawer');
        expect(drawer.querySelector('.manuscript-drawer-subtitle')).toHaveTextContent(
          'Cyberpunk Neo-Tokyo'
        );
        expect(within(drawer).queryByText(/Session session-/)).not.toBeInTheDocument();
      }
    );

    it('omits the subtitle entirely when no world name is available', async () => {
      render(
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          onChoiceSelected={jest.fn()}
        />
      );

      fireEvent.click(await screen.findByRole('button', { name: 'Journal' }));

      const drawer = await screen.findByTestId('manuscript-drawer');
      expect(within(drawer).queryByText(/Session session-/)).not.toBeInTheDocument();
      expect(drawer.querySelector('.manuscript-drawer-subtitle')).toBeNull();
    });
  });
});
