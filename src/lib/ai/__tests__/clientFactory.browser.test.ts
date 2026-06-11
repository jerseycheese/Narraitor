/**
 * @jest-environment jsdom
 */

import { createAIClient } from '../clientFactory';

// Mock window to simulate browser environment
Object.defineProperty(global, 'window', {
  value: {},
  writable: true
});

describe('clientFactory browser behavior', () => {
  beforeEach(() => {
    // Mock process.env to simulate browser environment where GEMINI_API_KEY is not available
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true
    });
    delete process.env.GEMINI_API_KEY;
  });

  it('should throw helpful error when trying to use AI features in browser', async () => {
    const client = createAIClient();
    
    await expect(client.generateContent('test')).rejects.toThrow(
      'AI features are not available in the browser. Use server-side API routes instead.'
    );
    
    if (client.generateImage) {
      await expect(client.generateImage('test')).rejects.toThrow(
        'AI features are not available in the browser. Use server-side API routes instead.'
      );
    }
  });
});
