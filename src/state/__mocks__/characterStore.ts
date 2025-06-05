// src/state/__mocks__/characterStore.ts

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
  characters: {},
  currentCharacterId: null,
  error: null,
  loading: false,
  createCharacter: createMockFn('char-123'),
  updateCharacter: createMockFn(),
  deleteCharacter: createMockFn(),
  setCurrentCharacter: createMockFn(),
  addAttribute: createMockFn(),
  updateAttribute: createMockFn(),
  removeAttribute: createMockFn(),
  addSkill: createMockFn(),
  reset: createMockFn(),
  setError: createMockFn(),
  clearError: createMockFn(),
  setLoading: createMockFn(),
  getCharacterById: createMockFn(null)
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSelector = (selector?: any) => {
  if (typeof selector === 'function') {
    return selector(mockState);
  }
  return mockState;
};

export const characterStore = isJestEnvironment ? jest.fn(mockSelector) : mockSelector;
export const useCharacterStore = characterStore;

// Add Zustand-style methods
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(characterStore as any).getState = createMockFn(mockState);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(characterStore as any).setState = createMockFn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(characterStore as any).subscribe = createMockFn(() => createMockFn());
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(characterStore as any).destroy = createMockFn();
