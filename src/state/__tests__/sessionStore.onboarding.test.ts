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

describe('SessionStore - Tutorial & Onboarding Functionality', () => {
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
      }
    });
  });

  describe('First-time user detection', () => {
    it('identifies first-time users when intro phase is not completed or skipped', () => {
      const state = useSessionStore.getState();
      
      expect(state.isFirstTimeUser()).toBe(true);
      expect(state.shouldShowOnboarding()).toBe(true);
    });

    it('identifies returning users when intro phase is completed', () => {
      useSessionStore.getState().completeTutorialPhase('intro');
      
      const state = useSessionStore.getState();
      expect(state.isFirstTimeUser()).toBe(false);
      expect(state.shouldShowOnboarding()).toBe(false);
    });

    it('identifies returning users when intro phase is skipped', () => {
      useSessionStore.getState().updateTutorialProgress('intro', { skipped: true });
      
      const state = useSessionStore.getState();
      expect(state.isFirstTimeUser()).toBe(false);
      expect(state.shouldShowOnboarding()).toBe(false);
    });
  });

  describe('Tutorial progress tracking', () => {
    it('has completeTutorialPhase action', () => {
      expect(typeof useSessionStore.getState().completeTutorialPhase).toBe('function');
    });

    it('marks tutorial phase as completed', () => {
      const { completeTutorialPhase } = useSessionStore.getState();
      
      completeTutorialPhase('intro');
      
      const state = useSessionStore.getState();
      expect(state.tutorialProgress.phases.intro.completed).toBe(true);
    });

    it('can reset tutorial progress', () => {
      const { completeTutorialPhase, resetTutorialProgress } = useSessionStore.getState();
      
      // First set it to true
      completeTutorialPhase('intro');
      expect(useSessionStore.getState().tutorialProgress.phases.intro.completed).toBe(true);
      
      // Then reset it
      resetTutorialProgress();
      expect(useSessionStore.getState().tutorialProgress.phases.intro.completed).toBe(false);
    });

    it('updates specific tutorial phase properties', () => {
      const { updateTutorialProgress } = useSessionStore.getState();
      
      updateTutorialProgress('worldCreation', { lastStep: 2 });
      
      const state = useSessionStore.getState();
      // Need to cast to check lastStep since not all phases have it, but worldCreation does
      const phase = state.tutorialProgress.phases.worldCreation as { completed: boolean; skipped: boolean; lastStep: number };
      expect(phase.lastStep).toBe(2);
    });
  });

  describe('Integration with existing functionality', () => {
    it('does not interfere with session initialization', async () => {
      const { completeTutorialPhase, initializeSession } = useSessionStore.getState();
      
      completeTutorialPhase('intro');
      
      const mockCallback = jest.fn();
      await initializeSession('world-1', 'char-1', mockCallback);
      
      const state = useSessionStore.getState();
      expect(state.worldId).toBe('world-1');
      expect(state.characterId).toBe('char-1');
      expect(state.tutorialProgress.phases.intro.completed).toBe(true); // Should remain true
    });

    it('maintains tutorial state when ending sessions', () => {
      const { completeTutorialPhase, endSession, setSessionId } = useSessionStore.getState();
      
      completeTutorialPhase('intro');
      setSessionId('test-session');
      useSessionStore.setState({
        worldId: 'world-1',
        characterId: 'char-1',
      });
      
      endSession();
      
      const state = useSessionStore.getState();
      expect(state.tutorialProgress.phases.intro.completed).toBe(true); // Should persist through session end
    });
  });
});
