import { renderHook, act } from '@testing-library/react';
import { useGameSessionState } from './useGameSessionState';

// Create a complete mock of the stores
const mockWorldStoreState = {
  worlds: {
    'test-world': {
      id: 'test-world',
      name: 'Test World',
      description: 'A test world',
      theme: 'Fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 6,
        maxSkills: 8,
        attributePointPool: 27,
        skillPointPool: 20
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
};

const mockCharacterStoreState = {
  currentCharacterId: 'test-character-id',
  characters: {
    'test-character-id': {
      id: 'test-character-id',
      name: 'Test Character',
      worldId: 'test-world',
      level: 1,
      attributes: [],
      skills: [],
      background: { description: '', personality: '', motivation: '' },
      isPlayer: true,
      status: { hp: 100, mp: 50, stamina: 100 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
};

const mockSessionStoreState = {
  status: 'active' as const,
  error: null,
  currentSceneId: 'scene-001',
  playerChoices: [
    { id: 'choice-1', text: 'Choice 1', isSelected: false }
  ],
  initializeSession: jest.fn(),
  pauseSession: jest.fn(),
  resumeSession: jest.fn(),
  endSession: jest.fn(),
  selectChoice: jest.fn(),
};

// Mock the stores
jest.mock('@/state/worldStore', () => ({
  worldStore: {
    getState: jest.fn(() => mockWorldStoreState)
  }
}));

jest.mock('@/state/sessionStore', () => ({
  sessionStore: {
    getState: jest.fn(() => mockSessionStoreState),
    pauseSession: jest.fn(),
    resumeSession: jest.fn(),
    endSession: jest.fn(),
    selectChoice: jest.fn(),
    initializeSession: jest.fn(),
  }
}));

jest.mock('@/state/characterStore', () => ({
  characterStore: {
    getState: jest.fn(() => mockCharacterStoreState)
  }
}));

// Import the mocked stores
import { sessionStore } from '@/state/sessionStore';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';

describe('useGameSessionState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock return values
    (worldStore.getState as jest.Mock).mockReturnValue(mockWorldStoreState);
    (sessionStore.getState as jest.Mock).mockReturnValue(mockSessionStoreState);
    (characterStore.getState as jest.Mock).mockReturnValue(mockCharacterStoreState);
  });

  test('initializes with session store state', () => {
    const { result } = renderHook(() => useGameSessionState({
      worldId: 'test-world',
      isClient: true
    }));

    expect(result.current.sessionState.status).toBe('active');
    expect(result.current.sessionState.currentSceneId).toBe('scene-001');
  });

  test('handles pause and resume toggling', () => {
    const { result } = renderHook(() => useGameSessionState({
      worldId: 'test-world',
      isClient: true,
      _stores: {
        worldStore: mockWorldStoreState,
        sessionStore: mockSessionStoreState,
        characterStore: mockCharacterStoreState
      }
    }));

    // Pause action
    act(() => {
      result.current.handlePauseToggle();
    });

    expect(result.current.sessionState.status).toBe('paused');
    expect(mockSessionStoreState.pauseSession).toHaveBeenCalledTimes(1);

    // Resume action
    act(() => {
      result.current.handlePauseToggle();
    });

    expect(result.current.sessionState.status).toBe('active');
    expect(mockSessionStoreState.resumeSession).toHaveBeenCalledTimes(1);
  });

  test('handles choice selection', () => {
    const { result } = renderHook(() => useGameSessionState({
      worldId: 'test-world',
      isClient: true,
      _stores: {
        worldStore: mockWorldStoreState,
        sessionStore: mockSessionStoreState,
        characterStore: mockCharacterStoreState
      }
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
      router,
      _stores: {
        worldStore: mockWorldStoreState,
        sessionStore: mockSessionStoreState,
        characterStore: mockCharacterStoreState
      }
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
      onSessionStart,
      _stores: {
        worldStore: mockWorldStoreState,
        sessionStore: mockSessionStoreState,
        characterStore: mockCharacterStoreState
      }
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
    const mockStoresWithoutCharacter = {
      worldStore: mockWorldStoreState,
      sessionStore: mockSessionStoreState,
      characterStore: { ...mockCharacterStoreState, currentCharacterId: null }
    };
    
    const { result } = renderHook(() => useGameSessionState({
      worldId: 'test-world',
      isClient: true,
      onSessionStart,
      _stores: mockStoresWithoutCharacter
    }));

    // Handle retry
    act(() => {
      result.current.handleRetry();
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe('Please select a character before starting the game');
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