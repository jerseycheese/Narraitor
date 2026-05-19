// src/lib/ai/clientFactory.ts

import { AIClient } from './types';
import { GeminiClient } from './geminiClient';
import { getDefaultConfig } from './config';

/**
 * Creates an AI client with image generation support
 *
 * For testing: Use the mock from __mocks__/geminiClient.image.ts (Jest auto-mocking)
 * For development with DevTools mocking enabled: dynamically loads DevMockClient
 *   from src/lib/devtools/devMockClient. The dynamic load keeps production AI
 *   code free of static imports on devtools/test fixtures.
 * For development with API key: Use real GeminiClient
 * For browser: Returns error-throwing client (use API routes instead)
 */
export function createAIClient(): AIClient {
  // In test environment, use the proper mock
  if (process.env.NODE_ENV === 'test') {
    // Dynamic import for test environment only
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MockGeminiImageClient } = require('./__mocks__/geminiClient.image');
    return new MockGeminiImageClient();
  }

  // In development mode in the browser, check if DevTools mocking is enabled.
  // The devtools module is loaded lazily so production bundles that never hit
  // this branch don't drag devtools/__mocks__ into the AI graph.
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { tryCreateDevMockClient } = require('../devtools/devMockClient');
    const devClient = tryCreateDevMockClient();
    if (devClient) return devClient;
  }

  // In development with API key (server or browser), use real client
  if (process.env.NODE_ENV === 'development' && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MOCK_API_KEY') {
    if (typeof window === 'undefined') {
      // Server-side in development with API key
      return new GeminiClient(getDefaultConfig());
    }
  }

  // In browser or development without API key, features are unavailable
  // Client should use server-side API routes instead
  const browserClient = {
    async generateContent(): Promise<never> {
      throw new Error('AI features are not available in the browser. Use server-side API routes instead.');
    },
    async generateImage(): Promise<never> {
      throw new Error('AI features are not available in the browser. Use server-side API routes instead.');
    },
    async isAvailable(): Promise<boolean> {
      return false;
    }
  };

  return browserClient as AIClient;
}
