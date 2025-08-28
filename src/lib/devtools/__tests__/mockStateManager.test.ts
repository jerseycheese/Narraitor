/**
 * Tests for Mock State Manager - Persistence Functionality
 * Issue #156: These tests verify mock settings persistence and state management
 */

import { MockStateManager } from '../mockStateManager';

// Mock localStorage for persistence testing
const mockStorage = (() => {
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
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockStorage,
  writable: true
});

describe('MockStateManager - Persistence Tests', () => {
  let stateManager: MockStateManager;

  beforeEach(() => {
    // Clear localStorage mock
    mockStorage.clear();
    jest.clearAllMocks();
    
    // Reset singleton instance
    MockStateManager['instance'] = undefined;
    
    // Get fresh instance
    stateManager = MockStateManager.getInstance();
  });

  afterEach(() => {
    // Reset to clean state
    MockStateManager['instance'] = undefined;
  });

  describe('Basic Functionality', () => {
    test('creates singleton instance correctly', () => {
      const instance1 = MockStateManager.getInstance();
      const instance2 = MockStateManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('gets default configuration initially', () => {
      const config = stateManager.getConfiguration();
      expect(config).toEqual({
        isEnabled: false,
        activeScenarioId: 'success-standard',
        customScenarios: [],
        settings: {
          delayVariation: true,
          variationPercent: 20,
          persistSettings: true
        }
      });
    });

    test('enables and disables mock mode', () => {
      stateManager.setMockEnabled(true);
      expect(stateManager.getConfiguration().isEnabled).toBe(true);
      
      stateManager.setMockEnabled(false);
      expect(stateManager.getConfiguration().isEnabled).toBe(false);
    });

    test('sets active scenario', () => {
      stateManager.setActiveScenario('error-timeout');
      expect(stateManager.getConfiguration().activeScenarioId).toBe('error-timeout');
    });
  });

  describe('Persistence', () => {
    test('saves configuration to localStorage when enabled', () => {
      stateManager.setMockEnabled(true);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'narraitor-devtools-mock-config',
        expect.any(String)
      );
    });

    test('persists scenario selection', () => {
      stateManager.setActiveScenario('error-timeout');
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'narraitor-devtools-mock-config',
        expect.stringContaining('error-timeout')
      );
    });
  });

  describe('Subscription System', () => {
    test('notifies subscribers of config changes', () => {
      const subscriber = jest.fn();
      stateManager.subscribe(subscriber);
      
      stateManager.setMockEnabled(true);
      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({ isEnabled: true })
      );
    });

    test('unsubscribe function works correctly', () => {
      const subscriber = jest.fn();
      const unsubscribe = stateManager.subscribe(subscriber);
      
      unsubscribe();
      stateManager.setMockEnabled(true);
      
      expect(subscriber).not.toHaveBeenCalled();
    });
  });
});