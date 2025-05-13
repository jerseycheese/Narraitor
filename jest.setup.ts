// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock the next/navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/test-path',
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}));

// Set up any global mocks or configuration here

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
