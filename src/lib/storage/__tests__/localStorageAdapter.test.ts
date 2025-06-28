/**
 * Tests for LocalStorage backup adapter
 * Tests critical state backup functionality for data protection
 */

import { LocalStorageAdapter } from '../localStorageAdapter';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    adapter = new LocalStorageAdapter();
  });

  describe('critical state backup', () => {
    test('stores critical state with timestamp', async () => {
      const criticalState = {
        activeWorldId: 'world-123',
        activeCharacterId: 'char-456',
        activeSessionId: 'session-789',
      };

      await adapter.storeCriticalState(criticalState);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'narraitor-critical-state',
        expect.stringContaining('"activeWorldId":"world-123"')
      );
    });

    test('retrieves critical state successfully', async () => {
      const criticalState = {
        activeWorldId: 'world-123',
        activeCharacterId: 'char-456',
        activeSessionId: 'session-789',
      };

      await adapter.storeCriticalState(criticalState);
      const retrieved = await adapter.getCriticalState();

      expect(retrieved).toEqual(expect.objectContaining(criticalState));
      expect(retrieved?.lastSaved).toBeDefined();
    });

    test('returns null when no critical state exists', async () => {
      const result = await adapter.getCriticalState();
      expect(result).toBeNull();
    });

    test('handles corrupted critical state gracefully', async () => {
      localStorageMock.setItem('narraitor-critical-state', 'invalid-json');

      const result = await adapter.getCriticalState();
      expect(result).toBeNull();
    });
  });

  describe('storage availability', () => {
    test('detects when localStorage is available', () => {
      expect(adapter.isAvailable()).toBe(true);
    });

    test('handles localStorage unavailability gracefully', () => {
      const originalLocalStorage = window.localStorage;
      // @ts-expect-error - Testing unavailability
      delete window.localStorage;

      const unavailableAdapter = new LocalStorageAdapter();
      expect(unavailableAdapter.isAvailable()).toBe(false);

      // Restore
      window.localStorage = originalLocalStorage;
    });
  });

  describe('size management', () => {
    test('validates critical state size before storing', async () => {
      const largeCriticalState = {
        activeWorldId: 'world-123',
        activeCharacterId: 'char-456',
        activeSessionId: 'session-789',
        extraData: 'x'.repeat(10000), // Large data
      };

      await adapter.storeCriticalState(largeCriticalState);

      // Should still store but warn about size
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });
});