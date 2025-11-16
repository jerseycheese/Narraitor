// src/lib/ai/clientFactory.ts

import { AIClient } from './types';
import { GeminiClient } from './geminiClient';
import { getDefaultConfig } from './config';
import { mockStateManager } from '../devtools/mockStateManager';
import { MockScenarios } from './__mocks__/mockScenarios';

/**
 * Development mock client that integrates with DevTools mock system
 */
class DevMockClient implements AIClient {
  private mockScenarios: MockScenarios;

  constructor() {
    this.mockScenarios = new MockScenarios();
  }

  async generateContent(): Promise<import('./types').AIResponse> {
    const config = mockStateManager.getConfiguration();

    if (config.settings.delayVariation) {
      return this.mockScenarios.executeScenarioWithVariation(
        config.activeScenarioId,
        config.settings.variationPercent
      );
    } else {
      return this.mockScenarios.executeScenario(config.activeScenarioId);
    }
  }

  async generateImage(): Promise<import('./types').AIImageResponse> {
    const config = mockStateManager.getConfiguration();

    // Simulate image generation with mock scenario timing
    const scenario = this.mockScenarios.getScenario(config.activeScenarioId);
    const delay = scenario ? scenario.delay : 1000;

    await new Promise(resolve => setTimeout(resolve, delay));

    return {
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMzMzMyIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TW9jayBJbWFnZTwvdGV4dD4KPC9zdmc+',
      prompt: 'Mock image generation'
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

/**
 * Creates an AI client with image generation support
 *
 * For testing: Use the mock from __mocks__/geminiClient.image.ts (Jest auto-mocking)
 * For development with DevTools mocking enabled: Use DevMockClient
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

  // In development mode, check if DevTools mock is enabled
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const mockConfig = mockStateManager.getConfiguration();
    if (mockConfig.isEnabled) {
      return new DevMockClient();
    }
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
