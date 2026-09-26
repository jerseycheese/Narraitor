import React from 'react';
import { act, render } from '@testing-library/react';

import { NarrativeController } from '../NarrativeController';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { useNPCStore } from '@/state/npcStore';
import {
  createMockCharacter,
  createMockCharacterStore,
  createMockNarrativeStore,
  createMockNPCStore,
  createMockWorld,
  createMockWorldStore,
  mockZustandStore,
} from '@/lib/test-utils';
import { ToastProvider } from '@/components/ui/toast/toaster';
import type { NarrativeSegment } from '@/types/narrative.types';

const mockGenerateSegment = jest.fn();
const mockGeneratePlayerChoices = jest.fn();

jest.mock('@/lib/ai/defaultGeminiClient', () => ({
  createDefaultGeminiClient: jest.fn(() => ({ generateContent: jest.fn() })),
}));

jest.mock('@/lib/ai/narrativeGenerator', () => ({
  NarrativeGenerator: jest.fn().mockImplementation(() => ({
    generateInitialScene: jest.fn(),
    generateSegment: mockGenerateSegment,
    generatePlayerChoices: mockGeneratePlayerChoices,
  })),
}));

const mockResolveTurn = jest.fn();
jest.mock('@/lib/narrative/turnResolver', () => ({
  resolveTurn: (...args: unknown[]) => mockResolveTurn(...args),
  resolveInitialTurn: jest.fn(),
  readSnapshot: jest.fn(),
}));

jest.mock('../NarrativeHistory', () => ({
  NarrativeHistory: () => <div data-testid="narrative-history" />,
}));

jest.mock('@/state/narrativeStore', () => ({ useNarrativeStore: jest.fn() }));
jest.mock('@/state/characterStore', () => ({ useCharacterStore: jest.fn() }));
jest.mock('@/state/worldStore', () => ({ useWorldStore: jest.fn() }));
jest.mock('@/state/npcStore', () => ({ useNPCStore: jest.fn() }));

const makeSegment = (id: string, tags: string[] = []): NarrativeSegment => ({
  id,
  content: 'The narrative continues.',
  type: 'scene',
  sessionId: 'test-session',
  worldId: 'test-world',
  characterIds: [],
  metadata: { characterIds: [], tags },
  timestamp: new Date(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const seedStores = () => {
  mockZustandStore(
    useNarrativeStore as jest.MockedFunction<typeof useNarrativeStore>,
    createMockNarrativeStore({
      _hasHydrated: true,
      getSessionSegments: jest.fn().mockReturnValue([makeSegment('seg-0')]),
      getSessionDecisions: jest.fn().mockReturnValue([
        {
          id: 'dec-1',
          prompt: 'What do you do?',
          options: [{ id: 'choice-1', text: 'Step forward' }],
        },
      ]),
    })
  );
  mockZustandStore(
    useCharacterStore as jest.MockedFunction<typeof useCharacterStore>,
    createMockCharacterStore({
      characters: {
        'test-char': createMockCharacter({ id: 'test-char', worldId: 'test-world' }),
      },
    })
  );
  mockZustandStore(
    useWorldStore as jest.MockedFunction<typeof useWorldStore>,
    createMockWorldStore({
      worlds: {
        'test-world': createMockWorld({ id: 'test-world', name: 'World' }),
      },
    })
  );
  mockZustandStore(
    useNPCStore as jest.MockedFunction<typeof useNPCStore>,
    createMockNPCStore()
  );
};

describe('NarrativeController — fatal turn resolution & choices suppression (#2168)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    seedStores();
  });

  it('triggers suggestEnding and clears choices loading when turnResult isFatal and isEnding', async () => {
    const onEndingSuggested = jest.fn();
    const onChoicesGenerated = jest.fn();

    const fatalSegment = makeSegment('seg-fatal', ['fatal-outcome']);
    mockResolveTurn.mockResolvedValueOnce({
      segment: fatalSegment,
      snapshot: { sessionId: 'test-session' },
      status: 'settled',
      isFatal: true,
      isEnding: true,
      reconciliationErrors: [],
    });

    await act(async () => {
      render(
        <ToastProvider>
          <NarrativeController
            worldId="test-world"
            sessionId="test-session"
            characterId="test-char"
            choiceId="choice-1"
            triggerGeneration={true}
            generateChoices={true}
            onEndingSuggested={onEndingSuggested}
            onChoicesGenerated={onChoicesGenerated}
          />
        </ToastProvider>
      );
    });

    // 1. suggestEnding must be called synchronously with a fatal reason
    expect(onEndingSuggested).toHaveBeenCalledTimes(1);
    expect(onEndingSuggested.mock.calls[0][0]).toMatch(/^fatal:/);
    expect(onEndingSuggested.mock.calls[0][1]).toBe('story-complete');

    // 2. Choice generator must NOT be called
    expect(mockGeneratePlayerChoices).not.toHaveBeenCalled();

    // 3. onChoicesGenerated must be called with empty options to clear the loading skeleton
    expect(onChoicesGenerated).toHaveBeenCalledTimes(1);
    expect(onChoicesGenerated).toHaveBeenCalledWith({
      id: '',
      prompt: '',
      options: [],
    });
  });
});
