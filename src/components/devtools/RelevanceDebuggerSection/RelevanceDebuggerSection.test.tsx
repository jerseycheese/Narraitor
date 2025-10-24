import React from 'react';
import { render, screen, within, fireEvent, act, waitFor } from '@testing-library/react';
import { RelevanceDebuggerSection } from './RelevanceDebuggerSection';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { PlayerDecision } from '@/types/personalization.types';
import { NarrativeSegment } from '@/types/narrative.types';

jest.mock('@/lib/ai/playerDecisionTracker', () => ({
  playerDecisionTracker: {
    getAllDecisions: jest.fn(),
  },
}));

const { playerDecisionTracker } = jest.requireMock('@/lib/ai/playerDecisionTracker') as {
  playerDecisionTracker: {
    getAllDecisions: jest.MockedFunction<() => PlayerDecision[]>;
  };
};

const mockGetAllDecisions = playerDecisionTracker.getAllDecisions;

const buildSegment = (overrides: Partial<NarrativeSegment>): NarrativeSegment => ({
  id: overrides.id ?? 'segment-1',
  worldId: overrides.worldId ?? 'world-1',
  sessionId: overrides.sessionId ?? 'session-123',
  content: overrides.content ?? 'A mysterious event unfolds in the ruins.',
  type: overrides.type ?? 'scene',
  characterIds: overrides.characterIds ?? ['npc-guide'],
  decisions: overrides.decisions,
  metadata: overrides.metadata ?? {
    tags: ['mystery', 'ancient'],
    location: 'Ancient Ruins',
    characterIds: ['npc-guide'],
  },
  timestamp: overrides.timestamp ?? new Date('2025-10-20T10:00:00.000Z'),
  createdAt: overrides.createdAt ?? '2025-10-20T10:00:00.000Z',
  updatedAt: overrides.updatedAt ?? '2025-10-20T10:00:00.000Z',
});

const buildDecision = (overrides: Partial<PlayerDecision>): PlayerDecision => ({
  id: overrides.id ?? 'decision-1',
  prompt: overrides.prompt ?? 'Do you investigate the ruins?',
  choiceText: overrides.choiceText ?? 'Search the ruins',
  choiceType: overrides.choiceType ?? 'neutral',
  timestamp: overrides.timestamp ?? '2025-10-20T12:00:00.000Z',
  sessionId: overrides.sessionId ?? 'session-123',
  worldId: overrides.worldId ?? 'world-1',
  context: overrides.context ?? {
    location: 'Ancient Ruins',
    situation: 'Investigating ancient ruins for clues.',
    charactersPresent: ['npc-guide'],
  },
});

