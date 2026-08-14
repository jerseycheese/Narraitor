import React from 'react';
import { render, screen } from '@testing-library/react';
import { StorySummarySection } from '../StorySummarySection';
import { useStoryCheckpointManager } from '../hooks/useStoryCheckpointManager';
import { useWorldStore } from '@/state/worldStore';
import { StoryCheckpoint } from '@/types/world-state.types';

jest.mock('../hooks/useStoryCheckpointManager');
jest.mock('@/state/worldStore');

const mockUseStoryCheckpointManager = useStoryCheckpointManager as jest.MockedFunction<typeof useStoryCheckpointManager>;
const mockUseWorldStore = useWorldStore as jest.MockedFunction<typeof useWorldStore>;

const setupHook = (overrides: Partial<ReturnType<typeof useStoryCheckpointManager>> = {}) => {
  mockUseStoryCheckpointManager.mockReturnValue({
    status: 'idle',
    error: null,
    latestCheckpoint: null,
    pendingEvents: [],
    recentEvents: [],
    createCheckpoint: jest.fn(),
    hasPendingEvents: false,
    characterNameLookup: { 'char-1': 'Marin' },
    ...overrides,
  } as ReturnType<typeof useStoryCheckpointManager>);
};

const setupWorldStore = (checkpoints: StoryCheckpoint[] = []) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseWorldStore.mockImplementation((selector: any) => {
    const state = {
      worldStates: {
        'world-1': {
          storyCheckpoints: checkpoints,
        },
      },
    };
    return selector(state);
  });
};

describe('StorySummarySection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows empty message when no checkpoints exist', () => {
    setupHook();
    setupWorldStore([]);
    render(<StorySummarySection worldId="world-1" sessionId="session-1" />);

    expect(screen.getByText(/Your story will appear here once major events occur/i)).toBeInTheDocument();
  });

  it('shows a distinct failure message instead of the empty placeholder when the checkpoint request errored', () => {
    setupHook({ status: 'error', error: 'Checkpoint API is down' });
    setupWorldStore([]);
    render(<StorySummarySection worldId="world-1" sessionId="session-1" />);

    expect(screen.getByText('Checkpoint API is down')).toBeInTheDocument();
    expect(screen.queryByText(/Your story will appear here once major events occur/i)).not.toBeInTheDocument();
  });

  it('renders checkpoint segment from a single checkpoint', () => {
    const checkpoint: StoryCheckpoint = {
      id: 'checkpoint-1',
      segment: 'Heroes defeated the shadow court and liberated the citadel.',
      highlights: ['Shadow court dismantled', 'Citadel liberated'],
      eventIds: ['event-1'],
      decisionIds: ['decision-1'],
      createdAt: '2025-11-20T17:00:00Z',
      sessionId: 'session-1',
      metadata: {},
    };

    setupHook({ latestCheckpoint: checkpoint });
    setupWorldStore([checkpoint]);

    render(<StorySummarySection worldId="world-1" sessionId="session-1" />);

    expect(screen.getByText(/Heroes defeated the shadow court/i)).toBeInTheDocument();
  });

  it('concatenates multiple checkpoint segments in chronological order', () => {
    const checkpoint1: StoryCheckpoint = {
      id: 'checkpoint-1',
      segment: 'The hero arrived in the village.',
      highlights: ['Arrived in village'],
      eventIds: ['event-1'],
      createdAt: '2025-11-20T17:00:00Z',
      sessionId: 'session-1',
      metadata: {},
    };

    const checkpoint2: StoryCheckpoint = {
      id: 'checkpoint-2',
      segment: 'The hero defeated the bandits.',
      highlights: ['Bandits defeated'],
      eventIds: ['event-2'],
      createdAt: '2025-11-20T17:05:00Z',
      sessionId: 'session-1',
      metadata: {},
    };

    setupHook({ latestCheckpoint: checkpoint2 });
    setupWorldStore([checkpoint2, checkpoint1]); // Out of order

    render(<StorySummarySection worldId="world-1" sessionId="session-1" />);

    // Verify both segments appear in chronological order
    expect(screen.getByText(/arrived in the village/i)).toBeInTheDocument();
    expect(screen.getByText(/defeated the bandits/i)).toBeInTheDocument();

    // Verify order by checking the full content
    const container = screen.getByTestId('story-summary-section');
    const text = container.textContent || '';
    const arrivedIndex = text.indexOf('arrived in the village');
    const defeatedIndex = text.indexOf('defeated the bandits');
    expect(arrivedIndex).toBeLessThan(defeatedIndex);
  });

  it('shows only checkpoints for the current session', () => {
    const sessionCheckpoint: StoryCheckpoint = {
      id: 'checkpoint-1',
      segment: 'This is from the current session.',
      highlights: [],
      eventIds: ['event-1'],
      createdAt: '2025-11-20T17:00:00Z',
      sessionId: 'session-1',
      metadata: {},
    };

    const otherSessionCheckpoint: StoryCheckpoint = {
      id: 'checkpoint-2',
      segment: 'This is from another session.',
      highlights: [],
      eventIds: ['event-2'],
      createdAt: '2025-11-20T17:05:00Z',
      sessionId: 'session-2',
      metadata: {},
    };

    setupHook({ latestCheckpoint: sessionCheckpoint });
    setupWorldStore([sessionCheckpoint, otherSessionCheckpoint]);

    render(<StorySummarySection worldId="world-1" sessionId="session-1" />);

    expect(screen.getByText(/from the current session/i)).toBeInTheDocument();
    expect(screen.queryByText(/from another session/i)).not.toBeInTheDocument();
  });
});
