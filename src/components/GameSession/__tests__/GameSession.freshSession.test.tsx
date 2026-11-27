import React from 'react';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import GameSession from '../GameSession';
import { useGameSessionState } from '../hooks/useGameSessionState';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { createMockWorld, createMockCharacter } from '@/lib/test-utils';

jest.unmock('@/state/worldStore');
jest.unmock('@/state/characterStore');

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

jest.mock('@/state/persistence', () => ({
  ...jest.requireActual('@/state/persistence'),
  createIndexedDBStorage: () => ({
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  }),
  sweepAutoSaveSnapshots: jest.fn().mockResolvedValue(undefined),
}));

// Keep the session boundary real; replace provider generation with a supplied opening.
const mockGenerationSessionIds: string[] = [];

jest.mock('@/lib/narrative/applyWorldClockUpdates', () => ({
  applyWorldClockUpdates: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/narrative/applyWorldStateThreadUpdates', () => ({
  applyWorldStateThreadUpdates: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../ActiveGameSession', () => ({
  __esModule: true,
  default: ({ sessionId }: { sessionId: string }) => {
    mockGenerationSessionIds.push(sessionId);
    return (
      <button
        className="test-opening"
        onClick={() => {
          useNarrativeStore.getState().addSegment(sessionId, {
            content: 'A new adventure begins at the gate.',
            type: 'scene',
            metadata: { tags: ['intro'] },
            worldId: 'world-1',
            characterIds: ['character-1'],
            timestamp: new Date(),
            updatedAt: new Date().toISOString(),
          });
        }}
        data-session-id={sessionId}
      >
        Store opening
      </button>
    );
  },
}));

const endedSessionId = 'ended-session';

beforeEach(async () => {
  mockGenerationSessionIds.length = 0;
  await useSessionStore.persist.rehydrate();
  await useNarrativeStore.persist.rehydrate();
  useNarrativeStore.getState().reset();
  useSessionStore.setState({
    id: endedSessionId,
    status: 'initializing',
    worldId: 'world-1',
    characterId: 'character-1',
    error: null,
    playerChoices: [],
    savedSessions: {
      [endedSessionId]: {
        id: endedSessionId,
        worldId: 'world-1',
        characterId: 'character-1',
        lastPlayed: '2026-10-01T12:00:00.000Z',
        narrativeCount: 0,
      },
    },
    sessionLifecycle: {
      [endedSessionId]: {
        id: endedSessionId,
        worldId: 'world-1',
        characterId: 'character-1',
        status: 'active',
        lastActivity: '2026-10-01T12:00:00.000Z',
      },
    },
  });
  useNarrativeStore.getState().markSessionEnded(endedSessionId);
  useWorldStore.setState({
    worlds: { 'world-1': createMockWorld({ id: 'world-1' }) },
  });
  useCharacterStore.setState({
    currentCharacterId: 'character-1',
    characters: {
      'character-1': createMockCharacter({
        id: 'character-1',
        worldId: 'world-1',
        isPlayer: true,
      }),
    },
  });
});

it('stores a new opening after Start fresh with the same ended character', async () => {
  const { result } = renderHook(() =>
    useGameSessionState({ worldId: 'world-1', isClient: true })
  );
  await act(async () => {
    result.current.handleNewSession();
  });
  const sessionId = useSessionStore.getState().id!;
  act(() => {
    useNarrativeStore.getState().addSegment(sessionId, {
      content: 'A new adventure begins at the gate.',
      type: 'scene',
      metadata: { tags: ['intro'] },
      worldId: 'world-1',
      characterIds: ['character-1'],
      timestamp: new Date(),
      updatedAt: new Date().toISOString(),
    });
  });
  expect(sessionId).not.toBe(endedSessionId);
  expect(
    useNarrativeStore.getState().getSessionSegments(sessionId)
  ).toHaveLength(1);
  expect(useNarrativeStore.getState().isSessionEnded(endedSessionId)).toBe(
    true
  );
});

