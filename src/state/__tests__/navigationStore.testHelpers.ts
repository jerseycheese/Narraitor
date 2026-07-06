/**
 * Test helpers for navigationStore tests
 * Provides reusable mock storage and setup utilities
 */

// Mock storage helpers to prevent issues in test environment
jest.mock('@/utils/storageHelpers', () => ({
  isStorageAvailable: jest.fn(() => true),
  handleStorageError: jest.fn((error) => ({ shouldNotify: false, error })),
}));

// Mock logger
jest.mock('@/lib/utils/logger', () => {
  return jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }));
});

/**
 * Creates mock storage objects for sessionStorage and localStorage
 */
function createMockStorage() {
  return {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
}

/**
 * Sets up mock storage on window object
 */
export function setupMockStorage() {
  const mockSessionStorage = createMockStorage();
  const mockLocalStorage = createMockStorage();

  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });

  return { mockSessionStorage, mockLocalStorage };
}

/**
 * Gets the default navigation state for testing
 */
export function getDefaultNavigationState() {
  return {
    currentPath: null,
    previousPath: null,
    history: [],
    preferences: {
      sidebarCollapsed: false,
      breadcrumbsEnabled: true,
      autoNavigateOnSelect: true,
      showRecentPages: true,
      maxRecentPages: 10,
    },
    modals: {},
    currentFlowStep: null,
    breadcrumbs: [],
    isHydrated: false,
  };
}
