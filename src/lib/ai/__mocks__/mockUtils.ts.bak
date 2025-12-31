// src/lib/ai/__mocks__/mockUtils.ts

import { AIResponse, AIServiceError } from '../types';

/**
 * Creates a mock AI response
 * @param overrides - Properties to override defaults
 * @returns Mock AI response
 */
export const createMockResponse = (overrides = {}): AIResponse => ({
  content: 'Generated test content',
  finishReason: 'STOP',
  promptTokens: 10,
  completionTokens: 20,
  ...overrides
});

/**
 * Creates a mock error object
 * @param code - Error code
 * @param message - Error message
 * @param retryable - Whether error is retryable
 * @returns Mock error
 */
export const createMockError = (code: string, message: string, retryable: boolean): AIServiceError => ({
  code,
  message,
  retryable
});

/**
 * Predefined mock responses for testing
 */
export const mockResponses = {
  success: createMockResponse(),
  empty: createMockResponse({ content: '' }),
  longContent: createMockResponse({ 
    content: 'A very long response that simulates extensive generated content...'
  }),
  maxLength: createMockResponse({ finishReason: 'MAX_TOKENS' })
};

/**
 * Predefined mock errors for testing
 */
export const mockErrors = {
  network: createMockError('NETWORK_ERROR', 'Network error occurred', true),
  timeout: createMockError('TIMEOUT', 'Request timeout', true),
  rateLimit: createMockError('RATE_LIMIT', '429 Too Many Requests', true),
  auth: createMockError('AUTH_ERROR', 'Invalid API key', false),
  invalid: createMockError('INVALID_REQUEST', 'Invalid request format', false)
};
