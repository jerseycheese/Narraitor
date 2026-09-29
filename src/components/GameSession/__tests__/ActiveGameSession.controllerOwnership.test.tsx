import React from 'react';
import { render, act } from '@testing-library/react';
import ActiveGameSession from '../ActiveGameSession';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useJournalStore } from '@/state/journalStore';
import { useWorldStore } from '@/state/worldStore';
import { useTutorial } from '@/components/TutorialProvider';
import { useAutoSave } from '@/hooks/useAutoSave';
import { ToastProvider } from '@/components/ui/toast/toaster';
import { resolveInitialTurn } from '@/lib/narrative/turnResolver';
import type { NarrativeSegment } from '@/types/narrative.types';

const renderWithToast = (ui: React.ReactElement) =>
  render(<ToastProvider>{ui}</ToastProvider>);

let controllerMountCount = 0;
let controllerUnmountCount = 0;

jest.mock('@/components/Narrative/NarrativeController', () => {
  const ActualReact = require('react');
  const Actual = jest.requireActual('@/components/Narrative/NarrativeController');
  return {
    ...Actual,
    NarrativeController: (props: any) => {
      ActualReact.useEffect(() => {
        controllerMountCount++;
        return () => {
          controllerUnmountCount++;
        };
      }, []);
      return Actual.NarrativeController(props);
    },
  };
});

jest.mock('@/lib/ai/defaultGeminiClient', () => ({
  createDefaultGeminiClient: jest.fn(() => ({ generateContent: jest.fn() })),
}));

jest.mock('@/lib/ai/narrativeGenerator', () => ({
  NarrativeGenerator: jest.fn().mockImplementation(() => ({
    generateInitialScene: jest.fn(),
    generateSegment: jest.fn(),
    generatePlayerChoices: jest.fn().mockResolvedValue({
      id: 'decision-1',
      prompt: 'What do you do?',
      options: [],
      decisionWeight: 'minor',
    }),
  })),
}));

jest.mock('@/state/narrativeStore');
jest.mock('@/state/sessionStore');
jest.mock('@/state/characterStore');
jest.mock('@/state/inventoryStore');
jest.mock('@/state/journalStore');
jest.mock('@/state/worldStore');
jest.mock('@/state/npcStore', () => ({
  useNPCStore: Object.assign(
    jest.fn((selector) => {
      const state = { worldNpcs: {}, npcs: {} };
      return selector ? selector(state) : state;
    }),
    {
      getState: () => ({ getSessionNPCs: () => [], worldNpcs: {}, npcs: {} }),
    }
  ),
}));
jest.mock('@/hooks/useAutoSave');
jest.mock('@/components/TutorialProvider');
jest.mock('@/lib/featureFlags', () => ({
  isFeatureEnabled: jest.fn(() => false),
}));
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));
jest.mock('../hooks/useStoryCheckpointManager', () => ({
  useStoryCheckpointManager: jest.fn(() => ({ status: 'idle', error: null })),
}));
jest.mock('@/lib/narrative/turnResolver', () => ({
  resolveInitialTurn: jest.fn(),
  resolveTurn: jest.fn(),
  readSnapshot: jest.fn(),
}));

