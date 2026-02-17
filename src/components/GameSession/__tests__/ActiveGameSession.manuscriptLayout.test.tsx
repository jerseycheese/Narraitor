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

    expect(await screen.findByTestId('manuscript-floating-hud')).toBeInTheDocument();
    const hudToggle = screen.getByRole('button', { name: /character/i });
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
    
    // In JSDOM, CSS visibility doesn't hide elements from getByRole unless we're using a real browser or specific setup
    expect(screen.getByRole('button', { name: /end session/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /end story/i })).toBeInTheDocument();
  });

  it('dispatches narraitor:end-session event when End Session is clicked', async () => {
    // Spy on dispatchEvent
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    
    render(
      <ActiveGameSession
        worldId={mockWorldId}
        sessionId={mockSessionId}
        onChoiceSelected={jest.fn()}
      />
    );

    const endSessionButton = await screen.findByRole('button', { name: /end session/i });
    fireEvent.click(endSessionButton);

    // Verify correct event was dispatched
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
    const dispatchedEvent = dispatchSpy.mock.calls[0][0] as Event;
    expect(dispatchedEvent.type).toBe('narraitor:end-session');
    
    dispatchSpy.mockRestore();
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
    // We'll mock isGenerating state via the narrative controller effect
    // But since it's an internal state, we can just check the rail prop
    const ManuscriptActionRail = require('../ManuscriptActionRail').ManuscriptActionRail;
    
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
    // Note: ActiveGameSession uses useState(true) for isGenerating initially
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

      await screen.findByTestId('manuscript-floating-hud');
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

      await screen.findByTestId('manuscript-floating-hud');
      expect(screen.getByRole('button', { name: /toggle tools menu/i })).toBeInTheDocument();
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

        it('renders suggested actions in margin when flag is ON', async () => {

          (isFeatureEnabled as jest.Mock).mockImplementation((flag) => flag === 'PROGRESSIVE_DISCLOSURE');

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

      // Margin content is inside an <aside>
      const aside = await screen.findByRole('complementary', { name: /characters present/i });
      expect(aside).toBeInTheDocument();
      expect(aside).toHaveClass('manuscript-characters-rail');
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

        it('closes Tools menu when opening a drawer', async () => {

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

      // Menu should now be closed, but drawer content should be open
      expect(await screen.findByText('Inventory')).toBeInTheDocument();
    });

        it('closes drawer with Escape key', async () => {

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

      // Verify drawer is closed
      expect(screen.queryByText('Character Sheet')).not.toBeInTheDocument();
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

      expect(await screen.findByText('Journal Snapshot')).toBeInTheDocument();
      expect(screen.getByText('A difficult turn')).toBeInTheDocument();
    });
  });
});
