// src/lib/ai/clientFactory.ts

import { AIClient, AIServiceConfig } from './types';
import { PortraitGenerationClient } from './portraitGenerationClient';
import { MockGeminiImageClient } from './__mocks__/geminiClient.image';
import { getDefaultConfig } from './config';

/**
 * Creates an AI client with image generation support
 */
export function createAIClient(config?: Partial<AIServiceConfig>): AIClient {
  const fullConfig = {
    ...getDefaultConfig(),
    ...config
  };

  // Use mock client in test environment or when no API key
  if (process.env.NODE_ENV === 'test' || !fullConfig.apiKey || fullConfig.apiKey === 'MOCK_API_KEY') {
    return new MockGeminiImageClient();
  }

  return new PortraitGenerationClient(fullConfig);
}