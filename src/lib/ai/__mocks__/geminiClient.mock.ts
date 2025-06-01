// src/lib/ai/__mocks__/geminiClient.mock.ts

import { createMockResponse } from './mockUtils';

/**
 * Mock Gemini client for testing
 */
export class MockGeminiClient {
  generateContent = jest.fn().mockResolvedValue(createMockResponse());
}
