/**
 * Tests for useAutoSave hook - TDD Implementation
 */

import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../useAutoSave';
import { SessionStore } from '../../types/game.types';
import { mockZustandStore, createMockSessionStore } from '@/lib/test-utils';

// Mock the auto-save service
const mockAutoSaveService = {
  start: jest.fn(),
  stop: jest.fn(),
  triggerSave: jest.fn(),
  isRunning: jest.fn(() => false),
};

jest.mock('../../lib/services/autoSaveService', () => ({
  createAutoSave: jest.fn(() => mockAutoSaveService)
}));

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

  it('should carry the player-choice reason through to the save service', async () => {
    const { result } = renderHook(() => useAutoSave());

    await act(async () => {
      await result.current.triggerSave('player-choice');
    });

    // The reason is the point: the service debounces or skips on it, so a save
    // that arrives under the wrong reason behaves differently downstream.
    expect(mockAutoSaveService.triggerSave).toHaveBeenCalledWith('player-choice');
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
    // Let the store mock reflect the write, so the hook's reported isEnabled
    // is read back from state rather than assumed from the call.
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

});
