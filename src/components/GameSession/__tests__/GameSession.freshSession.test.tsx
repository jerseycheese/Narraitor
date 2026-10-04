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
