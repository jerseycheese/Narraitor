import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StorySummarySection } from '../StorySummarySection';
import { useStoryCheckpointManager } from '../hooks/useStoryCheckpointManager';
import { WorldStateMajorEvent, StoryCheckpoint } from '@/types/world-state.types';

jest.mock('../hooks/useStoryCheckpointManager');

const mockUseStoryCheckpointManager = useStoryCheckpointManager as jest.MockedFunction<typeof useStoryCheckpointManager>;

const mockEvent = (overrides: Partial<WorldStateMajorEvent> = {}): WorldStateMajorEvent => ({
  id: overrides.id ?? 'event-1',
  description: overrides.description ?? 'Dragons overrun the citadel',
  timestamp: overrides.timestamp ?? '2025-11-20T18:00:00Z',
  characterId: overrides.characterId ?? 'char-1',
  sessionId: overrides.sessionId ?? 'session-1',
});

const setupHook = (overrides: Partial<ReturnType<typeof useStoryCheckpointManager>> = {}) => {
  mockUseStoryCheckpointManager.mockReturnValue({
    status: 'idle',
    error: null,
    latestCheckpoint: undefined,
    pendingEvents: [],
    recentEvents: [],
    createCheckpoint: jest.fn(),
    hasPendingEvents: false,
    characterNameLookup: { 'char-1': 'Marin' },
    ...overrides,
  });
};

describe('StorySummarySection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows empty checkpoint message when none exist', () => {
    setupHook();
    render(<StorySummarySection worldId="world-1" sessionId="session-1" />);
    fireEvent.click(screen.getByTestId('collapsible-section-header'));

    expect(screen.getByText(/No checkpoints yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Major events will appear here once/i)).toBeInTheDocument();
  });

  it('renders latest checkpoint summary and highlights', () => {
    const checkpoint: StoryCheckpoint = {
      id: 'checkpoint-1',
      summary: 'Heroes defeated the shadow court.',
      highlights: ['Shadow court dismantled', 'Citadel liberated'],
      eventIds: ['event-1'],
      decisionIds: ['decision-1'],
      createdAt: '2025-11-20T17:00:00Z',
      sessionId: 'session-1',
      metadata: {},
    };

    setupHook({
      latestCheckpoint: checkpoint,
    });

    render(<StorySummarySection worldId="world-1" sessionId="session-1" />);
    fireEvent.click(screen.getByTestId('collapsible-section-header'));

    expect(screen.getByText(/Heroes defeated the shadow court/i)).toBeInTheDocument();
    expect(screen.getByText(/Shadow court dismantled/i)).toBeInTheDocument();
  });

  it('disables button when there are no pending events', () => {
    setupHook({ hasPendingEvents: false });
    render(<StorySummarySection worldId="world-1" sessionId="session-1" />);
    fireEvent.click(screen.getByTestId('collapsible-section-header'));

    expect(screen.getByRole('button', { name: /Create Checkpoint/i })).toBeDisabled();
  });

  it('calls createCheckpoint when button is clicked', () => {
    const createCheckpoint = jest.fn();
    setupHook({
      hasPendingEvents: true,
      pendingEvents: [mockEvent({ id: 'event-2', description: 'Bargained with ancient spirits' })],
      createCheckpoint,
    });

    render(<StorySummarySection worldId="world-1" sessionId="session-1" />);
    fireEvent.click(screen.getByTestId('collapsible-section-header'));
    const button = screen.getByRole('button', { name: /Create Checkpoint/i });
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(createCheckpoint).toHaveBeenCalled();
  });

  it('displays error text when hook reports an error', () => {
    setupHook({ error: 'Failed to summarize events.' });
    render(<StorySummarySection worldId="world-1" sessionId="session-1" />);
    fireEvent.click(screen.getByTestId('collapsible-section-header'));

    expect(screen.getByText(/Failed to summarize events/i)).toBeInTheDocument();
  });
});
