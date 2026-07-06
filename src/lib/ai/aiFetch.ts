// src/lib/ai/aiFetch.ts

import { PROVIDER_API_KEY_HEADER } from './providerKeyHeader';
import { getActiveProviderKey } from '@/state/providerStore';
import { timeoutSignal } from './abortTimeout';

/**
 * fetch() wrapper for browser -> our own AI routes.
 *
 * Just-in-time pulls the active provider's decrypted key and attaches it as a
 * header, only when one exists. When there's no configured key, this is a plain
 * fetch and the server falls back to the env key — so dev, tests, and E2E are
 * unchanged. The plaintext key lives only in this closure for the duration of
 * the call; it's never stored or logged.
 */
// Outer guard for the whole round-trip (server processing + Gemini call +
// its internal retries: worst case ~93s at 3x30s attempts plus backoff).
// GeminiClient enforces its own per-attempt timeout; this catches everything
// else so a hung request can't block the story loop forever.
const AI_REQUEST_TIMEOUT_MS = 120_000;

export async function aiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const key = await getActiveProviderKey().catch(() => null);
  const withTimeout: RequestInit = {
    ...init,
    signal: init.signal ?? timeoutSignal(AI_REQUEST_TIMEOUT_MS),
  };
  // No configured key -> identical to a plain fetch (env fallback applies
  // server-side). This keeps aiFetch a true drop-in: dev, tests, and E2E behave
  // exactly as before, and only a configured BYO key adds the header.
  if (!key) return fetch(input, withTimeout);

  const headers = new Headers(withTimeout.headers);
  headers.set(PROVIDER_API_KEY_HEADER, key);
  return fetch(input, { ...withTimeout, headers });
}
