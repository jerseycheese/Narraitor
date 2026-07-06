// src/lib/ai/aiFetch.ts

import { PROVIDER_API_KEY_HEADER } from './providerKeyHeader';
import { getActiveProviderKey } from '@/state/providerStore';
import { anySignal, timeoutSignal } from './abortTimeout';
import { RETRYING_ROUTE_TIMEOUT_MS } from '@/lib/constants/aiTimeouts';

/**
 * fetch() wrapper for browser -> our own AI routes.
 *
 * Just-in-time pulls the active provider's decrypted key and attaches it as a
 * header, only when one exists. When there's no configured key, this is a plain
 * fetch and the server falls back to the env key — so dev, tests, and E2E are
 * unchanged. The plaintext key lives only in this closure for the duration of
 * the call; it's never stored or logged.
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

export async function aiFetch(
  input: string,
  init: RequestInit = {},
  options: AiFetchOptions = {}
): Promise<Response> {
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
  // No configured key -> identical to a plain fetch (env fallback applies
  // server-side). This keeps aiFetch a true drop-in: dev, tests, and E2E behave
  // exactly as before, and only a configured BYO key adds the header.
  if (!key) return fetch(input, withTimeout);

  const headers = new Headers(withTimeout.headers);
  headers.set(PROVIDER_API_KEY_HEADER, key);
  return fetch(input, { ...withTimeout, headers });
}