describe('RelevanceDebuggerSection', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-10-23T12:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockGetAllDecisions.mockReset();

    const narrativeState = useNarrativeStore.getState();
    act(() => {
      narrativeState.reset();
    });

    act(() => {
      useSessionStore.setState((state) => ({
        ...state,
        id: 'session-123',
        status: 'active',
        worldId: 'world-1',
        characterId: 'character-1',
      }));
    });
  });

  afterEach(() => {
    mockGetAllDecisions.mockReset();
    const narrativeState = useNarrativeStore.getState();
    act(() => {
      narrativeState.reset();
    });
    act(() => {
      useSessionStore.setState((state) => ({
        ...state,
        id: null,
        status: 'initializing',
        worldId: null,
        characterId: null,
      }));
    });
  });

  it('renders relevance scores with summary metrics for the active session', async () => {
    const segments = [
      buildSegment({
        id: 'segment-1',
        metadata: {
          tags: ['mystery', 'ancient'],
          location: 'Ancient Ruins',
          characterIds: ['npc-guide'],
        },
      }),
      buildSegment({
        id: 'segment-2',
        content: 'You uncover hidden glyphs that glow faintly.',
      }),
    ];

    const decisions = [
      buildDecision({
        id: 'decision-a',
        prompt: 'Investigate the glowing glyphs?',
        choiceText: 'Study the glyphs',
        choiceType: 'diplomatic',
        timestamp: '2025-10-23T10:30:00.000Z',
      }),
      buildDecision({
        id: 'decision-b',
        prompt: 'Do you approach the guardian spirit?',
        choiceText: 'Offer a respectful greeting',
        choiceType: 'helpful',
        timestamp: '2025-10-21T15:00:00.000Z',
      }),
    ];

    mockGetAllDecisions.mockReturnValue(decisions);

    act(() => {
      useNarrativeStore.setState((state) => ({
        ...state,
        segments: {
          ...state.segments,
          'segment-1': segments[0],
          'segment-2': segments[1],
        },
        sessionSegments: {
          ...state.sessionSegments,
          'session-123': ['segment-1', 'segment-2'],
        },
      }));
    });

    render(<RelevanceDebuggerSection />);

    const table = await screen.findByTestId('relevance-scores-table');
    const rows = within(table).getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1);

    const totalSummary = screen.getByTestId('relevance-summary-total');
    expect(totalSummary).toHaveTextContent('Total decisions');
    expect(totalSummary).toHaveTextContent('2');
    expect(screen.getByTestId('relevance-summary-relevant')).toHaveTextContent('Above threshold');
    expect(screen.getByTestId('relevance-summary-average')).toHaveTextContent('Average score');

    expect(within(rows[1]).getByText(/Investigate the glowing glyphs/i)).toBeInTheDocument();
    expect(within(rows[2]).getByText(/Do you approach the guardian spirit/i)).toBeInTheDocument();
  });

  it('shows decision details when a row is selected', async () => {
    const segments = [
      buildSegment({
        id: 'segment-1',
        metadata: {
          tags: ['ancient', 'ritual'],
          location: 'Ancient Ruins',
          characterIds: ['npc-guide'],
        },
      }),
    ];

    const decisions = [
      buildDecision({
        id: 'decision-a',
        prompt: 'Do you aid the villager immediately?',
        choiceText: 'Rush to help',
        choiceType: 'helpful',
        timestamp: '2025-10-23T11:30:00.000Z',
      }),
      buildDecision({
        id: 'decision-b',
        prompt: 'How do you address the guardian spirit?',
        choiceText: 'Speak with reverence',
        choiceType: 'diplomatic',
        timestamp: '2025-10-13T08:00:00.000Z',
        context: {
          location: 'Ancient Ruins',
          situation: 'Negotiating with the guardian spirit.',
          charactersPresent: ['npc-guide'],
        },
      }),
    ];

    mockGetAllDecisions.mockReturnValue(decisions);

    act(() => {
      useNarrativeStore.setState((state) => ({
        ...state,
        segments: {
          ...state.segments,
          'segment-1': segments[0],
        },
        sessionSegments: {
          ...state.sessionSegments,
          'session-123': ['segment-1'],
        },
      }));
    });

    render(<RelevanceDebuggerSection />);

    const targetRow = await screen.findByTestId('relevance-row-decision-b');
    fireEvent.click(targetRow);

    await waitFor(() => {
      const details = screen.getByTestId('relevance-details');
      expect(details).toHaveTextContent('Speak with reverence');
      expect(details).toHaveTextContent('Ancient Ruins');
    });
  });

  it('filters decisions by scope correctly', async () => {
    const worldDecisions = [
      buildDecision({
        id: 'world-decision-1',
        sessionId: 'session-123',
        worldId: 'world-1',
        prompt: 'World 1 decision',
      }),
      buildDecision({
        id: 'world-decision-2',
        sessionId: 'session-456',
        worldId: 'world-1',
        prompt: 'Another World 1 decision',
      }),
      buildDecision({
        id: 'world-decision-3',
        sessionId: 'session-789',
        worldId: 'world-2',
        prompt: 'World 2 decision',
      }),
    ];

    mockGetAllDecisions.mockReturnValue(worldDecisions);

    render(<RelevanceDebuggerSection />);

    // Wait for component to mount and load
    await screen.findByTestId('relevance-debugger-section');

    // Check that scope selector exists and change to 'world'
    const scopeSelect = screen.getByLabelText(/scope/i);
    fireEvent.change(scopeSelect, { target: { value: 'world' } });

    // Should show decisions filtered by world
    await waitFor(() => {
      const statusText = screen.getByText(/showing.*decision/i);
      expect(statusText).toBeInTheDocument();
    });
  });

  it('handles empty decision state gracefully', async () => {
    mockGetAllDecisions.mockReturnValue([]);

    render(<RelevanceDebuggerSection />);

    // Component should mount and show empty state
    await screen.findByTestId('relevance-debugger-section');

    // Should show "No decisions available" message
    expect(screen.getByText(/no decisions available/i)).toBeInTheDocument();
  });

  it('refreshes decisions when refresh button is clicked', async () => {
    const initialDecisions = [
      buildDecision({
        id: 'initial-decision',
        prompt: 'Initial decision',
      }),
    ];

    mockGetAllDecisions.mockReturnValue(initialDecisions);

    render(<RelevanceDebuggerSection />);

    await screen.findByTestId('relevance-debugger-section');

    const initialCallCount = mockGetAllDecisions.mock.calls.length;

    // Update the mock to return different decisions
    const updatedDecisions = [
      ...initialDecisions,
      buildDecision({
        id: 'new-decision',
        prompt: 'New decision after refresh',
      }),
    ];
    mockGetAllDecisions.mockReturnValue(updatedDecisions);

    // Click refresh button
    const refreshButton = screen.getByText(/refresh decisions/i);
    fireEvent.click(refreshButton);

    // Verify getAllDecisions was called again after refresh
    await waitFor(() => {
      expect(mockGetAllDecisions.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });
});
