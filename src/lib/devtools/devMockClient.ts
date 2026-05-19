// src/lib/devtools/devMockClient.ts
//
// Lives in devtools (not in src/lib/ai) so that the production AI client
// barrel does not statically import devtools or test fixtures. clientFactory.ts
// dynamically requires this module only in dev+browser when DevTools mocking
// is enabled.

import type { AIClient, AIResponse, AIImageResponse } from '../ai/types';
import { mockStateManager } from './mockStateManager';
import { MockScenarios } from '../ai/__mocks__/mockScenarios';

const MOCK_IMAGE_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMzMzMyIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TW9jayBJbWFnZTwvdGV4dD4KPC9zdmc+';

class DevMockClient implements AIClient {
  private mockScenarios = new MockScenarios();

  async generateContent(): Promise<AIResponse> {
    const config = mockStateManager.getConfiguration();

    if (config.settings.delayVariation) {
      return this.mockScenarios.executeScenarioWithVariation(
        config.activeScenarioId,
        config.settings.variationPercent
      );
    }
    return this.mockScenarios.executeScenario(config.activeScenarioId);
  }

  async generateImage(): Promise<AIImageResponse> {
    const config = mockStateManager.getConfiguration();
    const scenario = this.mockScenarios.getScenario(config.activeScenarioId);
    const delay = scenario ? scenario.delay : 1000;

    await new Promise(resolve => setTimeout(resolve, delay));

    return {
      image: MOCK_IMAGE_DATA_URL,
      prompt: 'Mock image generation',
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

/**
 * Returns a DevMockClient when DevTools mocking is enabled in the current
 * mockStateManager configuration, otherwise null. Callers should fall through
 * to their next client option when null is returned.
 */
export function tryCreateDevMockClient(): AIClient | null {
  const config = mockStateManager.getConfiguration();
  return config.isEnabled ? new DevMockClient() : null;
}
