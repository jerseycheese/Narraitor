import React from 'react';
import { render, screen, act } from '@testing-library/react';
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
import { ToastProvider } from '@/components/ui/toast';

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

jest.mock('@/lib/narrative/turnResolver', () => ({
  resolveTurn: jest.fn(),
  resolveInitialTurn: jest.fn(),
  readSnapshot: jest.fn(),
}));

jest.mock('../NarrativeHistory', () => ({
  NarrativeHistory: () => <div data-testid="narrative-history" />,
}));

describe('NarrativeController session pacing integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    const existingSegments = Array.from({ length: 5 }, (_, i) => ({
      id: `seg-${i + 1}`,
      sessionId: 'test-session',
      worldId: 'test-world',
      content: `Story beat ${i + 1}`,
      type: 'scene' as const,
      metadata: { tags: [] },
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      characterIds: [],
    }));

    mockZustandStore(
      useNarrativeStore as jest.MockedFunction<typeof useNarrativeStore>,
      createMockNarrativeStore({
        _hasHydrated: true,
        getSessionSegments: jest.fn().mockReturnValue(existingSegments),
        getSessionDecisions: jest.fn().mockReturnValue([]),
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
    jest.useRealTimers();
  });

  it('renders SessionBreakPrompt when break interval passes with enableSessionPacing=true', async () => {
    render(
      <ToastProvider>
        <NarrativeController
          worldId="test-world"
          sessionId="test-session"
          triggerGeneration={false}
          generateChoices={false}
          enableSessionPacing={true}
        />
      </ToastProvider>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Advance 15 minutes
    await act(async () => {
      jest.advanceTimersByTime(15 * 60 * 1000);
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Good stopping point')).toBeInTheDocument();
  });
});
