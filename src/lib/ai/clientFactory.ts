// src/lib/ai/clientFactory.ts

import { AIClient, AIServiceConfig } from './types';
import { PortraitGenerationClient } from './portraitGenerationClient';
import { getDefaultConfig } from './config';

/**
 * Simple browser-safe mock client for when API is not available
 */
class BrowserMockClient implements AIClient {
  async generateContent(): Promise<never> {
    throw new Error('AI features are not available in the browser. Use server-side API routes instead.');
  }

  async generateImage(): Promise<never> {
    throw new Error('AI features are not available in the browser. Use server-side API routes instead.');
  }
}

/**
 * Creates an AI client with image generation support
 */
export function createAIClient(config?: Partial<AIServiceConfig>): AIClient {
  const fullConfig = {
    ...getDefaultConfig(),
    ...config
  };

  // In test environment, use the proper mock
  if (process.env.NODE_ENV === 'test') {
    // Dynamic import for test environment only
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MockGeminiImageClient } = require('./__mocks__/geminiClient.image');
    return new MockGeminiImageClient();
  }

  // In browser environment without API key, use browser-safe mock
  if (typeof window !== 'undefined' && (!fullConfig.apiKey || fullConfig.apiKey === 'MOCK_API_KEY')) {
    return new BrowserMockClient();
  }

  // Use real client when API key is available (server-side)
  if (fullConfig.apiKey && fullConfig.apiKey !== 'MOCK_API_KEY') {
    return new PortraitGenerationClient(fullConfig);
  }

  // Fallback to browser-safe mock
  return new BrowserMockClient();
}
