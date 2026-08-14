import { ClientGeminiClient } from './clientGeminiClient';
import { DEFAULT_TEXT_MODEL } from './config';
import type { AIClient } from './types';
import type { ProviderCredential, ProviderDescriptor } from './providers/types';

/**
 * Creates the AI client for server-side generation.
 *
 * Environment-aware client selection:
 * - Test environment: Uses mock from __mocks__
 * - Browser (client-side): Uses secure proxy
 * - Server-side with a credential: the client for the configured provider
 * - Server-side without one: Uses mock (for local development)
 *
 * The environment branches are unchanged; what is new is that the final branch
 * dispatches on *configuration* rather than assuming Gemini. Pass
 * a descriptor from `resolveProvider` and a player on any supported provider
 * gets that provider; pass a bare key and it behaves exactly as it always did.
 *
 * @param credential - the resolved provider descriptor for this request, or a
 *   bare Gemini key for the Gemini-only callers (the image routes).
 * @param modelOverride - the model, for the bare-key form only. A descriptor
 *   carries its own model and this is ignored.
 */
export const createDefaultGeminiClient = (
  credential?: ProviderCredential | null,
  modelOverride?: string | null
): AIClient => {
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

  const descriptor = toDescriptor(credential, modelOverride);
  if (descriptor) {
    // Required lazily: the factory pulls in every provider client, and the
    // branches above must stay reachable without loading any of them.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createProviderClient } = require('./providers/factory');
    return createProviderClient(descriptor);
  }

  // Server-side fallback: use mock for local development without API key
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MockGeminiClient } = require('./__mocks__/geminiClient.mock');
  return new MockGeminiClient();
};

/**
 * Normalize whatever the caller passed into a descriptor, or null when there's
 * no usable key at all.
 *
 * An omitted credential still falls back to the server env key, which is what
 * keeps local development working with nothing configured. An explicit null
 * does not: that is a request that resolved no Gemini key, and a player on
 * another provider produces it on every turn.
 */
function toDescriptor(
  credential?: ProviderCredential | null,
  modelOverride?: string | null
): ProviderDescriptor | null {
  if (credential && typeof credential === 'object') {
    return credential.apiKey ? credential : null;
  }

  const envKey =
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MOCK_API_KEY'
      ? process.env.GEMINI_API_KEY
      : null;
  const effectiveKey = credential === undefined ? envKey : credential;
  if (!effectiveKey) return null;

  return {
    type: 'gemini',
    endpoint: '',
    model: modelOverride ?? DEFAULT_TEXT_MODEL,
    apiKey: effectiveKey,
  };
}
