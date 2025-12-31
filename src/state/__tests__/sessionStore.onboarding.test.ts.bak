import { useSessionStore } from '../sessionStore';
import { getTimestamp } from '@/lib/utils/timestamp';

// Mock the logger to avoid console output during tests
jest.mock('@/lib/utils/logger', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

// Mock IndexedDB storage
jest.mock('../persistence', () => ({
  createIndexedDBStorage: () => ({
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe('SessionStore - Onboarding Functionality', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useSessionStore.setState({
      id: null,
      status: 'initializing',
      currentSceneId: null,
      playerChoices: [],
      error: null,
      worldId: null,
      characterId: null,
      savedSessions: {},
      onboardingCompleted: false,
    });
  });

  describe('First-time user detection', () => {
    it('identifies first-time users when no saved sessions exist', () => {
      const state = useSessionStore.getState();
      
      const isFirstTime = Object.keys(state.savedSessions).length === 0 && !state.onboardingCompleted;
      
      expect(isFirstTime).toBe(true);
    });

    it('identifies returning users when saved sessions exist', () => {
      // Add a saved session
      useSessionStore.setState({
        savedSessions: {
          'session-1': {
            id: 'session-1',
            worldId: 'world-1',
            characterId: 'char-1',
            lastPlayed: getTimestamp(),
            narrativeCount: 5,
          }
        }
      });

      const state = useSessionStore.getState();
      const isFirstTime = Object.keys(state.savedSessions).length === 0 && !state.onboardingCompleted;
      
      expect(isFirstTime).toBe(false);
    });

    it('identifies returning users when onboarding was completed but no sessions saved', () => {
      useSessionStore.setState({
        onboardingCompleted: true,
      });

      const state = useSessionStore.getState();
      const isFirstTime = Object.keys(state.savedSessions).length === 0 && !state.onboardingCompleted;
      
      expect(isFirstTime).toBe(false);
    });
  });

  describe('Onboarding completion tracking', () => {
    it('has setOnboardingCompleted action', () => {
      expect(typeof useSessionStore.getState().setOnboardingCompleted).toBe('function');
    });

    it('marks onboarding as completed', () => {
      const { setOnboardingCompleted } = useSessionStore.getState();
      
      setOnboardingCompleted(true);
      
      const state = useSessionStore.getState();
      expect(state.onboardingCompleted).toBe(true);
    });

    it('can reset onboarding completion state', () => {
      const { setOnboardingCompleted } = useSessionStore.getState();
      
      // First set it to true
      setOnboardingCompleted(true);
      expect(useSessionStore.getState().onboardingCompleted).toBe(true);
      
      // Then reset it to false
      setOnboardingCompleted(false);
      expect(useSessionStore.getState().onboardingCompleted).toBe(false);
    });

    it('persists onboarding completion state', () => {
      const { setOnboardingCompleted } = useSessionStore.getState();
      
      setOnboardingCompleted(true);
      
      // The state should be persisted (we're testing the interface)
      // In a real integration test, we'd verify localStorage or IndexedDB
      expect(useSessionStore.getState().onboardingCompleted).toBe(true);
    });
  });

  describe('Integration with existing functionality', () => {
    it('maintains existing savedSessions functionality', () => {
      const existingFunctionality = [
        'initializeSession',
        'endSession',
        'resumeSavedSession',
        'getSavedSession',
        'deleteSavedSession',
        'updateSavedSessionNarrativeCount',
      ];

      const state = useSessionStore.getState();
      
      existingFunctionality.forEach(funcName => {
        expect(typeof (state as unknown as Record<string, unknown>)[funcName]).toBe('function');
      });
    });

    it('does not interfere with session initialization', async () => {
      const { setOnboardingCompleted, initializeSession } = useSessionStore.getState();
      
      setOnboardingCompleted(true);
      
      const mockCallback = jest.fn();
      await initializeSession('world-1', 'char-1', mockCallback);
      
      const state = useSessionStore.getState();
      expect(state.worldId).toBe('world-1');
      expect(state.characterId).toBe('char-1');
      expect(state.onboardingCompleted).toBe(true); // Should remain true
    });

    it('maintains onboarding state when ending sessions', () => {
      const { setOnboardingCompleted, endSession, setSessionId } = useSessionStore.getState();
      
      setOnboardingCompleted(true);
      setSessionId('test-session');
      useSessionStore.setState({
        worldId: 'world-1',
        characterId: 'char-1',
      });
      
      endSession();
      
      const state = useSessionStore.getState();
      expect(state.onboardingCompleted).toBe(true); // Should persist through session end
    });
  });

  describe('Helper methods for onboarding flow', () => {
    it('provides isFirstTimeUser helper method', () => {
      expect(typeof useSessionStore.getState().isFirstTimeUser).toBe('function');
    });

    it('isFirstTimeUser returns correct values', () => {
      const { isFirstTimeUser } = useSessionStore.getState();
      
      // Should be true for fresh state
      expect(isFirstTimeUser()).toBe(true);
      
      // Should be false after marking onboarding as completed
      useSessionStore.getState().setOnboardingCompleted(true);
      expect(isFirstTimeUser()).toBe(false);
      
      // Should be false when saved sessions exist (even if onboarding not explicitly completed)
      useSessionStore.setState({
        onboardingCompleted: false,
        savedSessions: {
          'session-1': {
            id: 'session-1',
            worldId: 'world-1', 
            characterId: 'char-1',
            lastPlayed: getTimestamp(),
            narrativeCount: 1,
          }
        }
      });
      expect(isFirstTimeUser()).toBe(false);
    });

    it('should show onboarding returns correct values', () => {
      const { shouldShowOnboarding } = useSessionStore.getState();
      
      // Should show onboarding for first-time users
      expect(shouldShowOnboarding()).toBe(true);
      
      // Should not show after completion
      useSessionStore.getState().setOnboardingCompleted(true);
      expect(shouldShowOnboarding()).toBe(false);
    });
  });
});