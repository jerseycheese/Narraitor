import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

// Mock dependencies
jest.mock('@/state/narrativeStore');
jest.mock('@/state/sessionStore');
jest.mock('@/state/characterStore');
jest.mock('@/state/inventoryStore');
jest.mock('@/state/journalStore');
jest.mock('@/hooks/useAutoSave');
jest.mock('@/components/TutorialProvider');
jest.mock('@/lib/featureFlags');
jest.mock('@/lib/theme/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'ds1', colorScheme: 'light', resolvedColorScheme: 'light', setTheme: jest.fn(), setColorScheme: jest.fn() }),
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

    const hudToggle = await screen.findByRole('button', { name: /character/i });
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
    expect(await screen.findByTestId('choices-column')).toBeInTheDocument();

    // The mocked ChoicesColumn receives endStoryAction which renders "End Story"
    expect(screen.getByRole('button', { name: /end story/i })).toBeInTheDocument();
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

    const endStoryButton = await screen.findByRole('button', { name: /end story/i });
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

    const hudToggle = await screen.findByRole('button', { name: /character/i });

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

  describe('Progressive Disclosure', () => {
    it('does not show drawer triggers when flag is OFF', async () => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);

      render(
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          onChoiceSelected={jest.fn()}
        />
      );

      await screen.findByRole('button', { name: /character/i });
      expect(screen.queryByText(/journal/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/inventory/i)).not.toBeInTheDocument();
    });

        it('shows Tools menu when flag is ON', async () => {

          (isFeatureEnabled as jest.Mock).mockImplementation((flag) => flag === 'PROGRESSIVE_DISCLOSURE');

          render(

    
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          onChoiceSelected={jest.fn()}
        />
      );

      await screen.findByRole('button', { name: /character/i });
      expect(screen.getByRole('button', { name: /toggle tools menu/i })).toBeInTheDocument();
    });

    it('keeps dev-only authoring tools out of the Tools menu outside development', async () => {
      // NODE_ENV is 'test' here, which the dev-tools gate treats like production,
      // so the authoring affordances must not render for real players (#1430 F58).
      (isFeatureEnabled as jest.Mock).mockImplementation((flag) => flag === 'PROGRESSIVE_DISCLOSURE');

      render(
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          onChoiceSelected={jest.fn()}
        />
      );

      const toolsToggle = await screen.findByRole('button', { name: /toggle tools menu/i });
      fireEvent.click(toolsToggle);

      expect(screen.queryByRole('button', { name: /simulate next turn/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /toggle streaming state/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /ending suggestion/i })).not.toBeInTheDocument();
    });

        it('opens character drawer from Tools menu when trigger is clicked (flag ON)', async () => {

          (isFeatureEnabled as jest.Mock).mockImplementation((flag) => flag === 'PROGRESSIVE_DISCLOSURE');

          render(

    
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          onChoiceSelected={jest.fn()}
        />
      );

      // Open Tools menu first
      const toolsToggle = await screen.findByRole('button', { name: /toggle tools menu/i });
      fireEvent.click(toolsToggle);

      // Click Character Details button in the menu
      const characterButton = screen.getByRole('button', { name: /character details/i });
      fireEvent.click(characterButton);

      // ManuscriptDrawer has role="dialog"
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Character Sheet')).toBeInTheDocument();
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

        it('toggles Tools menu when Tools button is clicked', async () => {

          (isFeatureEnabled as jest.Mock).mockImplementation((flag) => flag === 'PROGRESSIVE_DISCLOSURE');

          render(

    
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          onChoiceSelected={jest.fn()}
        />
      );

      const toolsToggle = await screen.findByRole('button', { name: /toggle tools menu/i });

      // Menu should not be open initially
      expect(screen.queryByRole('button', { name: /character details/i })).not.toBeInTheDocument();

      // Click to open
      fireEvent.click(toolsToggle);
      expect(screen.getByRole('button', { name: /character details/i })).toBeInTheDocument();

      // Click to close
      fireEvent.click(toolsToggle);
      expect(screen.queryByRole('button', { name: /character details/i })).not.toBeInTheDocument();
    });

        it('closes Tools menu when Character panel is opened', async () => {

          (isFeatureEnabled as jest.Mock).mockImplementation((flag) => flag === 'PROGRESSIVE_DISCLOSURE');

          render(

    
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          onChoiceSelected={jest.fn()}
        />
      );

      const characterToggle = await screen.findByRole('button', { name: /character/i });
      const toolsToggle = await screen.findByRole('button', { name: /toggle tools menu/i });

      fireEvent.click(toolsToggle);
      expect(toolsToggle).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('button', { name: /character details/i })).toBeInTheDocument();

      fireEvent.click(characterToggle);

      expect(characterToggle).toHaveAttribute('aria-expanded', 'true');
      expect(toolsToggle).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('button', { name: /character details/i })).not.toBeInTheDocument();
    });

        it('opens Character Details drawer from Tools menu', async () => {

          (isFeatureEnabled as jest.Mock).mockImplementation((flag) => flag === 'PROGRESSIVE_DISCLOSURE');

          render(

    
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          onChoiceSelected={jest.fn()}
        />
      );

      // Open Tools menu
      const toolsToggle = await screen.findByRole('button', { name: /toggle tools menu/i });
      fireEvent.click(toolsToggle);

      // Test Character Details drawer
      fireEvent.click(screen.getByRole('button', { name: /character details/i }));
      expect(await screen.findByText('Character Sheet')).toBeInTheDocument();
    });

        it('opens multiple drawer types from Tools menu', async () => {

          (isFeatureEnabled as jest.Mock).mockImplementation((flag) => flag === 'PROGRESSIVE_DISCLOSURE');

          render(

    
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          onChoiceSelected={jest.fn()}
        />
      );

      // Open Tools menu and test Character Details
      const toolsToggle = await screen.findByRole('button', { name: /toggle tools menu/i });
      fireEvent.click(toolsToggle);
      fireEvent.click(screen.getByRole('button', { name: /character details/i }));

      // Verify Character Sheet drawer opened
      expect(await screen.findByText('Character Sheet')).toBeInTheDocument();

      // Verify it persists even when menu is closed
      fireEvent.click(toolsToggle); // Open menu again
      expect(screen.getByText('Character Sheet')).toBeInTheDocument();
    });

        it('keeps Tools menu open when opening a drawer', async () => {

          (isFeatureEnabled as jest.Mock).mockImplementation((flag) => flag === 'PROGRESSIVE_DISCLOSURE');

          render(

    
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          onChoiceSelected={jest.fn()}
        />
      );

      // Open Tools menu
      const toolsToggle = await screen.findByRole('button', { name: /toggle tools menu/i });
      fireEvent.click(toolsToggle);

      // Menu should be visible
      expect(screen.getByRole('button', { name: /character details/i })).toBeInTheDocument();

      // Click a drawer trigger
      fireEvent.click(screen.getByRole('button', { name: /inventory/i }));

      // Menu should stay open, and drawer content should be open
      expect(
        await screen.findByRole('heading', { name: 'Inventory' }),
      ).toBeInTheDocument();
      expect(toolsToggle).toHaveAttribute('aria-expanded', 'true');
      expect(document.querySelector('.manuscript-tools-menu-items')).not.toBeNull();
    });

        it('closes drawer with Escape key before closing Tools menu', async () => {

          (isFeatureEnabled as jest.Mock).mockImplementation((flag) => flag === 'PROGRESSIVE_DISCLOSURE');

          render(

    
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          onChoiceSelected={jest.fn()}
        />
      );

      // Open Tools menu and open Character Details drawer (simpler than Inventory)
      const toolsToggle = await screen.findByRole('button', { name: /toggle tools menu/i });
      fireEvent.click(toolsToggle);
      fireEvent.click(screen.getByRole('button', { name: /character details/i }));

      // Verify drawer is open
      expect(await screen.findByText('Character Sheet')).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

      // Verify drawer is closed and Tools menu remains open
      expect(screen.queryByText('Character Sheet')).not.toBeInTheDocument();
      expect(toolsToggle).toHaveAttribute('aria-expanded', 'true');
      expect(
        screen.queryAllByRole('button', { name: /character details/i }).length,
      ).toBeGreaterThan(0);

      // Second Escape closes open HUD panels when no drawer is open
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(toolsToggle).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('button', { name: /character details/i })).not.toBeInTheDocument();
    });

    it('opens Journal Snapshot drawer from Tools menu', async () => {
      (isFeatureEnabled as jest.Mock).mockImplementation((flag) => flag === 'PROGRESSIVE_DISCLOSURE');

      (useJournalStore as unknown as jest.Mock).mockImplementation((selector) => {
        const state = {
          addEntry: jest.fn(),
          getSessionEntries: () => [
            {
              id: 'entry-1',
              sessionId: mockSessionId,
              worldId: mockWorldId,
              characterId: mockCharacterId,
              type: 'decision',
              title: 'A difficult turn',
              content: 'You accepted the archivist bargain.',
              significance: 'major',
              isRead: false,
              relatedEntities: [],
              metadata: { tags: [], automaticEntry: false },
              createdAt: '2026-02-16T12:00:00.000Z',
              updatedAt: '2026-02-16T12:00:00.000Z',
            },
          ],
        };
        return selector ? selector(state) : state;
      });

      render(
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          onChoiceSelected={jest.fn()}
        />
      );

      const toolsToggle = await screen.findByRole('button', { name: /toggle tools menu/i });
      fireEvent.click(toolsToggle);
      fireEvent.click(screen.getByRole('button', { name: /journal snapshot/i }));

      expect(
        await screen.findByRole('heading', { name: 'Journal Snapshot' }),
      ).toBeInTheDocument();
      expect(screen.getByText('A difficult turn')).toBeInTheDocument();
    });
  });
});
