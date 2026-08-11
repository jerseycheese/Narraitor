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

// Only one active-play confirmation may be mounted at a time (#1536): the
// End Story confirmation has no focus trap, so the HUD Close/Reset controls
// stay reachable while it is open. Triggering either must dismiss End Story
// before the page-level confirmation opens.

jest.mock('@/state/narrativeStore');
jest.mock('@/state/sessionStore');
jest.mock('@/state/characterStore');
jest.mock('@/state/inventoryStore');
jest.mock('@/state/journalStore');
jest.mock('@/hooks/useAutoSave');
jest.mock('@/components/TutorialProvider');
jest.mock('@/lib/featureFlags');
jest.mock('@/lib/theme/ThemeProvider', () => ({
  useTheme: () => ({ colorScheme: 'light', resolvedColorScheme: 'light', setColorScheme: jest.fn() }),
}));
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Stub the heavy columns; keep the REAL ActiveGameSessionControls so the
// End Story confirmation dialog actually mounts. The choices column is
// emptied so the HUD's "End Story" button is the only one in the tree.
jest.mock('../ActiveGameSessionNarrativeColumn', () => ({
  __esModule: true,
  default: () => <div data-testid="narrative-column" />,
}));

jest.mock('../ActiveGameSessionChoicesColumn', () => ({
  __esModule: true,
  default: () => <div data-testid="choices-column" />,
}));

jest.mock('../GameSessionSkeleton', () => ({
  GameSessionSkeleton: () => <div data-testid="game-session-skeleton" />,
}));

jest.mock('@/components/Narrative/NarrativeController', () => ({
  NarrativeController: () => <div data-testid="narrative-controller" />,
}));

jest.mock('../ManuscriptDecisionBlock', () => ({
  ManuscriptDecisionBlock: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="manuscript-decision-block">{children}</div>
  ),
}));

jest.mock('@/components/ui/SaveIndicator', () => ({
  SaveIndicator: () => <div data-testid="save-indicator" />,
}));

// ActiveGameSessionControls' support sections pull their own store data;
// stub them so only the confirmation dialog behavior is under test.
jest.mock('../StorySummarySection', () => ({
  StorySummarySection: () => <div data-testid="story-summary" />,
}));

jest.mock('../ChoiceHistorySection', () => ({
  ChoiceHistorySection: () => <div data-testid="choice-history" />,
}));

jest.mock('@/components/ui/CollapsibleSection', () => ({
  CollapsibleSection: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="collapsible-section">{children}</div>
  ),
}));

jest.mock('@/components/inventory/InventoryList', () => ({
  InventoryList: () => <div data-testid="inventory-list" />,
}));

describe('ActiveGameSession confirmation dialog exclusion (#1536)', () => {
  const mockWorldId = 'world-1';
  const mockSessionId = 'session-1';
  const mockCharacterId = 'char-1';

  beforeEach(() => {
    jest.clearAllMocks();

    const mockNarrativeState = {
      segments: {
        'seg-1': { id: 'seg-1', content: 'Story starts...', characterIds: [] },
      },
      sessionSegments: { [mockSessionId]: ['seg-1'] },
      currentEnding: null,
      isGeneratingEnding: false,
      isSessionEnded: () => false,
      generateEnding: jest.fn(),
      generationError: null,
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

  const renderSession = (handlers: { onBack?: jest.Mock; onStartNew?: jest.Mock }) =>
    render(
      <ActiveGameSession
        worldId={mockWorldId}
        sessionId={mockSessionId}
        onChoiceSelected={jest.fn()}
        onBack={handlers.onBack}
        onStartNew={handlers.onStartNew}
      />
    );

  it('closes the End Story confirmation when the HUD Close control is used', async () => {
    const onBack = jest.fn();
    renderSession({ onBack });

    await screen.findByTestId('manuscript-session-shell');

    fireEvent.click(screen.getByRole('button', { name: 'End Story' }));
    expect(screen.getByRole('dialog', { name: /end story/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    // The exit flow proceeds, and the End Story confirmation is gone - the
    // page-level Leave Story dialog is the only modal decision left.
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the End Story confirmation when the HUD Reset Session control is used', async () => {
    const onStartNew = jest.fn();
    renderSession({ onStartNew });

    await screen.findByTestId('manuscript-session-shell');

    fireEvent.click(screen.getByRole('button', { name: 'End Story' }));
    expect(screen.getByRole('dialog', { name: /end story/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reset Session' }));

    expect(onStartNew).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
