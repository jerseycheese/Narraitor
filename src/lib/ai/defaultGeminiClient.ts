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
 *
 * @param apiKeyOverride - the player's bring-your-own key, resolved from the
 *   request (see resolveApiKey). When present, the server real client uses it;
 *   otherwise it falls back to the env key, exactly as before.
 * @param modelOverride - the model the player picked, resolved from the request
 *   (see resolveModel). Omitted means the default text model.
 */
export const createDefaultGeminiClient = (
  apiKeyOverride?: string | null,
  modelOverride?: string | null
) => {
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

  // Server-side: the player's resolved key (passed by the route) -> env key.
  const envKey =
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MOCK_API_KEY'
      ? process.env.GEMINI_API_KEY
      : null;
  const effectiveKey = apiKeyOverride ?? envKey;
  if (effectiveKey) {
    return new GeminiClient(getDefaultConfig(effectiveKey, modelOverride));
  }

  // Server-side fallback: use mock for local development without API key
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MockGeminiClient } = require('./__mocks__/geminiClient.mock');
  return new MockGeminiClient();
};
