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
    process.env.NODE_ENV = 'development';
    delete process.env.GEMINI_API_KEY;
  });

  it('should create a browser-safe mock client without jest dependency when no API key is available', () => {
    expect(() => {
      const client = createAIClient();
      expect(client).toBeDefined();
      expect(typeof client.generateContent).toBe('function');
      expect(typeof client.generateImage).toBe('function');
    }).not.toThrow();
  });

  it('should throw helpful error when trying to use AI features in browser', async () => {
    const client = createAIClient();
    
    await expect(client.generateContent('test')).rejects.toThrow(
      'AI features are not available in the browser. Use server-side API routes instead.'
    );
    
    await expect(client.generateImage('test')).rejects.toThrow(
      'AI features are not available in the browser. Use server-side API routes instead.'
    );
  });
});