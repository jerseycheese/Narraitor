import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ActiveGameSession from '../ActiveGameSession';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useTutorial } from '@/components/TutorialProvider';
import { useRouter } from 'next/navigation';
import { useAutoSave } from '@/hooks/useAutoSave';
import { isFeatureEnabled } from '@/lib/featureFlags';

// Mock dependencies
jest.mock('@/state/narrativeStore');
jest.mock('@/state/sessionStore');
jest.mock('@/state/characterStore');
jest.mock('@/state/inventoryStore');
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
  default: () => <div data-testid="choices-column" />,
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
      sessionSegments: { [mockSessionId]: [{ id: 'seg-1', text: 'Story starts...' }] },
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
      selector({ getCharacterItems: () => [] })
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

  it('renders a floating HUD with toggle buttons', async () => {
    render(
      <ActiveGameSession
        worldId={mockWorldId}
        sessionId={mockSessionId}
        onChoiceSelected={jest.fn()}
      />
    );

    expect(await screen.findByTestId('manuscript-floating-hud')).toBeInTheDocument();
    const hudToggle = screen.getByRole('button', { name: /character summary/i });
    expect(hudToggle).toHaveAttribute('aria-expanded');
    
    // Check for back button in HUD
    expect(screen.getByRole('button', { name: /back to world/i })).toBeInTheDocument();
  });

  it('renders session control buttons in the action rail', async () => {
    render(
      <ActiveGameSession
        worldId={mockWorldId}
        sessionId={mockSessionId}
        onChoiceSelected={jest.fn()}
      />
    );

    expect(await screen.findByTestId('manuscript-action-rail')).toBeInTheDocument();
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
    render(
      <ActiveGameSession
        worldId={mockWorldId}
        sessionId={mockSessionId}
        onChoiceSelected={jest.fn()}
      />
    );

    const hudToggle = await screen.findByRole('button', { name: /character summary/i });
    
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
      expect(screen.queryByTitle(/character sheet/i)).not.toBeInTheDocument();
      expect(screen.queryByTitle(/inventory/i)).not.toBeInTheDocument();
    });

    it('shows drawer triggers when flag is ON', async () => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);

      render(
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          onChoiceSelected={jest.fn()}
        />
      );

      await screen.findByTestId('manuscript-floating-hud');
      expect(screen.getByTitle(/character sheet/i)).toBeInTheDocument();
      expect(screen.getByTitle(/inventory/i)).toBeInTheDocument();
    });

    it('opens character drawer when trigger is clicked (flag ON)', async () => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);

      render(
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          onChoiceSelected={jest.fn()}
        />
      );

      const trigger = await screen.findByTitle(/character sheet/i);
      fireEvent.click(trigger);

      // ManuscriptDrawer has role="dialog"
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Character Sheet')).toBeInTheDocument();
    });

    it('renders suggested actions in margin when flag is ON', async () => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);

      render(
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          onChoiceSelected={jest.fn()}
        />
      );

      // Margin content is inside an <aside>
      const aside = await screen.findByRole('complementary', { name: /suggested actions/i });
      expect(aside).toBeInTheDocument();
      expect(aside).toHaveClass('manuscript-characters-rail');
    });
  });
});
