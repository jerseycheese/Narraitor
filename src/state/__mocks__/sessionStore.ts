// Mock implementation for sessionStore
export const useSessionStore = jest.fn((selector) => {
  const mockState = {
    savedSessions: {},
    resumeSavedSession: jest.fn().mockReturnValue(true),
    shouldShowOnboarding: jest.fn().mockReturnValue(false),
    tutorialProgress: {
      phases: {
        intro: { completed: true, skipped: false },
        worldCreation: { completed: false, skipped: false, lastStep: 0 },
        worldGeneration: { completed: false, skipped: false, lastStep: 0 },
        characterCreation: { completed: false, skipped: false, lastStep: 0 },
        firstPlay: { completed: false, skipped: false },
      },
      dismissedHints: [],
      lastActiveStep: null,
    },
    completeTutorialPhase: jest.fn(),
  };
  
  // If selector is provided, call it with the mock state
  if (typeof selector === 'function') {
    return selector(mockState);
  }
  
  // Otherwise return the full state
  return mockState;
});

// Mock the store itself for getState access
const mockSessionStore = {
  getState: jest.fn(() => ({
    savedSessions: {},
    resumeSavedSession: jest.fn().mockReturnValue(true),
    shouldShowOnboarding: jest.fn().mockReturnValue(false),
    tutorialProgress: {
      phases: {
        intro: { completed: true, skipped: false },
        worldCreation: { completed: false, skipped: false, lastStep: 0 },
        worldGeneration: { completed: false, skipped: false, lastStep: 0 },
        characterCreation: { completed: false, skipped: false, lastStep: 0 },
        firstPlay: { completed: false, skipped: false },
      },
      dismissedHints: [],
      lastActiveStep: null,
    },
    completeTutorialPhase: jest.fn(),
  })),
  setState: jest.fn(),
  subscribe: jest.fn(),
  destroy: jest.fn(),
};

export default mockSessionStore;