describe('ActiveGameSession — controller mount and callback lifecycle (#2232)', () => {
  const mockWorldId = 'world-1';
  const mockSessionId = 'session-1';
  const mockCharacterId = 'char-1';

  let listeners: Array<() => void> = [];
  let segmentsList: NarrativeSegment[] = [];
  let mockNarrativeState: any;
  const mockTriggerSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    controllerMountCount = 0;
    controllerUnmountCount = 0;
    listeners = [];
    segmentsList = [];

    mockNarrativeState = {
      _hasHydrated: true,
      segments: {} as Record<string, NarrativeSegment>,
      sessionSegments: { [mockSessionId]: [] as string[] },
      sessionDecisions: { [mockSessionId]: [] as string[] },
      decisions: {},
      endedSessions: {} as Record<string, boolean>,
      currentEnding: null,
      isGeneratingEnding: false,
      isSessionEnded: () => false,
      generateEnding: jest.fn(),
      getSessionSegments: (sid: string) => {
        if (sid === mockSessionId) return segmentsList;
        return [];
      },
      getSessionDecisions: () => [],
      addSegment: jest.fn(),
    };

    (useNarrativeStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector ? selector(mockNarrativeState) : mockNarrativeState
    );
    (useNarrativeStore as unknown as { getState: jest.Mock }).getState = jest.fn(() => mockNarrativeState);
    (useNarrativeStore as unknown as { subscribe: jest.Mock }).subscribe = jest.fn((listener: () => void) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    });

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

    (useAutoSave as jest.Mock).mockReturnValue({
      triggerSave: mockTriggerSave,
      status: 'idle',
      lastSaveTime: null,
      errorMessage: null,
      totalSaves: 0,
      retry: jest.fn(),
    });
  });

  it('maintains a single controller mount across the first segment transition', async () => {
    // 1. Initial render with 0 segments (loading/skeleton state)
    const { rerender } = renderWithToast(
      <ActiveGameSession
        worldId={mockWorldId}
        sessionId={mockSessionId}
        onChoiceSelected={jest.fn()}
      />
    );

    expect(controllerMountCount).toBe(1);
    expect(controllerUnmountCount).toBe(0);

    // 2. First segment arrives
    segmentsList = [
      {
        id: 'seg-1',
        content: 'The journey begins.',
        type: 'scene',
        metadata: { tags: [] },
        sessionId: mockSessionId,
        worldId: mockWorldId,
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    mockNarrativeState.sessionSegments[mockSessionId] = ['seg-1'];
    mockNarrativeState.segments['seg-1'] = segmentsList[0];

    // Trigger state change so ActiveGameSession transitions to content view
    await act(async () => {
      listeners.forEach((l) => (l as any)(mockNarrativeState));
    });

    rerender(
      <ToastProvider>
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          onChoiceSelected={jest.fn()}
        />
      </ToastProvider>
    );

    // In unfixed code:
    // Skeleton controller unmounts (unmountCount = 1)
    // Column controller mounts (mountCount = 2)
    // In fixed code:
    // Controller remains mounted throughout the transition (mountCount = 1, unmountCount = 0)
    expect(controllerMountCount).toBe(1);
    expect(controllerUnmountCount).toBe(0);
  });

  it('fires onNarrativeGenerated callback for the opening scene without dropping it', async () => {
    let resolveTurnPromise: (value: any) => void;
    const turnPromise = new Promise((resolve) => {
      resolveTurnPromise = resolve;
    });

    (resolveInitialTurn as jest.Mock).mockImplementation(() => turnPromise);

    renderWithToast(
      <ActiveGameSession
        worldId={mockWorldId}
        sessionId={mockSessionId}
        onChoiceSelected={jest.fn()}
      />
    );

    const firstSegment: NarrativeSegment = {
      id: 'seg-1',
      content: 'A cold wind blows through the ancient ruins.',
      type: 'scene',
      metadata: { tags: [] },
      sessionId: mockSessionId,
      worldId: mockWorldId,
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Simulate turnResolver committing segment to store while turn is still running
    await act(async () => {
      segmentsList = [firstSegment];
      mockNarrativeState.sessionSegments[mockSessionId] = ['seg-1'];
      mockNarrativeState.segments['seg-1'] = firstSegment;
      listeners.forEach((l) => (l as any)(mockNarrativeState));
    });

    // Now turnResolver finishes and resolves the turn
    await act(async () => {
      resolveTurnPromise!({
        segment: firstSegment,
        status: 'settled',
        reconciliationErrors: [],
        snapshot: { segments: [firstSegment], sessionId: mockSessionId, worldId: mockWorldId, characterId: mockCharacterId },
        isFatal: false,
        isEnding: false,
      });
    });

    // In unfixed code, the controller unmounted when segmentsList was committed,
    // so mountedRef.current was false and onNarrativeGenerated was NEVER called.
    // handleNarrativeGenerated triggers autoSave with 'scene-change'.
    expect(mockTriggerSave).toHaveBeenCalledWith('scene-change');
  });
});
