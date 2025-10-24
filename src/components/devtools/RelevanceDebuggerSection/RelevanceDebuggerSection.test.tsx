import React from 'react';
import { render, screen, within, waitFor, fireEvent, act } from '@testing-library/react';
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
  createdAt: overrides.createdAt ?? new Date('2025-10-20T10:00:00.000Z'),
  updatedAt: overrides.updatedAt ?? new Date('2025-10-20T10:00:00.000Z'),
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
    expect(totalSummary).toHaveTextContent('Total Decisions');
    expect(totalSummary).toHaveTextContent('2');
    expect(screen.getByTestId('relevance-summary-relevant')).toHaveTextContent('Above Threshold');
    expect(screen.getByTestId('relevance-summary-average')).toHaveTextContent('Average Score');

    expect(within(rows[1]).getByText(/Investigate the glowing glyphs/i)).toBeInTheDocument();
    expect(within(rows[2]).getByText(/Do you approach the guardian spirit/i)).toBeInTheDocument();
  });

  it('reorders decisions when weights are adjusted to prioritize recency', async () => {
    const matchingSegment = buildSegment({
      id: 'segment-match',
      metadata: {
        tags: ['ancient', 'ritual'],
        location: 'Ancient Ruins',
        characterIds: ['npc-guide'],
      },
      content: 'The guardian spirit watches closely as you enter.',
    });

    const decisions = [
      buildDecision({
        id: 'recent-decision',
        prompt: 'Do you aid the villager immediately?',
        choiceText: 'Rush to help',
        choiceType: 'helpful',
        timestamp: '2025-10-23T11:30:00.000Z',
        context: {
          location: 'Crystal Keep',
          situation: 'A villager is trapped under rubble.',
          charactersPresent: ['npc-villager'],
        },
      }),
      buildDecision({
        id: 'context-decision',
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
          'segment-match': matchingSegment,
        },
        sessionSegments: {
          ...state.sessionSegments,
          'session-123': ['segment-match'],
        },
      }));
    });

    render(<RelevanceDebuggerSection />);

    const table = await screen.findByTestId('relevance-scores-table');

    await waitFor(() => {
      const rows = within(table).getAllByRole('row');
      expect(within(rows[1]).getByText(/guardian spirit/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('weight-input-recency'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('weight-input-context'), { target: { value: '0' } });
    fireEvent.change(screen.getByTestId('weight-input-impact'), { target: { value: '0' } });
    fireEvent.change(screen.getByTestId('weight-input-tagMatch'), { target: { value: '0' } });
    fireEvent.change(screen.getByTestId('weight-input-character'), { target: { value: '0' } });

    await waitFor(() => {
      const rows = within(table).getAllByRole('row');
      expect(within(rows[1]).getByText(/aid the villager/i)).toBeInTheDocument();
    });
  });
});
