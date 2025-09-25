/**
 * Tests for useAutoSave hook - TDD Implementation
 */

import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../useAutoSave';

// Mock the auto-save service
const mockAutoSaveService = {
  start: jest.fn(),
  stop: jest.fn(),
  triggerSave: jest.fn(),
  isRunning: jest.fn(() => false),
};

jest.mock('../../lib/services/autoSaveService', () => ({
  AutoSaveService: jest.fn().mockImplementation(() => mockAutoSaveService)
}));

// Mock session store
const mockSessionStore = {
  autoSave: {
    enabled: true,
    lastSaveTime: null as string | null,
    status: 'idle',
    errorMessage: null,
    totalSaves: 0,
  },
  updateAutoSaveStatus: jest.fn(),
  recordAutoSave: jest.fn(),
  setAutoSaveEnabled: jest.fn(),
};

jest.mock('../../state/sessionStore', () => ({
  useSessionStore: Object.assign(
    (selector = (state) => state) => {
      const fullState = {
        ...mockSessionStore,
        id: 'test-session',
        status: 'active',
        worldId: 'world-1',
        characterId: 'char-1',
        autoSave: mockSessionStore.autoSave,
      };
      return selector(fullState);
    },
    {
      getState: () => ({
        ...mockSessionStore,
        id: 'test-session',
        status: 'active',
        worldId: 'world-1',
        characterId: 'char-1',
        autoSave: mockSessionStore.autoSave,
      }),
    }
  ),
}));

// Mock other stores
jest.mock('../../state/worldStore', () => ({
  useWorldStore: () => ({
    worlds: { 'world-1': { id: 'world-1', name: 'Test World' } },
  }),
}));

jest.mock('../../state/characterStore', () => ({
  useCharacterStore: () => ({
    characters: { 'char-1': { id: 'char-1', name: 'Test Character' } },
  }),
}));

jest.mock('../../state/narrativeStore', () => ({
  useNarrativeStore: () => ({
    segments: {},
    currentEnding: null,
  }),
}));

jest.mock('../../state/journalStore', () => ({
  useJournalStore: () => ({
    entries: {},
  }),
}));

// Mock useToast hook
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  addToast: jest.fn(),
  removeToast: jest.fn(),
  removeAllToasts: jest.fn(),
  toasts: [],
};

jest.mock('../../components/ui/toast', () => ({
  useToast: () => mockToast,
}));

describe('useAutoSave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize auto-save service when hook is used', () => {
    const { result } = renderHook(() => useAutoSave());
    
    expect(result.current).toBeDefined();
    expect(result.current.isEnabled).toBe(true);
    expect(result.current.status).toBe('idle');
  });

  it('should start auto-save service automatically', () => {
    mockAutoSaveService.isRunning.mockReturnValue(false);
    const { result, rerender } = renderHook(() => useAutoSave());
    
    act(() => {
      result.current.start();
      mockAutoSaveService.isRunning.mockReturnValue(true);
    });
    
    // Re-render to pick up the new isRunning state
    rerender();
    
    expect(mockAutoSaveService.start).toHaveBeenCalled();
    expect(result.current.isRunning).toBe(true);
  });

  it('should trigger manual save with player choice reason', async () => {
    const { result } = renderHook(() => useAutoSave());
    
    await act(async () => {
      await result.current.triggerSave('player-choice');
    });
    
    expect(mockSessionStore.updateAutoSaveStatus).toHaveBeenCalledWith('saving');
  });

  it('should trigger manual save with scene change reason', async () => {
    const { result } = renderHook(() => useAutoSave());
    
    await act(async () => {
      await result.current.triggerSave('scene-change');
    });
    
    expect(mockSessionStore.updateAutoSaveStatus).toHaveBeenCalledWith('saving');
  });

  it('should provide save status from session store', () => {
    mockSessionStore.autoSave.status = 'saved';
    mockSessionStore.autoSave.lastSaveTime = '2023-01-01T00:00:00.000Z';
    
    const { result } = renderHook(() => useAutoSave());
    
    expect(result.current.status).toBe('saved');
    expect(result.current.lastSaveTime).toBe('2023-01-01T00:00:00.000Z');
  });

  it('should allow enabling/disabling auto-save', () => {
    const { result } = renderHook(() => useAutoSave());
    
    act(() => {
      result.current.setEnabled(false);
    });
    
    expect(mockSessionStore.setAutoSaveEnabled).toHaveBeenCalledWith(false);
  });

  it('should clear toast mocks before each test', () => {
    // This test ensures our toast mocking is working
    const { result } = renderHook(() => useAutoSave());
    
    expect(result.current).toBeDefined();
    expect(mockToast.success).toHaveBeenCalledTimes(0);
    expect(mockToast.error).toHaveBeenCalledTimes(0);
  });
});