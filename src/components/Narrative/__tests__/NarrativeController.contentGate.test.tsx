/**
 * The controller keeps its own React array of segments and renders from it, so
 * gating only the object the store keeps would leave the player reading the
 * ungated text on the turn it is generated and only fix it after a reload.
 * These assert the rendered passage and the journal/ending callback payload,
 * not the stored object.
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
  createMockNPCStore,
  createMockWorldStore,
  mockZustandStore,
} from '@/lib/test-utils';
import { ToastProvider } from '@/components/ui/toast/toaster';
import type { NarrativeSegment } from '@/types/narrative.types';

const PROSE = 'Rain slicked the cobbles as Mira pushed the gate open.';

const RAW_GENERATED_CONTENT = [
  PROSE,
  '',
  '<details open><summary>World Clock</summary>',
  '- (deadline, open 4 turns) The magistrate arrives at dusk.',
  '</details>',
  '',
  '**Player Status:**',
  '- Wounded (left arm)',
].join('\n');

const mockGenerateInitialScene = jest.fn();

jest.mock('@/lib/ai/defaultGeminiClient', () => ({
  createDefaultGeminiClient: jest.fn(() => ({ generateContent: jest.fn() })),
}));

jest.mock('@/lib/ai/narrativeGenerator', () => ({
  NarrativeGenerator: jest.fn().mockImplementation(() => ({
    generateInitialScene: mockGenerateInitialScene,
    generateSegment: jest.fn(),
    generatePlayerChoices: jest.fn(),
  })),
}));

// Post-segment extraction is a fire-and-forget AI round trip, irrelevant here.
jest.mock('@/lib/narrative/applyWorldClockUpdates', () => ({
  applyWorldClockUpdates: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/narrative/applyWorldStateThreadUpdates', () => ({
  applyWorldStateThreadUpdates: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../useEndingDetection', () => ({
  useEndingDetection: () => ({ checkForEndingIndicators: jest.fn() }),
}));

jest.mock('@/lib/narrative/turnResolver', () => ({
  resolveTurn: jest.fn(),
  resolveInitialTurn: jest.fn(),
  readSnapshot: jest.fn(),
}));

jest.mock('@/state/characterStore', () => ({ useCharacterStore: jest.fn() }));
jest.mock('@/state/worldStore', () => ({ useWorldStore: jest.fn() }));
jest.mock('@/state/npcStore', () => ({ useNPCStore: jest.fn() }));

// Renders what the controller's LOCAL array holds - the player's actual view.
jest.mock('../NarrativeHistory', () => ({
  NarrativeHistory: ({ segments }: { segments: NarrativeSegment[] }) => (
    <div data-testid="narrative-history">
      {segments.map((segment) => (
        <div key={segment.id} data-testid="rendered-segment">
          {segment.content}
        </div>
      ))}
    </div>
  ),
}));

describe('NarrativeController - the rendered passage is gated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNarrativeStore.getState().reset();
    useNarrativeStore.setState({ _hasHydrated: true });

    mockGenerateInitialScene.mockResolvedValue({
      content: RAW_GENERATED_CONTENT,
      segmentType: 'scene',
      metadata: { characterIds: [], tags: [], location: 'Harrowgate' },
    });

    // The resolver gates the content via addSegment internally. The controller
    // receives the gated result from TurnResult.segment.
    const { resolveInitialTurn } = jest.requireMock('@/lib/narrative/turnResolver');
    (resolveInitialTurn as jest.Mock).mockResolvedValue({
      segment: {
        id: 'seg-resolved',
        content: PROSE,
        type: 'scene',
        sessionId: 'test-session',
        worldId: 'test-world',
        characterIds: [],
        metadata: { characterIds: [], tags: [], location: 'Harrowgate' },
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      snapshot: { sessionId: 'test-session' },
      isFatal: false,
      isEnding: false,
    });

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
    useNarrativeStore.getState().reset();
  });

  const renderController = async (onNarrativeGenerated: jest.Mock) => {
    await act(async () => {
      render(
        <ToastProvider>
          <NarrativeController
            worldId="test-world"
            sessionId="test-session"
            triggerGeneration={true}
            generateChoices={false}
            onNarrativeGenerated={onNarrativeGenerated}
          />
        </ToastProvider>
      );
    });
  };

  it('renders the passage without the bookkeeping the generator wrapped it in', async () => {
    await renderController(jest.fn());

    const rendered = await screen.findByTestId('rendered-segment');

    expect(rendered.textContent).toBe(PROSE);
  });

  it('hands the gated passage to the journal callback, not the raw one', async () => {
    const onNarrativeGenerated = jest.fn();

    await renderController(onNarrativeGenerated);

    expect(onNarrativeGenerated).toHaveBeenCalledTimes(1);
    expect(onNarrativeGenerated.mock.calls[0][0].content).toBe(PROSE);
  });
});
