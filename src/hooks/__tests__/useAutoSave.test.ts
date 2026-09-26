/**
 * Tests for useAutoSave hook
 */

import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../useAutoSave';
import { SessionStore } from '../../types/game.types';
import { mockZustandStore, createMockSessionStore } from '@/lib/test-utils';
import {
  _setStorageStatusForTesting,
  _resetStorageStatusForTesting,
} from '@/state/persistence';
import { StorageStatus } from '@/lib/storage/resilientStorage';

const mockSessionStore: SessionStore = {
  id: 'test-session',
  status: 'active',
  currentSceneId: 'scene-001',
  playerChoices: [],
  error: null,
  worldId: 'world-1',
  characterId: 'char-1',
  savedSessions: {},
  sessionLifecycle: {},
  autoSave: {
    enabled: true,
    lastSaveTime: null,
    status: 'idle',
    errorMessage: null,
    totalSaves: 0,
  },
  narrativeHeight: 600,
  tutorialProgress: {
    phases: {
      intro: { completed: false, skipped: false },
      worldCreation: { completed: false, skipped: false, lastStep: 0 },
      worldGeneration: { completed: false, skipped: false, lastStep: 0 },
      characterCreation: { completed: false, skipped: false, lastStep: 0 },
      firstPlay: { completed: false, skipped: false },
    },
    dismissedHints: [],
    lastActiveStep: null,
  },
  initializeSession: jest.fn(),
  endSession: jest.fn(),
  refreshRecoveryMarker: jest.fn(),
  setStatus: jest.fn(),
  setError: jest.fn(),
  setPlayerChoices: jest.fn(),
  selectChoice: jest.fn(),
  clearPlayerChoices: jest.fn(),
  setCurrentScene: jest.fn(),
  pauseSession: jest.fn(),
  resumeSession: jest.fn(),
  setSessionId: jest.fn(),
  setCharacterId: jest.fn(),
  getSavedSession: jest.fn(),
  resumeSavedSession: jest.fn(),
  deleteSavedSession: jest.fn(),
  updateSavedSessionNarrativeCount: jest.fn(),
  upsertSessionLifecycle: jest.fn(),
  setSessionLifecycleStatus: jest.fn(),
  getSessionLifecycle: jest.fn(),
  setAutoSaveEnabled: jest.fn(),
  updateAutoSaveStatus: jest.fn(),
  recordAutoSave: jest.fn(),
  isFirstTimeUser: jest.fn(),
  shouldShowOnboarding: jest.fn(),
  updateTutorialProgress: jest.fn(),
  dismissTutorialHint: jest.fn(),
  resetTutorialProgress: jest.fn(),
  completeTutorialPhase: jest.fn(),
  shouldShowTutorialPhase: jest.fn(),
  isTutorialComplete: jest.fn(),
  getCurrentTutorialPhase: jest.fn(),
};

jest.mock('../../state/sessionStore');

// Configure session store mock
import { useSessionStore } from '../../state/sessionStore';
mockZustandStore(useSessionStore as jest.MockedFunction<typeof useSessionStore>, createMockSessionStore(mockSessionStore));

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
    _resetStorageStatusForTesting();
    mockSessionStore.autoSave.enabled = true;
    mockSessionStore.autoSave.status = 'idle';
    mockSessionStore.autoSave.lastSaveTime = null;
    mockSessionStore.autoSave.errorMessage = null;
    mockSessionStore.autoSave.totalSaves = 0;
    mockSessionStore.status = 'active';
  });

  afterEach(() => {
    _resetStorageStatusForTesting();
  });

  it('should initialize with status from session store when storage is healthy', () => {
    const { result } = renderHook(() => useAutoSave());

    expect(result.current.isEnabled).toBe(true);
    expect(result.current.status).toBe('idle');
    expect(result.current.isRunning).toBe(true);
  });

  it('reflects error status and fallback notice when storage is unavailable', () => {
    _setStorageStatusForTesting(StorageStatus.UNAVAILABLE, {
      message: 'IndexedDB write failed: QuotaExceededError',
    });

    const { result } = renderHook(() => useAutoSave());

    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe('IndexedDB write failed: QuotaExceededError');
    expect(result.current.isRunning).toBe(false);
  });

  it('records auto-save and triggers success toast on manual save', async () => {
    const { result } = renderHook(() => useAutoSave());

    await act(async () => {
      await result.current.triggerSave('manual');
    });

    expect(mockSessionStore.updateAutoSaveStatus).toHaveBeenCalledWith('saving');
    expect(mockSessionStore.recordAutoSave).toHaveBeenCalled();
    expect(mockToast.success).toHaveBeenCalledWith(
      'Game saved successfully',
      'Your progress has been saved'
    );
  });

  it('shows error toast on manual save when storage is unavailable', async () => {
    _setStorageStatusForTesting(StorageStatus.UNAVAILABLE, {
      message: 'IndexedDB unavailable',
    });

    const { result } = renderHook(() => useAutoSave());

    await act(async () => {
      await result.current.triggerSave('manual');
    });

    expect(mockToast.error).toHaveBeenCalledWith('Save failed', 'IndexedDB unavailable');
  });

  it('handles player-choice and scene-change trigger gracefully without error', async () => {
    const { result } = renderHook(() => useAutoSave());

    await act(async () => {
      await result.current.triggerSave('player-choice');
    });

    // Does not show error toast or fail
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('should provide save status and lastSaveTime from session store', () => {
    mockSessionStore.autoSave.status = 'saved';
    mockSessionStore.autoSave.lastSaveTime = '2026-01-01T00:00:00.000Z';

    const { result } = renderHook(() => useAutoSave());

    expect(result.current.status).toBe('saved');
    expect(result.current.lastSaveTime).toBe('2026-01-01T00:00:00.000Z');
  });

  it('should allow enabling/disabling auto-save', () => {
    (mockSessionStore.setAutoSaveEnabled as jest.Mock).mockImplementation((enabled: boolean) => {
      mockSessionStore.autoSave.enabled = enabled;
    });

    const { result, rerender } = renderHook(() => useAutoSave());
    expect(result.current.isEnabled).toBe(true);

    act(() => {
      result.current.setEnabled(false);
    });
    rerender();

    expect(result.current.isEnabled).toBe(false);

    act(() => {
      result.current.setEnabled(true);
    });
    rerender();

    expect(result.current.isEnabled).toBe(true);
  });

  it('retry calls triggerSave for manual save', async () => {
    const { result } = renderHook(() => useAutoSave());

    await act(async () => {
      await result.current.retry();
    });

    expect(mockSessionStore.recordAutoSave).toHaveBeenCalled();
    expect(mockToast.success).toHaveBeenCalledWith(
      'Game saved successfully',
      'Your progress has been saved'
    );
  });
});
