import { GeminiClient } from './geminiClient';
import { ClientGeminiClient } from './clientGeminiClient';
import { getDefaultConfig } from './config';

/**
 * Creates a default instance of GeminiClient for narrative generation
 *
 * Environment-aware client selection:
 * - Test environment: Uses mock from __mocks__
 * - Browser (client-side): Uses secure proxy
 * - Server-side with API key: Uses real client
 * - Server-side without API key: Uses mock (for local development)
 */
export const createDefaultGeminiClient = () => {
  // In test environment, Jest will automatically use the mock from __mocks__/geminiClient.mock.ts
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MockGeminiClient } = require('./__mocks__/geminiClient.mock');
    return new MockGeminiClient();
  }

  // In browser environment (client-side), use secure proxy
  if (typeof window !== 'undefined') {
    return new ClientGeminiClient();
  }

  // Server-side: use real client when API key is available
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MOCK_API_KEY') {
    return new GeminiClient(getDefaultConfig());
  }

  // Server-side fallback: use mock for local development without API key
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MockGeminiClient } = require('./__mocks__/geminiClient.mock');
  return new MockGeminiClient();
};