it('gives fresh=true generation the new session id before the opening arrives', async () => {
  useSessionStore.setState({ status: 'active' });
  await act(async () => {
    render(<GameSession worldId="world-1" disableAutoResume />);
  });
  await waitFor(() => expect(useSessionStore.getState().status).toBe('active'));
  expect(mockGenerationSessionIds.length).toBeGreaterThan(0);
  expect(new Set(mockGenerationSessionIds)).toEqual(
    new Set([useSessionStore.getState().id])
  );
  const button = screen.getByRole('button', { name: 'Store opening' });
  expect(button.getAttribute('data-session-id')).not.toBe(endedSessionId);
  fireEvent.click(button);
  expect(
    useNarrativeStore
      .getState()
      .getSessionSegments(useSessionStore.getState().id!)
  ).toHaveLength(1);
  expect(useNarrativeStore.getState().isSessionEnded(endedSessionId)).toBe(
    true
  );
});

it('remounts the play surface on a new session when Start New replaces a live story', async () => {
  useNarrativeStore.setState({ endedSessions: {} });
  useSessionStore.setState({ status: 'active' });
  let rerender: (ui: React.ReactElement) => void = () => {};
  await act(async () => {
    ({ rerender } = render(<GameSession worldId="world-1" />));
  });
  const livePlaySurface = screen.getByRole('button', { name: 'Store opening' });
  expect(useSessionStore.getState().id).toBe(endedSessionId);

  await act(async () => {
    rerender(<GameSession worldId="world-1" disableAutoResume />);
  });

  await waitFor(() =>
    expect(useSessionStore.getState().id).not.toBe(endedSessionId)
  );
  const newPlaySurface = screen.getByRole('button', { name: 'Store opening' });
  expect(newPlaySurface).not.toBe(livePlaySurface);
  expect(newPlaySurface.getAttribute('data-session-id')).toBe(
    useSessionStore.getState().id
  );
});

it('resumes the new session after saving, Start New, and saving again', async () => {
  const sessionClock = jest.spyOn(Date, 'now').mockReturnValue(1000);
  try {
    useSessionStore.setState({
      id: null,
      status: 'initializing',
      worldId: null,
      characterId: null,
      savedSessions: {},
      sessionLifecycle: {},
    });
    await useSessionStore
      .getState()
      .initializeSession('world-1', 'character-1');
    const previousSessionId = useSessionStore.getState().id!;
    useSessionStore
      .getState()
      .updateSavedSessionNarrativeCount(previousSessionId, 1);

    const { result } = renderHook(() =>
      useGameSessionState({ worldId: 'world-1', isClient: true })
    );
    sessionClock.mockReturnValue(2000);
    await act(async () => {
      result.current.handleNewSession();
    });
    const newSessionId = useSessionStore.getState().id!;
    expect(newSessionId).not.toBe(previousSessionId);
    act(() => {
      useSessionStore
        .getState()
        .updateSavedSessionNarrativeCount(newSessionId, 1);
    });

    expect(
      useSessionStore.getState().getSavedSession('world-1', 'character-1')?.id
    ).toBe(newSessionId);
    expect(
      useSessionStore.getState().savedSessions[previousSessionId]
    ).toBeUndefined();
  } finally {
    sessionClock.mockRestore();
  }
});

