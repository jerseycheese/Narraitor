// src/state/__mocks__/narrativeStore.ts

// Check if we're in a Jest environment
const isJestEnvironment = typeof jest !== 'undefined';

// Create mock functions that work in both Jest and browser environments
const createMockFn = (returnValue?: unknown) => {
  if (isJestEnvironment) {
    return jest.fn(() => returnValue);
  }
  return () => returnValue;
};

const mockState = {
  segments: {},
  sessionSegments: {},
  decisions: {},
  sessionDecisions: {},
  endedSessions: {},
  currentEnding: null,
  isGeneratingEnding: false,
  endingError: null,
  error: null,
  loading: false,
  _hasHydrated: true,

  // Actions
  addSegment: createMockFn('segment-123'),
  updateSegment: createMockFn(),
  deleteSegment: createMockFn(),
  addDecision: createMockFn('decision-123'),
  updateDecision: createMockFn(),
  selectDecisionOption: createMockFn(),
  getSessionDecisions: createMockFn([]),
  getLatestDecision: createMockFn(null),
  getSessionSegments: createMockFn([]),
  reset: createMockFn(),
  clearSessionSegments: createMockFn(),
  clearSessionDecisions: createMockFn(),
  setError: createMockFn(),
  clearError: createMockFn(),
  setLoading: createMockFn(),
  setHasHydrated: createMockFn(),

  // Ending actions
  generateEnding: createMockFn(),
  clearEnding: createMockFn(),
  setCurrentEnding: createMockFn(),
  updateCurrentEnding: createMockFn(),
  saveEndingToHistory: createMockFn(),
  hasActiveEnding: createMockFn(false),
  getEndingForSession: createMockFn(null),
  isSessionEnded: createMockFn(false),
  markSessionEnded: createMockFn()
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSelector = (selector?: any) => {
  if (typeof selector === 'function') {
    return selector(mockState);
  }
  return mockState;
};

export const narrativeStore = isJestEnvironment ? jest.fn(mockSelector) : mockSelector;
export const useNarrativeStore = narrativeStore;

// Add Zustand-style methods
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(narrativeStore as any).getState = createMockFn(mockState);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(narrativeStore as any).setState = createMockFn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(narrativeStore as any).subscribe = createMockFn(() => createMockFn());
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(narrativeStore as any).destroy = createMockFn();