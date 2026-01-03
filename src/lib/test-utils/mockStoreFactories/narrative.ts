import type { NarrativeStore } from './types';

export function createMockNarrativeStore(
  overrides?: Partial<NarrativeStore>
): NarrativeStore {
  return {
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
    _hasHydrated: false,
    addSegment: jest.fn(),
    updateSegment: jest.fn(),
    deleteSegment: jest.fn(),
    addDecision: jest.fn(),
    updateDecision: jest.fn(),
    selectDecisionOption: jest.fn(),
    getSessionDecisions: jest.fn(() => []),
    getLatestDecision: jest.fn(() => null),
    getSessionSegments: jest.fn(() => []),
    reset: jest.fn(),
    clearSessionSegments: jest.fn(),
    clearSessionDecisions: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    setLoading: jest.fn(),
    setHasHydrated: jest.fn(),
    generateEnding: jest.fn().mockResolvedValue(undefined),
    clearEnding: jest.fn(),
    setCurrentEnding: jest.fn(),
    saveEndingToHistory: jest.fn(),
    hasActiveEnding: jest.fn(() => false),
    getEndingForSession: jest.fn(() => null),
    isSessionEnded: jest.fn(() => false),
    markSessionEnded: jest.fn(),
    ...overrides,
  } as NarrativeStore;
}
