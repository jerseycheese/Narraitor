import React from 'react';
import { act, render, waitFor } from '@testing-library/react';

import { NarrativeController } from '../NarrativeController';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useNPCStore } from '@/state/npcStore';
import {
  createMockCharacterStore,
  createMockNarrativeStore,
  createMockNPCStore,
  createMockWorldStore,
  mockZustandStore,
} from '@/lib/test-utils';
import { ToastProvider } from '@/components/ui/toast/toaster';

const mockGeneratePlayerChoices = jest.fn();

jest.mock('@/lib/ai/defaultGeminiClient', () => ({
  createDefaultGeminiClient: jest.fn(() => ({
    generateContent: jest.fn(),
  })),
}));

jest.mock('@/lib/ai/narrativeGenerator', () => ({
  NarrativeGenerator: jest.fn().mockImplementation(() => ({
    generateInitialScene: jest.fn(),
    generateContinuation: jest.fn(),
    generatePlayerChoices: mockGeneratePlayerChoices,
  })),
}));

jest.mock('@/state/narrativeStore', () => ({
  useNarrativeStore: jest.fn(),
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: jest.fn(),
}));

jest.mock('@/state/worldStore', () => ({
  useWorldStore: jest.fn(),
}));

jest.mock('@/state/npcStore', () => ({
  useNPCStore: jest.fn(),
}));

jest.mock('../NarrativeHistory', () => ({
  NarrativeHistory: () => <div data-testid="narrative-history" />,
}));

const renderWithToast = (ui: React.ReactElement) =>
  render(<ToastProvider>{ui}</ToastProvider>);

describe('NarrativeController context summary persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('persists contextSummary when storing generated decisions', async () => {
    const addDecision = jest.fn().mockReturnValue('decision-123');
    const getSessionSegments = jest.fn().mockReturnValue([
      {
        id: 'segment-1',
        sessionId: 'test-session',
        worldId: 'test-world',
        content: 'The hero stands at a crossroads.',
        type: 'scene',
        metadata: { tags: ['test'], location: 'Crossroads' },
        timestamp: new Date(),
      },
    ]);
    const getSessionDecisions = jest.fn().mockReturnValue([]);

    mockZustandStore(
      useNarrativeStore as jest.MockedFunction<typeof useNarrativeStore>,
      createMockNarrativeStore({
        _hasHydrated: true,
        addDecision,
        getSessionSegments,
        getSessionDecisions,
      })
    );

    mockZustandStore(
      useCharacterStore as jest.MockedFunction<typeof useCharacterStore>,
      createMockCharacterStore()
    );
    mockZustandStore(
      useWorldStore as jest.MockedFunction<typeof useWorldStore>,
      createMockWorldStore()
    );
    mockZustandStore(
      useNPCStore as jest.MockedFunction<typeof useNPCStore>,
      createMockNPCStore()
    );

    mockGeneratePlayerChoices.mockResolvedValue({
      id: 'decision-ai-1',
      prompt: 'What do you do?',
      options: [
        {
          id: 'option-1',
          text: 'Approach carefully',
          alignment: 'lawful',
        },
      ],
      decisionWeight: 'major',
      contextSummary: 'A tense standoff unfolds at the crossroads.',
    });

    renderWithToast(
      <NarrativeController
        worldId="test-world"
        sessionId="test-session"
        triggerGeneration={false}
        generateChoices
      />
    );

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(addDecision).toHaveBeenCalled();
    });

    expect(addDecision).toHaveBeenCalledWith(
      'test-session',
      expect.objectContaining({
        prompt: 'What do you do?',
        decisionWeight: 'major',
        contextSummary: 'A tense standoff unfolds at the crossroads.',
      })
    );

    // Post-hydration choice generation should fire exactly once (no double-trigger).
    expect(addDecision).toHaveBeenCalledTimes(1);
  });
});
