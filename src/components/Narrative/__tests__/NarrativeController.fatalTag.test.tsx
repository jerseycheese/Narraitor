/**
 * The fatal-outcome tag is stamped onto a segment by the post-segment
 * extraction, seconds after the segment itself. The controller has to see it
 * land in the store, not only at add time, and route it through the same
 * fatal ending path a critical-decision failure takes.
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

const makeSegment = (id: string, tags: string[]) => ({
  id,
  sessionId: 'test-session',
  worldId: 'test-world',
  content: 'You are simply gone.',
  type: 'scene' as const,
  metadata: { tags, characterIds: [] },
  timestamp: new Date(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  characterIds: [],
});

const seedStores = (tags: string[], endedSessions: Record<string, boolean> = {}) => {
  const segment = makeSegment('seg-1', tags);
  const narrativeStoreMock = createMockNarrativeStore({
    _hasHydrated: true,
    segments: { 'seg-1': segment },
    sessionSegments: { 'test-session': ['seg-1'] },
    endedSessions,
    getSessionSegments: jest.fn().mockReturnValue([segment]),
    getSessionDecisions: jest.fn().mockReturnValue([]),
  }) as unknown as NarrativeStore;
  mockZustandStore(useNarrativeStore as jest.MockedFunction<typeof useNarrativeStore>, narrativeStoreMock);
  mockZustandStore(useCharacterStore as jest.MockedFunction<typeof useCharacterStore>, createMockCharacterStore());
  mockZustandStore(useWorldStore as jest.MockedFunction<typeof useWorldStore>, createMockWorldStore());
  mockZustandStore(useNPCStore as jest.MockedFunction<typeof useNPCStore>, createMockNPCStore());
};

const renderController = (onEndingSuggested: jest.Mock) =>
  render(
    <ToastProvider>
      <NarrativeController
        worldId="test-world"
        sessionId="test-session"
        triggerGeneration={false}
        generateChoices={false}
        onEndingSuggested={onEndingSuggested}
      />
    </ToastProvider>
  );

describe('NarrativeController - a segment tagged fatal-outcome ends the session', () => {
  beforeEach(() => jest.clearAllMocks());

  it('suggests a fatal ending when a segment of the session carries the tag', async () => {
    seedStores(['fatal-outcome']);
    const onEndingSuggested = jest.fn();

    await act(async () => {
      renderController(onEndingSuggested);
    });

    expect(onEndingSuggested).toHaveBeenCalledTimes(1);
    expect(onEndingSuggested.mock.calls[0][0]).toMatch(/^fatal:/);
    expect(onEndingSuggested.mock.calls[0][1]).toBe('story-complete');
  });

  it('stays quiet when the tagged session already has its ending', async () => {
    // The tag outlives the session: a later mount that briefly renders with
    // the dead session's id must not re-suggest the ending it already has.
    seedStores(['fatal-outcome'], { 'test-session': true });
    const onEndingSuggested = jest.fn();

    await act(async () => {
      renderController(onEndingSuggested);
    });

    expect(onEndingSuggested).not.toHaveBeenCalled();
  });

  it('stays quiet when no segment carries the tag', async () => {
    seedStores(['woods']);
    const onEndingSuggested = jest.fn();

    await act(async () => {
      renderController(onEndingSuggested);
    });

    expect(onEndingSuggested).not.toHaveBeenCalled();
  });
});
