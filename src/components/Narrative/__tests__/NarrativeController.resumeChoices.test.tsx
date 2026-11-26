/**
 * A reload between a passage and its choices leaves the answered decision as
 * the session's latest. The controller has to ask for the passage's own.
 */

import React from 'react';
import { act, render } from '@testing-library/react';

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
import type { NarrativeStore } from '@/state/narrativeStore.types';

const mockGeneratePlayerChoices = jest.fn();
jest.mock('../hooks/usePlayerChoices', () => ({
  usePlayerChoices: () => ({
    isGeneratingChoices: false,
    generatePlayerChoices: mockGeneratePlayerChoices,
  }),
}));
jest.mock('@/lib/ai/defaultGeminiClient', () => ({
  createDefaultGeminiClient: jest.fn(() => ({ generateContent: jest.fn() })),
}));
jest.mock('@/lib/ai/narrativeGenerator', () => ({
  NarrativeGenerator: jest.fn().mockImplementation(() => ({
    generateInitialScene: jest.fn(),
    generateSegment: jest.fn(),
    generatePlayerChoices: jest.fn(),
  })),
}));
jest.mock('@/state/narrativeStore', () => ({ useNarrativeStore: jest.fn() }));
jest.mock('@/state/characterStore', () => ({ useCharacterStore: jest.fn() }));
jest.mock('@/state/worldStore', () => ({ useWorldStore: jest.fn() }));
jest.mock('@/state/npcStore', () => ({ useNPCStore: jest.fn() }));
jest.mock('../NarrativeHistory', () => ({
  NarrativeHistory: () => <div data-testid="narrative-history" />,
}));

const resumeWith = (causedByDecisionId: string) => {
  const segment = {
    id: 'seg-2',
    sessionId: 'test-session',
    worldId: 'test-world',
    content: 'The stair creaks under you.',
    type: 'scene' as const,
    metadata: { tags: [], characterIds: [], causedByDecisionId },
    timestamp: new Date(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    characterIds: [],
  };
  const narrativeStoreMock = createMockNarrativeStore({
    _hasHydrated: true,
    segments: { 'seg-2': segment },
    sessionSegments: { 'test-session': ['seg-2'] },
    endedSessions: {},
    getSessionSegments: jest.fn().mockReturnValue([segment]),
    getSessionDecisions: jest.fn().mockReturnValue([
      { id: 'decision-2', prompt: 'Now what?', options: [], selectedOptionId: 'option-1' },
    ]),
  }) as unknown as NarrativeStore;
  mockZustandStore(useNarrativeStore as jest.MockedFunction<typeof useNarrativeStore>, narrativeStoreMock);
  mockZustandStore(useCharacterStore as jest.MockedFunction<typeof useCharacterStore>, createMockCharacterStore());
  mockZustandStore(useWorldStore as jest.MockedFunction<typeof useWorldStore>, createMockWorldStore());
  mockZustandStore(useNPCStore as jest.MockedFunction<typeof useNPCStore>, createMockNPCStore());

  render(
    <ToastProvider>
      <NarrativeController
        worldId="test-world"
        sessionId="test-session"
        triggerGeneration={false}
        generateChoices
      />
    </ToastProvider>
  );
};

describe('NarrativeController - resuming a session between a passage and its choices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  it('generates choices when the latest decision produced the latest passage', async () => {
    await act(async () => resumeWith('decision-2'));
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(mockGeneratePlayerChoices).toHaveBeenCalledTimes(1);
  });

  it('keeps the decision on offer when the passage came from an earlier one', async () => {
    await act(async () => resumeWith('decision-1'));
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(mockGeneratePlayerChoices).not.toHaveBeenCalled();
  });
});
