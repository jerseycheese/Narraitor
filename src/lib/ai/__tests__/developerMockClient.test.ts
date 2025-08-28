// src/lib/ai/__tests__/developerMockClient.test.ts

import { DeveloperMockClient } from '../developerMockClient';
import { MockConfiguration } from '../types';

const createTestConfig = (): MockConfiguration => ({
  enabled: true,
  activeScenario: 'test-success',
  globalDelay: 100,
  enableDelayVariation: false,
  scenarios: [
    {
      id: 'test-success',
      name: 'Test Success',
      type: 'success',
      delay: 50,
      description: 'Quick success for testing'
    },
    {
      id: 'test-error',
      name: 'Test Error', 
      type: 'error',
      delay: 50,
      error: {
        code: 'TEST_ERROR',
        message: 'Test error message',
        retryable: true
      }
    },
    {
      id: 'test-custom',
      name: 'Test Custom',
      type: 'custom',
      delay: 50,
      response: {
        content: 'Custom test response',
        finishReason: 'STOP'
      }
    },
    {
      id: 'test-timeout',
      name: 'Test Timeout',
      type: 'timeout',
      delay: 50
    }
  ]
});

describe('DeveloperMockClient', () => {
  let mockClient: DeveloperMockClient;

  beforeEach(() => {
    mockClient = new DeveloperMockClient(createTestConfig());
    jest.clearAllMocks();
  });

  it('should generate successful response', async () => {
    const response = await mockClient.generateContent('Test prompt');

    expect(response.content).toBeDefined();
    expect(response.finishReason).toBe('STOP');
    expect(typeof response.promptTokens).toBe('number');
    expect(typeof response.completionTokens).toBe('number');
  });

  it('should use custom response when configured', async () => {
    mockClient.updateConfiguration({ activeScenario: 'test-custom' });
    
    const response = await mockClient.generateContent('Test prompt');

    expect(response.content).toBe('Custom test response');
  });

  it('should throw error for error scenario', async () => {
    mockClient.updateConfiguration({ activeScenario: 'test-error' });

    await expect(mockClient.generateContent('Test prompt'))
      .rejects
      .toMatchObject({
        code: 'TEST_ERROR',
        message: 'Test error message',
        retryable: true
      });
  });

  it('should throw error when disabled', async () => {
    mockClient.updateConfiguration({ enabled: false });

    await expect(mockClient.generateContent('Test prompt'))
      .rejects
      .toThrow('Developer mock client is disabled');
  });

  it('should generate mock image', async () => {
    const response = await mockClient.generateImage('Test prompt');

    expect(response.image).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(response.prompt).toBe('Test prompt');
  });

  it('should simulate delays', async () => {
    const start = Date.now();
    await mockClient.generateContent('Test prompt');
    const duration = Date.now() - start;
    
    // Should take at least the configured delay (50ms)
    expect(duration).toBeGreaterThanOrEqual(40); // Allow for some timing variance
  });

  it('should check availability based on enabled state', async () => {
    expect(await mockClient.isAvailable()).toBe(true);

    mockClient.updateConfiguration({ enabled: false });
    expect(await mockClient.isAvailable()).toBe(false);
  });
});