// src/lib/ai/clientFactory.ts

import { AIClient } from './types';

/**
 * Creates an AI client with image generation support
 *
 * For testing: Use the mock from __mocks__/geminiClient.image.ts (Jest auto-mocking)
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
