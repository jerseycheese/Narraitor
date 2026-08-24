// src/lib/ai/aiFetch.ts

import {
  PROVIDER_API_KEY_HEADER,
  PROVIDER_ENDPOINT_HEADER,
  PROVIDER_MAX_TOKENS_HEADER,
  PROVIDER_MODEL_HEADER,
  PROVIDER_TEMPERATURE_HEADER,
  PROVIDER_TOP_P_HEADER,
  PROVIDER_TYPE_HEADER,
} from './providerKeyHeader';
import {
  checkActiveProviderRateLimit,
  getActiveProviderAdvancedSettings,
  getActiveProviderKey,
  getActiveProviderModel,
  getActiveProviderRouting,
} from '@/state/providerStore';
import { anySignal, timeoutSignal } from './abortTimeout';
import { RETRYING_ROUTE_TIMEOUT_MS } from '@/lib/constants/aiTimeouts';

/**
 * fetch() wrapper for browser -> our own AI routes.
 *
 * Just-in-time pulls the active provider's decrypted key and attaches it as a
 * header, only when one exists, along with the model that provider is
 * configured to use. With nothing configured this is a plain fetch and the
 * server falls back to the env key and the default model, so dev, tests, and
 * E2E are unchanged. The plaintext key lives only in this closure for the
 * duration of the call; it's never stored or logged.
 */

export interface AiFetchOptions {
  /**
   * Ceiling for this request. Callers hitting a single-attempt route should
   * pass a budget derived from that route's server timeout (see
   * lib/constants/aiTimeouts); the default covers the worst-case retrying/
   * image routes so a hung request can never block the story loop forever.
   */
  timeoutMs?: number;
}

/**
 * Thrown instead of making the request when the active provider's own
 * client-side request budget (Advanced settings -> rate limiting) is
 * exhausted. Distinguishable from a network failure so a caller could choose
 * to say so, though most just surface the message.
 */
export class ProviderRateLimitError extends Error {
  constructor() {
    super('Provider rate limit reached - configured maximum requests per hour exceeded');
    this.name = 'ProviderRateLimitError';
  }
}

export async function aiFetch(
  input: string,
  init: RequestInit = {},
  options: AiFetchOptions = {}
): Promise<Response> {
  // Checked first and unconditionally: a player who turned this on wants it
  // enforced before anything else about the request is even built.
  if (!checkActiveProviderRateLimit()) throw new ProviderRateLimitError();

  const key = await getActiveProviderKey().catch(() => null);
  const withTimeout: RequestInit = {
    ...init,
    // A caller-supplied signal (e.g. the narrative race's AbortController)
    // composes with the ceiling rather than replacing it: the request dies
    // on whichever fires first.
    signal: anySignal(
      init.signal ?? undefined,
      timeoutSignal(options.timeoutMs ?? RETRYING_ROUTE_TIMEOUT_MS)
    ),
  };
  const model = getActiveProviderModel();
  const routing = getActiveProviderRouting();
  const advanced = getActiveProviderAdvancedSettings();
  const hasAdvancedOverrides =
    advanced?.temperature !== undefined ||
    advanced?.topP !== undefined ||
    advanced?.maxTokens !== undefined;
  // Nothing configured -> identical to a plain fetch (env key and default model
  // apply server-side). This keeps aiFetch a true drop-in: dev, tests, and E2E
  // behave exactly as before.
  if (!key && !model && !routing && !hasAdvancedOverrides) return fetch(input, withTimeout);

  const headers = new Headers(withTimeout.headers);
  if (key) headers.set(PROVIDER_API_KEY_HEADER, key);
  if (model) headers.set(PROVIDER_MODEL_HEADER, model);
  // The type and endpoint are what let the server reach a provider other than
  // Gemini at all; without them a key for any other service is posted to
  // Google. The server ignores both unless this same request carries the key.
  if (routing) {
    headers.set(PROVIDER_TYPE_HEADER, routing.type);
    if (routing.endpoint) headers.set(PROVIDER_ENDPOINT_HEADER, routing.endpoint);
  }
  // Advanced generation-parameter overrides, from the provider's collapsed
  // Advanced panel. Sent only when actually set — see resolveApiKey, which
  // reads these the same way it reads type/endpoint above.
  if (advanced?.temperature !== undefined) {
    headers.set(PROVIDER_TEMPERATURE_HEADER, String(advanced.temperature));
  }
  if (advanced?.topP !== undefined) {
    headers.set(PROVIDER_TOP_P_HEADER, String(advanced.topP));
  }
  if (advanced?.maxTokens !== undefined) {
    headers.set(PROVIDER_MAX_TOKENS_HEADER, String(advanced.maxTokens));
  }
  return fetch(input, { ...withTimeout, headers });
}
