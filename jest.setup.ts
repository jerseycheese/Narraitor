// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// DIAGNOSTIC: Log environment variable
if (process.env.DEBUG_JEST_SETUP === 'true') {
  console.log('[jest.setup.ts] GEMINI_API_KEY before setting:', process.env.GEMINI_API_KEY ? '***MASKED***' : 'NOT SET');
}
// Mock the worldStore module
jest.mock('@/state/worldStore');

// Mock the abstraction hooks globally
jest.mock('@/hooks', () => ({
  useFormState: jest.fn((options) => ({
    data: options?.initialData || {},
    updateField: jest.fn(),
    setData: jest.fn(),
    reset: jest.fn(),
    errors: [],
    hasErrors: false,
    isDirty: false,
    updateData: jest.fn(),
    setErrors: jest.fn(),
    clearErrors: jest.fn(),
    validate: jest.fn(() => []),
    isValid: jest.fn(() => true)
  })),
  useAsyncState: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    status: 'idle',
    execute: jest.fn(),
    reset: jest.fn(),
    setData: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn()
  })),
  useModal: jest.fn(() => ({
    isOpen: false,
    open: jest.fn(),
    close: jest.fn(),
    toggle: jest.fn()
  })),
  useErrorState: jest.fn(() => ({
    error: null,
    hasError: false,
    setError: jest.fn(),
    clearError: jest.fn(),
    setErrorFromCatch: jest.fn()
  })),
  // Re-export other hooks that might be imported
  useCharacterCreationAutoSave: jest.fn(),
  useNavigationFlow: jest.fn(),
  useNavigationLoading: jest.fn(),
  useNavigationPersistence: jest.fn(),
  usePointPoolManager: jest.fn(),
  useWizardState: jest.fn(),
  useAutoSave: jest.fn()
}));

// DIAGNOSTIC: Check if the mock was registered
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRegistry = (jest as any)._mockRegistry || {};
if (process.env.DEBUG_JEST_SETUP === 'true') {
  console.log('[jest.setup.ts] Mock registry contains worldStore:', '@/state/worldStore' in mockRegistry);
}
// Mock the next/navigation hooks
jest.mock('next/navigation', () => {
  const actualNav = jest.requireActual('next/navigation');
  return {
    ...actualNav,
    useRouter: jest.fn(),
    usePathname: jest.fn(() => '/test-path'),
    useSearchParams: jest.fn(() => new URLSearchParams()),
  };
});

// Set up any global mocks or configuration here
process.env.GEMINI_API_KEY = 'MOCK_API_KEY';

// DIAGNOSTIC: Confirm environment variable was set
if (process.env.DEBUG_JEST_SETUP === 'true') {
  console.log('[jest.setup.ts] GEMINI_API_KEY after setting:', process.env.GEMINI_API_KEY ? '***MASKED***' : 'NOT SET');
}

// Mock crypto.randomUUID for Jest environment (jsdom)
if (typeof global.self === 'undefined') {
  // Type assertion to satisfy TypeScript's type checking
  global.self = global as unknown as Window & typeof globalThis;
}

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => {
      // A simple UUID v4-like generator for testing
      let d = new Date().getTime(); // Timestamp
      let d2 = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0; // High-precision timestamp
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        let r = Math.random() * 16; // random number between 0 and 16
        if (d > 0) {
          // Use timestamp until depleted
          r = (d + r) % 16 | 0;
          d = Math.floor(d / 16);
        } else {
          // Use high-precision timestamp if available
          r = (d2 + r) % 16 | 0;
          d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
    },
  },
  writable: true, // Allow further modifications if needed by other tests
  configurable: true,
});
