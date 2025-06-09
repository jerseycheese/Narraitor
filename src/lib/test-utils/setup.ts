/**
 * Enhanced Test Setup Utilities
 * 
 * Common test setup functions to reduce duplication across test files.
 * Provides consistent mocking and setup patterns, enhanced with custom matchers
 * and comprehensive test environment configuration.
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { setupCustomMatchers } from './assertions';

/**
 * Sets up a mock Next.js router
 */
interface MockRouter {
  push: jest.Mock;
  replace: jest.Mock;
  back: jest.Mock;
  prefetch: jest.Mock;
  pathname: string;
  query: Record<string, string>;
  asPath: string;
}

export function setupMockRouter(overrides: Partial<MockRouter> = {}) {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockBack = jest.fn();
  const mockPrefetch = jest.fn();
  
  const mockRouter = {
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    prefetch: mockPrefetch,
    pathname: '/test',
    query: {},
    asPath: '/test',
    ...overrides,
  };

  // Mock next/navigation
  jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    usePathname: () => mockRouter.pathname,
    useSearchParams: () => new URLSearchParams(mockRouter.query),
  }));

  return {
    mockRouter,
    mockPush,
    mockReplace,
    mockBack,
    mockPrefetch,
  };
}

/**
 * Sets up a mock Zustand store
 */
export function setupMockStore<T>(
  storePath: string,
  initialState: T,
  additionalMocks: Record<string, jest.Mock> = {}
) {
  const mockState = {
    ...initialState,
    ...additionalMocks,
  };

  // Create getState function
  const getState = jest.fn(() => mockState);
  const setState = jest.fn((partial) => {
    if (typeof partial === 'function') {
      Object.assign(mockState, partial(mockState));
    } else {
      Object.assign(mockState, partial);
    }
  });
  const subscribe = jest.fn();
  const destroy = jest.fn();

  const mockStore = {
    getState,
    setState,
    subscribe,
    destroy,
  };

  jest.mock(storePath, () => ({
    [storePath.split('/').pop()!.replace('.ts', '')]: mockStore,
  }));

  return {
    mockStore,
    mockState,
    getState,
    setState,
  };
}

/**
 * Custom render function that includes common providers
 */
type CustomRenderOptions = Omit<RenderOptions, 'wrapper'>;

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  // Add any global providers here
  // For now, just pass through to regular render
  return render(ui, options);
}

/**
 * Sets up common test environment with enhanced features
 */
export function setupTestEnvironment() {
  // Setup custom Jest matchers
  setupCustomMatchers();
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset modules
  jest.resetModules();
  
  // Clear localStorage
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
  }
  
  // Setup console mocks to suppress expected errors
  const originalError = console.error;
  const originalWarn = console.warn;
  
  beforeAll(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
  });

  // Global mock for ResizeObserver (common in UI tests)
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Global mock for IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock matchMedia for responsive design tests (only in jsdom environment)
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
    });
  }

  // Mock crypto.randomUUID for ID generation with proper UUID format
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: jest.fn(() => {
        // Generate a proper UUID v4 format for tests
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }),
    },
  });
  
  return {
    consoleError: console.error as jest.Mock,
    consoleWarn: console.warn as jest.Mock,
  };
}

/**
 * Creates a mock for async functions with proper typing
 */
export function createAsyncMock<T extends (...args: unknown[]) => Promise<unknown>>(
  implementation?: T
): jest.MockedFunction<T> {
  return jest.fn(implementation || (() => Promise.resolve())) as unknown as jest.MockedFunction<T>;
}

/**
 * Waits for async updates in tests
 */
export async function waitForAsync() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Helper to test hook results
 */
export function expectHookResult<T>(
  result: { current: T },
  matcher: (value: T) => void
) {
  matcher(result.current);
}

/**
 * Mock data generators for common test scenarios
 */
export const mockData = {
  id: (prefix = 'test') => `${prefix}-${Math.random().toString(36).substr(2, 9)}`,
  timestamp: () => '2023-01-01T00:00:00.000Z',
  error: (message = 'Test error') => new Error(message),
};

/**
 * Common test assertions
 */
export const assertions = {
  toBeCalledWithPartial: (mock: jest.Mock, expected: unknown) => {
    expect(mock).toHaveBeenCalledWith(
      expect.objectContaining(expected)
    );
  },
  
  toHaveBeenCalledOnceWith: (mock: jest.Mock, ...args: unknown[]) => {
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(...args);
  },
  
  toContainElement: (container: HTMLElement, testId: string) => {
    expect(container.querySelector(`[data-testid="${testId}"]`)).toBeInTheDocument();
  },
};
