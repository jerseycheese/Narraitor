/**
 * Tests for useAutoSave hook - TDD Implementation
 */

import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../useAutoSave';

// Mock the auto-save service
jest.mock('../../lib/services/autoSaveService');

// Mock session store
const mockSessionStore = {
  autoSave: {
    enabled: true,
    lastSaveTime: null,
    status: 'idle',
    errorMessage: null,
    totalSaves: 0,
  },
  updateAutoSaveStatus: jest.fn(),
  recordAutoSave: jest.fn(),
  setAutoSaveEnabled: jest.fn(),
};

jest.mock('../../state/sessionStore', () => ({
  useSessionStore: () => mockSessionStore,
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
    const { result } = renderHook(() => useAutoSave());
    
    act(() => {
      result.current.start();
    });
    
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
});