describe('ended sessions without ?fresh=true', () => {
  it('starts a new session instead of resuming the ended save', async () => {
    renderHook(() => useGameSessionState({ worldId: 'world-1', isClient: true }));
    await waitFor(() => expect(useSessionStore.getState().status).toBe('active'));
    expect(useSessionStore.getState().id).not.toBe(endedSessionId);
  });

  it('moves a player stuck on an ended active session to a new one', async () => {
    useSessionStore.setState({ status: 'active' });
    renderHook(() => useGameSessionState({ worldId: 'world-1', isClient: true }));
    await waitFor(() =>
      expect(useSessionStore.getState().id).not.toBe(endedSessionId)
    );
    expect(useSessionStore.getState().status).toBe('active');
  });

  it('keeps the ending on screen when the page reloads on it', async () => {
    useSessionStore.setState({ status: 'active' });
    useNarrativeStore.getState().setCurrentEnding({
      id: 'ending-1',
      sessionId: endedSessionId,
      characterId: 'character-1',
      worldId: 'world-1',
      type: 'player-choice',
      tone: 'hopeful',
      epilogue: 'The gate closes behind you.',
      characterLegacy: 'Remembered at the gate.',
      worldImpact: 'The road stays open.',
      timestamp: new Date(),
      createdAt: '2026-10-01T12:00:00.000Z',
      updatedAt: '2026-10-01T12:00:00.000Z',
    });
    await act(async () => {
      renderHook(() => useGameSessionState({ worldId: 'world-1', isClient: true }));
    });
    expect(useSessionStore.getState().id).toBe(endedSessionId);
    expect(useNarrativeStore.getState().currentEnding?.id).toBe('ending-1');
  });

  it('waits for narrative hydration before deciding the session ended', async () => {
    useSessionStore.setState({ status: 'active' });
    let finishHydration = () => {};
    const hydrated = jest
      .spyOn(useNarrativeStore.persist, 'hasHydrated')
      .mockReturnValue(false);
    jest
      .spyOn(useNarrativeStore.persist, 'onFinishHydration')
      .mockImplementation((callback) => {
        finishHydration = () => callback(useNarrativeStore.getState());
        return () => {};
      });
    try {
      renderHook(() => useGameSessionState({ worldId: 'world-1', isClient: true }));
      expect(useSessionStore.getState().id).toBe(endedSessionId);
      hydrated.mockReturnValue(true);
      act(() => finishHydration());
      await waitFor(() =>
        expect(useSessionStore.getState().id).not.toBe(endedSessionId)
      );
    } finally {
      jest.restoreAllMocks();
    }
  });
});

it('starts a world\'s own session when another world\'s is still active on a cold load', async () => {
  useSessionStore.setState({ id: 'live-session', status: 'active' });
  useWorldStore.setState((state) => ({
    worlds: { ...state.worlds, 'world-2': createMockWorld({ id: 'world-2' }) },
  }));
  useCharacterStore.setState((state) => ({
    characters: {
      ...state.characters,
      'character-2': createMockCharacter({ id: 'character-2', worldId: 'world-2' }),
    },
  }));
  let finishHydration = () => {};
  const hydrated = jest
    .spyOn(useNarrativeStore.persist, 'hasHydrated')
    .mockReturnValue(false);
  jest
    .spyOn(useNarrativeStore.persist, 'onFinishHydration')
    .mockImplementation((callback) => {
      finishHydration = () => callback(useNarrativeStore.getState());
      return () => {};
    });
  try {
    await act(async () => {
      render(<GameSession worldId="world-2" />);
    });
    expect(mockGenerationSessionIds).toHaveLength(0);
    hydrated.mockReturnValue(true);
    await act(async () => finishHydration());
    expect(useSessionStore.getState().worldId).toBe('world-2');
    expect(new Set(mockGenerationSessionIds)).toEqual(
      new Set([useSessionStore.getState().id])
    );
  } finally {
    jest.restoreAllMocks();
  }
});

it('leaves another world\'s active session alone on a world with no characters', async () => {
  useSessionStore.setState({ id: 'live-session', status: 'active' });
  useWorldStore.setState((state) => ({
    worlds: { ...state.worlds, 'world-2': createMockWorld({ id: 'world-2' }) },
  }));

  await act(async () => {
    render(<GameSession worldId="world-2" />);
  });

  expect(screen.getByTestId('game-session-no-characters')).toBeInTheDocument();
  expect(mockGenerationSessionIds).toHaveLength(0);
  expect(useSessionStore.getState().id).toBe('live-session');
});
