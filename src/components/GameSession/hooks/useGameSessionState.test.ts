import { renderHook, act } from '@testing-library/react';
import { useGameSessionState } from './useGameSessionState';
import { createMockWorld, createMockCharacter, createMockWorldStore, createMockCharacterStore, createMockSessionStore } from '@/lib/test-utils';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';

// Create test fixtures
const testWorld = createMockWorld({
  id: 'test-world',
  settings: {
    maxAttributes: 6,
    maxSkills: 8,
    attributePointPool: 27,
    skillPointPool: 20
  }
});

const testCharacter = createMockCharacter({
  id: 'test-character-id',
  worldId: 'test-world',
  isPlayer: true
});

// Create a complete mock of the stores
const mockWorldStoreState = createMockWorldStore({
  worlds: {
    'test-world': testWorld
  }
});

const mockCharacterStoreState = createMockCharacterStore({
  currentCharacterId: 'test-character-id',
  characters: {
    'test-character-id': testCharacter
  }
});

const mockSessionStoreState = createMockSessionStore({
  status: 'active' as const,
  error: null,
  currentSceneId: 'scene-001',
  playerChoices: [
    { id: 'choice-1', text: 'Choice 1', isSelected: false }
  ]
});

// Mock the stores
jest.mock('@/state/worldStore', () => ({
  useWorldStore: Object.assign(
    jest.fn(() => mockWorldStoreState),
    { getState: jest.fn(() => mockWorldStoreState) }
  )
}));

jest.mock('@/state/sessionStore', () => ({
  useSessionStore: Object.assign(
    jest.fn(() => mockSessionStoreState),
    { 
      getState: jest.fn(() => mockSessionStoreState),
      subscribe: jest.fn(() => jest.fn()) // Mock subscribe method that returns unsubscribe function
    }
  )
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: Object.assign(
    jest.fn(() => mockCharacterStoreState),
    { getState: jest.fn(() => mockCharacterStoreState) }
  )
}));

describe('useGameSessionState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-establish default store state so a per-test override (below) can't leak.
    (useWorldStore as unknown as jest.Mock).mockReturnValue(mockWorldStoreState);
    (useSessionStore as unknown as jest.Mock).mockReturnValue(mockSessionStoreState);
    (useCharacterStore as unknown as jest.Mock).mockReturnValue(mockCharacterStoreState);
  });

  test('initializes with session store state', () => {
    const { result } = renderHook(() => useGameSessionState({
      worldId: 'test-world',
      isClient: true
    }));

    expect(result.current.sessionState.status).toBe('active');
    expect(result.current.sessionState.currentSceneId).toBe('scene-001');
  });

  test('handles choice selection', () => {
    const { result } = renderHook(() => useGameSessionState({
      worldId: 'test-world',
      isClient: true
    }));

    act(() => {
      result.current.handleSelectChoice('choice-1');
    });

    expect(mockSessionStoreState.selectChoice).toHaveBeenCalledWith('choice-1');
  });

  test('handles end session', () => {
    const onSessionEnd = jest.fn();
    const router = { push: jest.fn() };
    
    const { result } = renderHook(() => useGameSessionState({
      worldId: 'test-world',
      isClient: true,
      onSessionEnd,
      router
    }));

    act(() => {
      result.current.handleEndSession();
    });

    expect(mockSessionStoreState.endSession).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/');
    expect(onSessionEnd).toHaveBeenCalledTimes(1);
  });

  test('handles retry after error', () => {
    const onSessionStart = jest.fn();
    const { result } = renderHook(() => useGameSessionState({
      worldId: 'test-world',
      isClient: true,
      onSessionStart
    }));

    // Set error state
    act(() => {
      result.current.setError(new Error('Test error'));
    });

    expect(result.current.error).toBeTruthy();

    // Handle retry
    act(() => {
      result.current.handleRetry();
    });

    expect(result.current.error).toBeNull();
    expect(mockSessionStoreState.initializeSession).toHaveBeenCalledWith('test-world', 'test-character-id', onSessionStart);
  });

  test('detects world existence', () => {
    const { result: existsResult } = renderHook(() => useGameSessionState({
      worldId: 'test-world',
      isClient: true
    }));

    expect(existsResult.current.worldExists).toBe(true);

    const { result: notExistsResult } = renderHook(() => useGameSessionState({
      worldId: 'non-existent-world',
      isClient: true
    }));

    expect(notExistsResult.current.worldExists).toBe(false);
  });

  test('handles retry when no character is selected', () => {
    const onSessionStart = jest.fn();
    (useCharacterStore as unknown as jest.Mock).mockReturnValue({
      ...mockCharacterStoreState,
      currentCharacterId: null,
      characters: {} // No characters for this world
    });

    const { result } = renderHook(() => useGameSessionState({
      worldId: 'test-world',
      isClient: true,
      onSessionStart
    }));

    // The hook should calculate that there are no characters available
    // When handleRetry is called, it should detect this and set an error
    act(() => {
      result.current.handleRetry();
    });

    // Check that an error was set
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe('Please create a character for this world before starting the game');
    expect(mockSessionStoreState.initializeSession).not.toHaveBeenCalled();
  });

  test('uses initial state when provided', () => {
    const initialState = {
      status: 'loading' as const,
      currentSceneId: 'initial-scene',
      error: null,
      playerChoices: []
    };

    const { result } = renderHook(() => useGameSessionState({
      worldId: 'test-world',
      isClient: false,  // Disable client to prevent polling from overriding initial state
      initialState
    }));

    expect(result.current.sessionState.status).toBe('loading');
    expect(result.current.sessionState.currentSceneId).toBe('initial-scene');
  });
});
