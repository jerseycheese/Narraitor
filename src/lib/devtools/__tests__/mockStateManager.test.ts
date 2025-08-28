/**
 * Tests for Mock State Manager - Persistence Functionality
 * Issue #156: These tests verify mock settings persistence and state management
 */

import { MockStateManager, MockState } from '../mockStateManager';

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
    
    // Get fresh instance
    stateManager = MockStateManager.getInstance();
  });

  afterEach(() => {
    // Reset to clean state
    MockStateManager['instance'] = undefined;
  });

  describe('State Persistence', () => {
    test('saves mock settings to localStorage when changed', () => {
      stateManager.setMode('mock');
      
      // Should save to localStorage
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'devtools-mock-state',
        expect.stringContaining('"mode":"mock"')
      );
    });

    test('persists selected scenario across sessions', () => {
      stateManager.setMode('mock');
      stateManager.setScenario('success-slow');
      
      // Should save scenario selection
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'devtools-mock-state',
        expect.stringContaining('"selectedScenario":"success-slow"')
      );
    });

    test('persists custom response configurations', () => {
      stateManager.setCustomResponse('custom-test', 'Custom response content');
      
      // Should save custom responses
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'devtools-mock-state',
        expect.stringContaining('"customResponses"')
      );
      
      const savedState = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
      expect(savedState.customResponses['custom-test']).toBe('Custom response content');
    });

    test('persists delay and failure rate settings', () => {
      stateManager.setMockDelay(2500);
      stateManager.setFailureRate(15);
      
      // Should save timing settings
      const lastCall = mockStorage.setItem.mock.calls[mockStorage.setItem.mock.calls.length - 1];
      const savedState = JSON.parse(lastCall[1]);
      
      expect(savedState.mockDelay).toBe(2500);
      expect(savedState.failureRate).toBe(15);
    });
  });

  describe('State Restoration', () => {
    test('restores persisted state on initialization', () => {
      const persistedState: MockState = {
        mode: 'mock',
        selectedScenario: 'success-fast',
        customResponses: { 'test': 'Test response' },
        mockDelay: 1500,
        failureRate: 10
      };
      
      // Mock persisted data
      mockStorage.getItem.mockReturnValueOnce(JSON.stringify(persistedState));
      
      // Create new instance (should load persisted state)
      MockStateManager['instance'] = undefined;
      const newManager = MockStateManager.getInstance();
      
      const currentState = newManager.getCurrentState();
      expect(currentState).toEqual(persistedState);
    });

    test('uses default state when no persistence data exists', () => {
      // No persisted data
      mockStorage.getItem.mockReturnValueOnce(null);
      
      MockStateManager['instance'] = undefined;
      const newManager = MockStateManager.getInstance();
      
      const currentState = newManager.getCurrentState();
      expect(currentState).toEqual({
        mode: 'live',
        selectedScenario: null,
        customResponses: {},
        mockDelay: 1000,
        failureRate: 0
      });
    });

    test('handles corrupted persistence data gracefully', () => {
      // Corrupted JSON data
      mockStorage.getItem.mockReturnValueOnce('{"mode":"mock","invalid":}');
      
      MockStateManager['instance'] = undefined;
      const newManager = MockStateManager.getInstance();
      
      // Should fall back to default state without throwing
      const currentState = newManager.getCurrentState();
      expect(currentState.mode).toBe('live'); // Default
    });

    test('validates restored state structure', () => {
      // Invalid state structure
      const invalidState = {
        mode: 'invalid-mode',
        selectedScenario: 123, // Should be string
        mockDelay: 'not-a-number'
      };
      
      mockStorage.getItem.mockReturnValueOnce(JSON.stringify(invalidState));
      
      MockStateManager['instance'] = undefined;
      const newManager = MockStateManager.getInstance();
      
      const currentState = newManager.getCurrentState();
      
      // Should sanitize invalid values
      expect(currentState.mode).toBe('live'); // Default for invalid mode
      expect(currentState.selectedScenario).toBeNull(); // Default for invalid type
      expect(typeof currentState.mockDelay).toBe('number'); // Should be number
    });
  });

  describe('State Change Notifications', () => {
    test('notifies subscribers when state changes', () => {
      const mockSubscriber = jest.fn();
      
      stateManager.subscribe(mockSubscriber);
      stateManager.setMode('mock');
      
      expect(mockSubscriber).toHaveBeenCalledWith({
        mode: 'mock',
        selectedScenario: null,
        customResponses: {},
        mockDelay: 1000,
        failureRate: 0
      });
    });

    test('allows multiple subscribers', () => {
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      
      stateManager.subscribe(subscriber1);
      stateManager.subscribe(subscriber2);
      
      stateManager.setScenario('success-fast');
      
      expect(subscriber1).toHaveBeenCalled();
      expect(subscriber2).toHaveBeenCalled();
    });

    test('subscription returns unsubscribe function', () => {
      const mockSubscriber = jest.fn();
      
      const unsubscribe = stateManager.subscribe(mockSubscriber);
      stateManager.setMode('mock');
      
      expect(mockSubscriber).toHaveBeenCalledTimes(1);
      
      // Unsubscribe and test no more notifications
      unsubscribe();
      stateManager.setMode('live');
      
      expect(mockSubscriber).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    test('handles subscriber errors gracefully', () => {
      const errorSubscriber = jest.fn(() => {
        throw new Error('Subscriber error');
      });
      const goodSubscriber = jest.fn();
      
      stateManager.subscribe(errorSubscriber);
      stateManager.subscribe(goodSubscriber);
      
      // Should not throw and should still notify good subscriber
      expect(() => {
        stateManager.setMode('mock');
      }).not.toThrow();
      
      expect(errorSubscriber).toHaveBeenCalled();
      expect(goodSubscriber).toHaveBeenCalled();
    });
  });

  describe('Concurrent Access', () => {
    test('handles rapid state changes without corruption', async () => {
      // Simulate rapid changes from UI interactions
      const changes = [
        () => stateManager.setMode('mock'),
        () => stateManager.setScenario('success-fast'),
        () => stateManager.setMockDelay(2000),
        () => stateManager.setFailureRate(5),
        () => stateManager.setCustomResponse('test', 'response')
      ];
      
      // Execute all changes rapidly
      await Promise.all(changes.map(change => Promise.resolve(change())));
      
      const finalState = stateManager.getCurrentState();
      
      // Final state should be consistent
      expect(finalState.mode).toBe('mock');
      expect(finalState.selectedScenario).toBe('success-fast');
      expect(finalState.mockDelay).toBe(2000);
      expect(finalState.failureRate).toBe(5);
      expect(finalState.customResponses['test']).toBe('response');
    });

    test('singleton pattern prevents multiple instances', () => {
      const instance1 = MockStateManager.getInstance();
      const instance2 = MockStateManager.getInstance();
      
      expect(instance1).toBe(instance2);
      
      // Changes through one instance should affect the other
      instance1.setMode('mock');
      expect(instance2.getCurrentState().mode).toBe('mock');
    });
  });

  describe('Storage Error Handling', () => {
    test('handles localStorage unavailable gracefully', () => {
      // Mock localStorage throwing error
      mockStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage unavailable');
      });
      
      // Should not throw, just continue without persistence
      expect(() => {
        stateManager.setMode('mock');
      }).not.toThrow();
      
      // State should still be updated in memory
      expect(stateManager.getCurrentState().mode).toBe('mock');
    });

    test('continues functioning when storage quota exceeded', () => {
      mockStorage.setItem.mockImplementationOnce(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });
      
      stateManager.setCustomResponse('large-response', 'x'.repeat(10000));
      
      // Should handle gracefully and continue working
      expect(stateManager.getCurrentState().customResponses['large-response']).toBe('x'.repeat(10000));
    });
  });

  describe('State Validation', () => {
    test('rejects invalid mode values', () => {
      // Should handle invalid mode gracefully
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (stateManager as any).setMode('invalid-mode');
      }).not.toThrow();
      
      // Should maintain valid state
      const state = stateManager.getCurrentState();
      expect(['live', 'mock']).toContain(state.mode);
    });

    test('sanitizes delay values to reasonable ranges', () => {
      stateManager.setMockDelay(-100); // Negative delay
      expect(stateManager.getCurrentState().mockDelay).toBeGreaterThanOrEqual(0);
      
      stateManager.setMockDelay(999999999); // Extremely large delay
      expect(stateManager.getCurrentState().mockDelay).toBeLessThan(60000); // Max 1 minute
    });

    test('clamps failure rate to 0-100 range', () => {
      stateManager.setFailureRate(-10);
      expect(stateManager.getCurrentState().failureRate).toBe(0);
      
      stateManager.setFailureRate(150);
      expect(stateManager.getCurrentState().failureRate).toBe(100);
      
      stateManager.setFailureRate(50);
      expect(stateManager.getCurrentState().failureRate).toBe(50);
    });
  });
});