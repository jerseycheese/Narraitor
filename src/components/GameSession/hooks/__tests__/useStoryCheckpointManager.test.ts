import { renderHook, act } from '@testing-library/react';
import { useStoryCheckpointManager } from '../useStoryCheckpointManager';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { aiFetch } from '@/lib/ai/aiFetch';

jest.mock('@/lib/ai/aiFetch', () => ({
  aiFetch: jest.fn(),
}));

jest.mock('@/state/worldStore', () => ({
  useWorldStore: Object.assign(jest.fn(), { getState: jest.fn() }),
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: jest.fn(),
}));

jest.mock('@/state/narrativeStore', () => ({
  useNarrativeStore: {
    getState: jest.fn(() => ({
      getSessionDecisions: jest.fn(() => []),
      getSessionSegments: jest.fn(() => []),
    })),
  },
}));

const mockAiFetch = aiFetch as jest.MockedFunction<typeof aiFetch>;
const mockUseWorldStore = useWorldStore as unknown as jest.Mock & { getState: jest.Mock };
const mockUseCharacterStore = useCharacterStore as unknown as jest.Mock;
const mockUpdateWorldState = jest.fn();

const pendingEvent = {
  id: 'event-1',
  description: 'Something happened',
  timestamp: '2026-01-01T00:00:00.000Z',
  sessionId: 'session-1',
  characterId: 'char-1',
};

const setupWorldState = (majorEvents = [pendingEvent]) => {
  mockUseWorldStore.mockImplementation((selector) =>
    selector({
      worldStates: {
        'world-1': { majorEvents, storyCheckpoints: [] },
      },
      worlds: {
        'world-1': { toneSettings: undefined },
      },
    })
  );
  mockUseWorldStore.getState.mockReturnValue({ updateWorldState: mockUpdateWorldState });
};

describe('useStoryCheckpointManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    setupWorldState();
    mockUseCharacterStore.mockImplementation((selector) => selector({ characters: {} }));
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('does not re-fire createCheckpoint after a failure without new pending events', async () => {
    mockAiFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Checkpoint API is down' }),
    } as unknown as Response);

    const { result } = renderHook(() =>
      useStoryCheckpointManager({ worldId: 'world-1', sessionId: 'session-1' })
    );

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockAiFetch).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('error');

    // Same pending events, no new major event since the failure — the old bug
    // re-armed the debounce timer on every status change and retried forever.
    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockAiFetch).toHaveBeenCalledTimes(1);
  });

  it('retries once a new major event arrives after a failure', async () => {
    mockAiFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Checkpoint API is down' }),
    } as unknown as Response);

    const { rerender } = renderHook(
      ({ majorEvents }) => {
        setupWorldState(majorEvents);
        return useStoryCheckpointManager({ worldId: 'world-1', sessionId: 'session-1' });
      },
      { initialProps: { majorEvents: [pendingEvent] } }
    );

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockAiFetch).toHaveBeenCalledTimes(1);

    const newEvent = { ...pendingEvent, id: 'event-2', timestamp: '2026-01-01T00:05:00.000Z' };
    rerender({ majorEvents: [pendingEvent, newEvent] });

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockAiFetch).toHaveBeenCalledTimes(2);
  });
});
