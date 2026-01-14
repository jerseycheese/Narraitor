import { useSessionStore } from '../sessionStore';

describe('sessionStore tutorial', () => {
  beforeEach(() => {
    useSessionStore.getState().resetTutorialProgress();
  });

  describe('Actions', () => {
    it('updateTutorialProgress updates specific phase data', () => {
      useSessionStore.getState().updateTutorialProgress('intro', { completed: true });
      const progress = useSessionStore.getState().tutorialProgress;
      expect(progress.phases.intro.completed).toBe(true);
      expect(progress.phases.intro.skipped).toBe(false);
    });

    it('dismissTutorialHint adds hint ID to dismissed list', () => {
      useSessionStore.getState().dismissTutorialHint('test-hint');
      const progress = useSessionStore.getState().tutorialProgress;
      expect(progress.dismissedHints).toContain('test-hint');
      
      // Should not duplicate
      useSessionStore.getState().dismissTutorialHint('test-hint');
      expect(progress.dismissedHints.length).toBe(1);
    });

    it('completeTutorialPhase marks phase as completed', () => {
      useSessionStore.getState().completeTutorialPhase('worldCreation');
      const progress = useSessionStore.getState().tutorialProgress;
      expect(progress.phases.worldCreation.completed).toBe(true);
    });

    it('resetTutorialProgress resets to default state', () => {
      // Modify state first
      useSessionStore.getState().updateTutorialProgress('intro', { completed: true });
      useSessionStore.getState().dismissTutorialHint('hint-1');
      
      // Reset
      useSessionStore.getState().resetTutorialProgress();
      
      const progress = useSessionStore.getState().tutorialProgress;
      expect(progress.phases.intro.completed).toBe(false);
      expect(progress.dismissedHints).toHaveLength(0);
    });
  });

  describe('Selectors', () => {
    it('shouldShowTutorialPhase returns correct boolean', () => {
      const store = useSessionStore.getState();
      
      expect(store.shouldShowTutorialPhase('intro')).toBe(true);
      
      store.updateTutorialProgress('intro', { completed: true });
      expect(useSessionStore.getState().shouldShowTutorialPhase('intro')).toBe(false);
      
      store.updateTutorialProgress('worldCreation', { skipped: true });
      expect(useSessionStore.getState().shouldShowTutorialPhase('worldCreation')).toBe(false);
    });

    it('isTutorialComplete returns true only when all phases are done', () => {
      const store = useSessionStore.getState();
      expect(store.isTutorialComplete()).toBe(false);
      
      // Complete all phases
      store.completeTutorialPhase('intro');
      store.completeTutorialPhase('worldCreation');
      store.completeTutorialPhase('characterCreation');
      store.completeTutorialPhase('firstPlay');
      
      expect(useSessionStore.getState().isTutorialComplete()).toBe(true);
    });

    it('getCurrentTutorialPhase returns the first incomplete phase', () => {
      const store = useSessionStore.getState();
      expect(store.getCurrentTutorialPhase()).toBe('intro');
      
      store.completeTutorialPhase('intro');
      expect(useSessionStore.getState().getCurrentTutorialPhase()).toBe('worldCreation');
      
      store.completeTutorialPhase('worldCreation');
      expect(useSessionStore.getState().getCurrentTutorialPhase()).toBe('characterCreation');
    });

    it('isFirstTimeUser returns true if intro is not completed/skipped', () => {
      const store = useSessionStore.getState();
      expect(store.isFirstTimeUser()).toBe(true);
      
      store.completeTutorialPhase('intro');
      expect(useSessionStore.getState().isFirstTimeUser()).toBe(false);
    });
  });

  describe('Migration (v2 -> v3)', () => {
    it('migrates from v2 by clearing old onboarding and setting fresh tutorial state', () => {
      // Access the migrate function from persist options
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const migrate = (useSessionStore as any).persist.getOptions().migrate;
      
      const v2State = {
        onboardingCompleted: true,
        someOtherField: 'value'
      };
      
      // Run migration
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const migratedState = migrate(v2State, 2) as any;
      
      // Assertions
      expect(migratedState.onboardingCompleted).toBeUndefined(); // Should be removed
      expect(migratedState.tutorialProgress).toBeDefined();
      expect(migratedState.tutorialProgress.phases.intro.completed).toBe(false); // Clean break - reset to false
      expect(migratedState.someOtherField).toBe('value'); // Preserves other fields
    });

    it('handles legacy users who had onboardingCompleted=false', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const migrate = (useSessionStore as any).persist.getOptions().migrate;
      
      const v2State = {
        onboardingCompleted: false
      };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const migratedState = migrate(v2State, 2) as any;
      
      expect(migratedState.onboardingCompleted).toBeUndefined();
      expect(migratedState.tutorialProgress.phases.intro.completed).toBe(false);
    });
  });
});
