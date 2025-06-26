// Mock implementation for sessionStore
export const useSessionStore = jest.fn((selector) => {
  const mockState = {
    savedSessions: {},
    resumeSavedSession: jest.fn().mockReturnValue(true),
    shouldShowOnboarding: jest.fn().mockReturnValue(false),
    onboardingCompleted: true,
    setOnboardingCompleted: jest.fn(),
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
    onboardingCompleted: true,
    setOnboardingCompleted: jest.fn(),
  })),
  setState: jest.fn(),
  subscribe: jest.fn(),
  destroy: jest.fn(),
};

export default mockSessionStore;