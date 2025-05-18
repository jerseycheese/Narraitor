import { renderHook, act } from '@testing-library/react';
import { useGameSessionState } from './useGameSessionState';
import { sessionStore } from '@/state/sessionStore';

// Mock the session store
jest.mock('@/state/sessionStore');

describe('useGameSessionState', () => {
  const mockStoreState = {
    status: 'active',
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

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock getState to return our test state
    (sessionStore.getState as jest.Mock).mockReturnValue(mockStoreState);
    (sessionStore as typeof sessionStore).pauseSession = jest.fn();
    (sessionStore as typeof sessionStore).resumeSession = jest.fn();
    (sessionStore as typeof sessionStore).endSession = jest.fn();
    (sessionStore as typeof sessionStore).selectChoice = jest.fn();
    (sessionStore as typeof sessionStore).initializeSession = jest.fn();
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
      isClient: true
    }));

    // Pause action
    act(() => {
      result.current.handlePauseToggle();
    });

    expect(result.current.sessionState.status).toBe('paused');
    expect(sessionStore.pauseSession).toHaveBeenCalledTimes(1);

    // Resume action
    act(() => {
      result.current.handlePauseToggle();
    });

    expect(result.current.sessionState.status).toBe('active');
    expect(sessionStore.resumeSession).toHaveBeenCalledTimes(1);
  });

  test('handles choice selection', () => {
    const { result } = renderHook(() => useGameSessionState({
      worldId: 'test-world',
      isClient: true
    }));

    act(() => {
      result.current.handleSelectChoice('choice-1');
    });

    expect(sessionStore.selectChoice).toHaveBeenCalledWith('choice-1');
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

    expect(sessionStore.endSession).toHaveBeenCalledTimes(1);
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
    expect(sessionStore.initializeSession).toHaveBeenCalledWith('test-world', onSessionStart);
  });

  test('polls for session state updates', () => {
    jest.useFakeTimers();
    
    renderHook(() => useGameSessionState({
      worldId: 'test-world',
      isClient: true
    }));

    // Fast-forward time to trigger polling
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(sessionStore.getState).toHaveBeenCalledTimes(2); // Initial + 1 poll

    jest.useRealTimers();
  });

  test('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useGameSessionState({
      worldId: 'test-world',
      isClient: true
    }));

    unmount();

    // Verify any cleanup like interval clearing happens
    // This would be tested more thoroughly with implementation details
  });
});