// src/lib/ai/__mocks__/geminiClient.mock.ts

import { createMockResponse } from './mockUtils';

/**
 * Mock Gemini client for testing
 */
export class MockGeminiClient {
  generateContent = typeof jest !== 'undefined' 
    ? jest.fn().mockResolvedValue(createMockResponse())
    : async () => createMockResponse();
}
