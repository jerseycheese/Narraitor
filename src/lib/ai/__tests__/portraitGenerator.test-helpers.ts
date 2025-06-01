// src/lib/ai/__tests__/portraitGenerator.test-helpers.ts

import { AIResponse, AIImageResponse } from '../types';

type MockAIClient = {
  generateContent: jest.MockedFunction<(prompt: string) => Promise<AIResponse>>;
  generateImage?: jest.MockedFunction<(prompt: string) => Promise<AIImageResponse>>;
};

export function createMockAIClient(): MockAIClient {
  return {
    generateContent: jest.fn().mockResolvedValue({
      content: 'Mock response',
      finishReason: 'stop'
    } satisfies AIResponse),
    generateImage: jest.fn().mockResolvedValue({
      image: 'data:image/png;base64,mock',
      prompt: 'Mock prompt'
    } satisfies AIImageResponse)
  };
}