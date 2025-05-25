// src/lib/ai/__tests__/portraitGenerator.test-helpers.ts

import { AIClient, AIResponse } from '../types';

export function createMockAIClient(): AIClient {
  return {
    generateContent: jest.fn().mockResolvedValue({
      content: 'Mock response',
      role: 'assistant' as const
    } satisfies AIResponse),
    generateImage: jest.fn().mockResolvedValue({
      image: 'data:image/png;base64,mock',
      prompt: 'Mock prompt'
    })
  };
}