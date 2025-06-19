/**
 * Test Utilities for Mocking Zustand Stores
 * 
 * This file provides utility functions to consistently mock Zustand stores
 * for testing components that use them, ensuring proper test isolation.
 */

// Define a type for the mock store function
type MockStoreFunction = {
  (selector: unknown): unknown;
  setState: jest.Mock;
  getState: jest.Mock;
  subscribe: jest.Mock;
};

/**
 * Creates a properly mocked Zustand store for testing
 * 
 * @param initialState The initial state object for the store
 * @returns A mocked store object with setState, getState, and subscribe methods
 */
export const createMockStore = (initialState: Record<string, unknown>): MockStoreFunction => {
  // Create a basic mock function
  const selectorFn = jest.fn(function(selector: unknown): unknown {
    // When called with a selector, apply the selector to our mock state
    if (typeof selector === 'function') {
      return selector(initialState);
    }
    // Otherwise return the mock store
    return initialState;
  });
  
  // Create the mockStore object with the correct structure
  const mockStore = selectorFn as unknown as MockStoreFunction;
  
  // Add required Zustand store methods
  mockStore.setState = jest.fn((updater) => {
    const newState = typeof updater === 'function' 
      ? updater(initialState)
      : updater;
      
    Object.assign(initialState, newState);
    return initialState;
  });
  
  mockStore.getState = jest.fn(() => initialState);
  mockStore.subscribe = jest.fn(() => jest.fn());
  
  return mockStore;
};

/**
 * Creates a mock for the world store with common methods and properties
 * 
 * @returns A mocked world store for testing components
 */
export const createMockWorldStore = (): MockStoreFunction => {
  const createWorldMock = jest.fn().mockReturnValue('mock-world-id');
  
  return createMockStore({
    worlds: {},
    createWorld: createWorldMock,
    error: null,
    loading: false,
    setCurrentWorld: jest.fn(),
    fetchWorlds: jest.fn().mockResolvedValue(undefined)
  });
};
