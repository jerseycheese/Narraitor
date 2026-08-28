/**
 * Verifies the per-turn generation failure path (#1478): a rejected segment
 * call is classified and captured into narrativeStore.generationError so the
 * play surface can show an inline error + Retry instead of hanging on the
 * "Continuing your story..." skeleton. Covers BOTH the reject and resolve
 * paths — a successful turn must not leave an error behind.
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
jest.mock('@/state/characterStore', () => ({ useCharacterStore: jest.fn() }));
jest.mock('@/state/worldStore', () => ({ useWorldStore: jest.fn() }));
jest.mock('@/state/npcStore', () => ({ useNPCStore: jest.fn() }));

const mockResolveTurn = jest.fn();
jest.mock('@/lib/narrative/turnResolver', () => ({
  resolveTurn: (...args: unknown[]) => mockResolveTurn(...args),
  resolveInitialTurn: jest.fn(),
  readSnapshot: jest.fn(),
}));

jest.mock('../NarrativeHistory', () => ({
  NarrativeHistory: () => <div data-testid="narrative-history" />,
}));

const renderWithToast = (ui: React.ReactElement) =>
  render(<ToastProvider>{ui}</ToastProvider>);

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

let narrativeStoreMock: NarrativeStore;

const seedStores = () => {
  narrativeStoreMock = createMockNarrativeStore({
    _hasHydrated: true,
    getSessionSegments: jest.fn().mockReturnValue([existingSegment]),
    getSessionDecisions: jest.fn().mockReturnValue([
      {
        id: 'decision-1',
        sessionId: 'test-session',
        worldId: 'test-world',
        prompt: 'What do you do?',
        options: [
          { id: 'choice-1', text: 'Go left', isCustomInput: false },
        ],
        decisionWeight: 'minor',
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]),
  }) as unknown as NarrativeStore;

  mockZustandStore(
    useNarrativeStore as jest.MockedFunction<typeof useNarrativeStore>,
    narrativeStoreMock
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
};

const flush = async () => {
  // Let the rejected/resolved race settle and the catch/then run.
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('NarrativeController — generation error capture (#1478)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    seedStores();
  });

  it('captures a classified, retryable error when the segment call rejects', async () => {
    mockResolveTurn.mockRejectedValue(new Error('network request failed'));

    renderWithToast(
      <NarrativeController
        worldId="test-world"
        sessionId="test-session"
        triggerGeneration={true}
        generateChoices={false}
        choiceId="choice-1"
      />
    );

    await flush();

    expect(narrativeStoreMock.setGenerationError).toHaveBeenCalledWith(
      expect.objectContaining({ retryable: true })
    );
  });

  it('does not leave an error behind when the segment call resolves', async () => {
    mockResolveTurn.mockResolvedValue({
      segment: {
        id: 'seg-resolved',
        content: 'The path bends north.',
        type: 'scene',
        sessionId: 'test-session',
        worldId: 'test-world',
        characterIds: [],
        metadata: { characterIds: [], tags: [], location: 'North Path' },
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      snapshot: { sessionId: 'test-session' },
      isFatal: false,
      isEnding: false,
      reconciliationErrors: [],
    });

    renderWithToast(
      <NarrativeController
        worldId="test-world"
        sessionId="test-session"
        triggerGeneration={true}
        generateChoices={false}
        choiceId="choice-1"
      />
    );

    await flush();

    // The error is cleared at the start of every attempt and never set on success.
    expect(narrativeStoreMock.clearGenerationError).toHaveBeenCalled();
    expect(narrativeStoreMock.setGenerationError).not.toHaveBeenCalled();
  });
});
