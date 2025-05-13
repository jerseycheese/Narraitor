// src/lib/ai/__mocks__/geminiClient.ts

import { createMockResponse } from './mockUtils';
import { AIServiceConfig } from '../types';

/**
 * Mock Gemini client for testing
 * Maintains the same interface as real implementation
 */
export class GeminiClient {
  private config: AIServiceConfig;
  generateContent = jest.fn();
  
  constructor(config: AIServiceConfig) {
    this.config = config;
    this.generateContent.mockResolvedValue(createMockResponse());
  }
}
