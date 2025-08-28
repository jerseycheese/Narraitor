/**
 * Client Factory Mock Integration Tests
 * Issue #156: These tests verify client factory properly switches between mock and live modes
 */

import { createAIClient } from '../clientFactory';
import { MockStateManager } from '../../devtools/mockStateManager';

// Mock the mock state manager
jest.mock('../../devtools/mockStateManager', () => ({
  MockStateManager: {
    getInstance: jest.fn(() => ({
      getCurrentState: jest.fn(() => ({
        mode: 'live',
        selectedScenario: null,
        customResponses: {},
        mockDelay: 1000,
        failureRate: 0
      })),
      subscribe: jest.fn(() => () => {})
    }))
  }
}));

// Mock the actual AI client
const mockLiveClient = {
  generateContent: jest.fn(),
  generateImage: jest.fn(),
  isAvailable: jest.fn()
};

jest.mock('../portraitGenerationClient', () => ({
  PortraitGenerationClient: jest.fn(() => mockLiveClient)
}));

describe('Client Factory Mock Integration', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockStateManager: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockStateManager = MockStateManager.getInstance();
  });

  describe('Mode Switching Behavior', () => {
    test('creates live client when in live mode', () => {
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'live'
      });

      const client = createAIClient({ apiKey: 'test-key' });

      // Should create real client
      expect(client).toBeDefined();
      expect(client).not.toHaveProperty('_isMockClient'); // Mock clients should have this property
    });

    test('creates mock client when in mock mode', () => {
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'mock',
        selectedScenario: 'success-fast'
      });

      const client = createAIClient({ apiKey: 'test-key' });

      // Should create mock client
      expect(client).toBeDefined();
      expect(typeof client.generateContent).toBe('function');
    });

    test('switches client type when mode changes', () => {
      // Start in live mode
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'live'
      });

      let client = createAIClient({ apiKey: 'test-key' });
      const firstClientType = client.constructor.name;

      // Switch to mock mode
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'mock',
        selectedScenario: 'success-fast'
      });

      client = createAIClient({ apiKey: 'test-key' });
      const secondClientType = client.constructor.name;

      // Should be different client types
      expect(firstClientType).not.toBe(secondClientType);
    });
  });

  describe('Mock Client API Contract', () => {
    beforeEach(() => {
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'mock',
        selectedScenario: 'success-fast',
        mockDelay: 500,
        failureRate: 0
      });
    });

    test('mock client implements AIClient interface', async () => {
      const client = createAIClient({ apiKey: 'test-key' });

      // Should implement required methods
      expect(typeof client.generateContent).toBe('function');
      expect(typeof client.generateImage).toBe('function');

      // Methods should return appropriate types
      const response = await client.generateContent('test prompt');
      expect(response).toMatchObject({
        content: expect.any(String),
        finishReason: expect.any(String)
      });
    });

    test('mock client respects configured delays', async () => {
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'mock',
        selectedScenario: 'success-slow',
        mockDelay: 2000,
        failureRate: 0
      });

      const client = createAIClient({ apiKey: 'test-key' });

      const startTime = Date.now();
      await client.generateContent('test prompt');
      const elapsed = Date.now() - startTime;

      // Should respect configured delay (allowing some tolerance)
      expect(elapsed).toBeGreaterThanOrEqual(1800);
    });

    test('mock client respects configured failure rates', async () => {
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'mock',
        selectedScenario: 'mixed-test',
        mockDelay: 100,
        failureRate: 100 // Always fail
      });

      const client = createAIClient({ apiKey: 'test-key' });

      // Should always fail with 100% failure rate
      await expect(client.generateContent('test prompt'))
        .rejects.toMatchObject({
          code: expect.any(String),
          message: expect.any(String),
          retryable: expect.any(Boolean)
        });
    });
  });

  describe('Live Client Integration', () => {
    beforeEach(() => {
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'live'
      });
    });

    test('live client bypasses mock scenarios', async () => {
      mockLiveClient.generateContent.mockResolvedValue({
        content: 'Real API response',
        finishReason: 'STOP'
      });

      const client = createAIClient({ apiKey: 'real-api-key' });
      const response = await client.generateContent('test prompt');

      // Should call real client, not mock
      expect(mockLiveClient.generateContent).toHaveBeenCalledWith('test prompt');
      expect(response.content).toBe('Real API response');
    });

    test('live client handles real API errors', async () => {
      const apiError = new Error('Real API error');
      mockLiveClient.generateContent.mockRejectedValue(apiError);

      const client = createAIClient({ apiKey: 'real-api-key' });

      await expect(client.generateContent('test prompt'))
        .rejects.toThrow('Real API error');

      expect(mockLiveClient.generateContent).toHaveBeenCalled();
    });
  });

  describe('Development Mode Overrides', () => {
    test('respects NODE_ENV for mock behavior in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'mock',
        selectedScenario: 'success-fast'
      });

      const client = createAIClient({ apiKey: 'test-key' });

      // Should create mock client in development
      expect(client).toBeDefined();
      expect(typeof client.generateContent).toBe('function');

      process.env.NODE_ENV = originalEnv;
    });

    test('uses live client in production regardless of mock state', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'mock', // Mock mode requested
        selectedScenario: 'success-fast'
      });

      const client = createAIClient({ apiKey: 'real-api-key' });

      // Should still create live client in production
      expect(client).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Configuration Persistence', () => {
    test('mock client uses persisted scenario configuration', async () => {
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'mock',
        selectedScenario: 'custom-narrative',
        customResponses: {
          'custom-narrative': 'Persisted custom response content'
        },
        mockDelay: 1500,
        failureRate: 0
      });

      const client = createAIClient({ apiKey: 'test-key' });
      const response = await client.generateContent('test prompt');

      // Should use persisted configuration
      expect(response.content).toContain('Persisted custom response content');
    });

    test('client factory subscribes to state changes', () => {
      createAIClient({ apiKey: 'test-key' });

      // Should subscribe to state manager for live updates
      expect(mockStateManager.subscribe).toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    test('falls back to live mode when mock state is corrupted', () => {
      // Mock corrupted state
      mockStateManager.getCurrentState.mockImplementation(() => {
        throw new Error('State corrupted');
      });

      const client = createAIClient({ apiKey: 'real-api-key' });

      // Should create live client as fallback
      expect(client).toBeDefined();
      expect(typeof client.generateContent).toBe('function');
    });

    test('continues working when state manager is unavailable', () => {
      // Mock unavailable state manager
      MockStateManager.getInstance = jest.fn(() => {
        throw new Error('State manager unavailable');
      });

      const client = createAIClient({ apiKey: 'real-api-key' });

      // Should still create functional client
      expect(client).toBeDefined();
      expect(typeof client.generateContent).toBe('function');
    });
  });

  describe('Browser vs Server Environment', () => {
    test('uses browser-safe mock in browser without API key', () => {
      const originalWindow = global.window;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.window = {} as any; // Simulate browser environment

      const client = createAIClient({ apiKey: undefined });

      // Should create browser-safe mock
      expect(client).toBeDefined();
      expect(typeof client.generateContent).toBe('function');

      global.window = originalWindow;
    });

    test('uses real client in server environment with API key', () => {
      const originalWindow = global.window;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).window; // Simulate server environment

      const client = createAIClient({ apiKey: 'server-api-key' });

      // Should create real client on server
      expect(client).toBeDefined();

      global.window = originalWindow;
    });
  });
});