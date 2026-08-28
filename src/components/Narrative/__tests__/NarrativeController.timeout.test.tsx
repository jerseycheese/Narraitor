/**
 * Verifies that a hung per-choice segment call times out and surfaces the
 * error+retry path instead of spinning "Generating..." forever.
 *
 * The opening-scene path already has this guard; this test ensures
 * generateNextSegment has it too (#1429).
 */

import React from 'react';
import { act, render, screen } from '@testing-library/react';

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
import { AI_GENERATION_TIMEOUT_MS } from '@/lib/constants/timeouts';

// Mock generateSegment — will be set to a never-resolving promise in the test
const mockGenerateSegment = jest.fn();

jest.mock('@/lib/ai/defaultGeminiClient', () => ({
  createDefaultGeminiClient: jest.fn(() => ({
    generateContent: jest.fn(),
  })),
}));

jest.mock('@/lib/ai/narrativeGenerator', () => ({
  NarrativeGenerator: jest.fn().mockImplementation(() => ({
    generateInitialScene: jest.fn(),
    generateSegment: mockGenerateSegment,
    generatePlayerChoices: jest.fn().mockResolvedValue({
      id: 'decision-1',
      prompt: 'What do you do?',
      options: [],
      decisionWeight: 'minor',
    }),
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

const mockResolveTurn = jest.fn();
jest.mock('@/lib/narrative/turnResolver', () => ({
  resolveTurn: (...args: unknown[]) => mockResolveTurn(...args),
  resolveInitialTurn: jest.fn(),
  readSnapshot: jest.fn(),
}));

jest.mock('../NarrativeHistory', () => ({
  NarrativeHistory: ({
    isLoading,
    error,
  }: {
    isLoading: boolean;
    error?: string;
  }) => (
    <div data-testid="narrative-history">
      {isLoading && <span data-testid="loading-indicator">Generating...</span>}
      {error && <span data-testid="error-message">{error}</span>}
    </div>
  ),
}));

const renderWithToast = (ui: React.ReactElement) =>
  render(<ToastProvider>{ui}</ToastProvider>);

describe('NarrativeController — per-choice segment timeout (#1429)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Pre-existing segment so the controller skips initial generation and
    // goes straight to choice-based generation when a choiceId is supplied.
    const existingSegment = {
      id: 'seg-existing',
      sessionId: 'test-session',
      worldId: 'test-world',
      content: 'You stand at a crossroads.',
      type: 'scene' as const,
      metadata: { tags: [], location: 'Crossroads' },
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      characterIds: [],
    };

    mockZustandStore(
      useNarrativeStore as jest.MockedFunction<typeof useNarrativeStore>,
      createMockNarrativeStore({
        _hasHydrated: true,
        getSessionSegments: jest.fn().mockReturnValue([existingSegment]),
        getSessionDecisions: jest.fn().mockReturnValue([
          {
            id: 'decision-1',
            sessionId: 'test-session',
            worldId: 'test-world',
            prompt: 'What do you do?',
            options: [
              {
                id: 'choice-1',
                text: 'Go left',
                alignment: 'neutral',
                isCustomInput: false,
              },
            ],
            decisionWeight: 'minor',
            timestamp: new Date(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
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
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('surfaces error state after timeout when resolveTurn hangs', async () => {
    // Never-resolving promise simulates a hung resolver
    mockResolveTurn.mockReturnValue(new Promise(() => {}));

    renderWithToast(
      <NarrativeController
        worldId="test-world"
        sessionId="test-session"
        triggerGeneration={true}
        generateChoices={false}
        choiceId="choice-1"
      />
    );

    // Advance past AI_GENERATION_TIMEOUT_MS so the race rejects
    await act(async () => {
      jest.advanceTimersByTime(AI_GENERATION_TIMEOUT_MS + 100);
    });

    // The error message from the catch block must appear
    const errorEl = screen.getByTestId('error-message');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('Unable to generate narrative');

    // Loading state must have cleared — we should NOT see the loading indicator
    expect(screen.queryByTestId('loading-indicator')).toBeNull();
  });

  it('aborts the losing generation when the race times out', async () => {
    // Losing the race must cancel the request itself, not just abandon the
    // promise — otherwise the fetch lives on until aiFetch's outer ceiling
    // (a zombie that wastes spend and mutates stores when it settles).
    mockResolveTurn.mockReturnValue(new Promise(() => {}));

    renderWithToast(
      <NarrativeController
        worldId="test-world"
        sessionId="test-session"
        triggerGeneration={true}
        generateChoices={false}
        choiceId="choice-1"
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockResolveTurn).toHaveBeenCalledTimes(1);
    const command = mockResolveTurn.mock.calls[0][0] as { signal?: AbortSignal };
    expect(command?.signal).toBeInstanceOf(AbortSignal);
    expect(command?.signal?.aborted).toBe(false);

    await act(async () => {
      jest.advanceTimersByTime(AI_GENERATION_TIMEOUT_MS + 100);
    });

    expect(command?.signal?.aborted).toBe(true);
  });
});
