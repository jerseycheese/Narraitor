/**
 * Test helpers for SessionBoundaryLogging integration tests
 */

import { useSessionStore } from '@/state/sessionStore';
import { useJournalStore } from '@/state/journalStore';

const mockUseSessionStore = useSessionStore as jest.MockedFunction<typeof useSessionStore>;
export const mockUseJournalStore = useJournalStore as jest.MockedFunction<typeof useJournalStore>;

/**
 * Default mock session store state
 */
const createMockSessionStore = (overrides = {}) => ({
  id: null,
  status: 'initializing' as const,
  worldId: null,
  characterId: null,
  currentSceneId: null,
  playerChoices: [],
  error: null,
  savedSessions: {},
  templateHistory: [],
  autoSave: { enabled: true, lastSaveTime: null, status: 'idle' as const, errorMessage: null, totalSaves: 0 },
  onboardingCompleted: false,
  initializeSession: jest.fn(),
  endSession: jest.fn(),
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
  addTemplateToHistory: jest.fn(),
  getTemplateHistory: jest.fn(),
  clearTemplateHistory: jest.fn(),
  setAutoSaveEnabled: jest.fn(),
  updateAutoSaveStatus: jest.fn(),
  recordAutoSave: jest.fn(),
  setOnboardingCompleted: jest.fn(),
  isFirstTimeUser: jest.fn(),
  shouldShowOnboarding: jest.fn(),
  ...overrides
});

/**
 * Default mock journal store state
 */
const createMockJournalStore = (overrides = {}) => ({
  addEntry: jest.fn(),
  getSessionEntries: jest.fn().mockReturnValue([]),
  markAsRead: jest.fn(),
  updateEntry: jest.fn(),
  deleteEntry: jest.fn(),
  deleteSessionEntries: jest.fn(),
  getEntriesByType: jest.fn(),
  reset: jest.fn(),
  setError: jest.fn(),
  clearError: jest.fn(),
  setLoading: jest.fn(),
  entries: {},
  sessionEntries: {},
  error: null,
  loading: false,
  ...overrides
});

/**
 * Setup mock stores with default or custom values
 */
export const setupMockStores = (
  sessionStoreOverrides = {},
  journalStoreOverrides = {}
) => {
  const mockSessionStore = createMockSessionStore(sessionStoreOverrides);
  const mockJournalStore = createMockJournalStore(journalStoreOverrides);

  mockUseSessionStore.mockReturnValue(mockSessionStore);
  mockUseJournalStore.mockReturnValue(mockJournalStore);

  return { mockSessionStore, mockJournalStore };
};

/**
 * Create test session data
 */
const createTestSession = (overrides = {}) => ({
  id: 'test-session-123',
  startTime: Date.now(),
  worldId: 'test-world',
  characterId: 'test-character',
  status: 'active' as const,
  ...overrides
});

/**
 * Setup static getState and subscribe mocks for session store
 */
export const setupSessionStoreStatics = () => {
  Object.defineProperty(mockUseSessionStore, 'getState', {
    value: jest.fn(() => ({
      id: null,
      status: 'initializing',
      worldId: null,
      characterId: null
    })),
    writable: true
  });

  Object.defineProperty(mockUseSessionStore, 'subscribe', {
    value: jest.fn(() => jest.fn()), // return unsubscribe function
    writable: true
  });
};
