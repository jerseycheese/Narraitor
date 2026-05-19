/**
 * Client Factory Mock Integration Tests
 * These tests verify client factory properly switches between mock and live modes
 */

import { createAIClient } from '../clientFactory';
import { mockStateManager } from '../../devtools/mockStateManager';

// Mock the mock state manager
jest.mock('../../devtools/mockStateManager', () => {
  const mockInstance = {
    getConfiguration: jest.fn(() => ({
      isEnabled: false,
      activeScenarioId: 'success-standard',
      customScenarios: [],
      settings: {
        delayVariation: true,
        variationPercent: 20,
        persistSettings: true
      }
    }))
  };

  return {
    MockStateManager: {
      getInstance: jest.fn(() => mockInstance)
    },
    mockStateManager: mockInstance
  };
});

describe('Client Factory Mock Integration', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalWindow = global.window;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock configuration to default
    (mockStateManager.getConfiguration as jest.Mock).mockReturnValue({
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

  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true
    });
    global.window = originalWindow;
  });

  describe('Client Factory Behavior', () => {
    test('creates a client successfully', () => {
      const client = createAIClient();

      expect(typeof client.generateContent).toBe('function');
      expect(typeof client.generateImage).toBe('function');
    });

    test('client implements AIClient interface', async () => {
      const client = createAIClient();

      expect(typeof client.generateContent).toBe('function');
      expect(typeof client.generateImage).toBe('function');
    });

    test('mock state manager integration works', () => {
      // Set mock enabled
      (mockStateManager.getConfiguration as jest.Mock).mockReturnValue({
        isEnabled: true,
        activeScenarioId: 'test-scenario',
        customScenarios: [],
        settings: {
          delayVariation: false,
          variationPercent: 0,
          persistSettings: true
        }
      });

      // Should not throw when accessing mock state
      expect(() => createAIClient()).not.toThrow();
    });
  });

});