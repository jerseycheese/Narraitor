// src/lib/ai/aiFetch.ts

import { PROVIDER_API_KEY_HEADER } from './providerKeyHeader';
import { getActiveProviderKey } from '@/state/providerStore';

/**
 * fetch() wrapper for browser -> our own AI routes.
 *
 * Just-in-time pulls the active provider's decrypted key and attaches it as a
 * header, only when one exists. When there's no configured key, this is a plain
 * fetch and the server falls back to the env key — so dev, tests, and E2E are
 * unchanged. The plaintext key lives only in this closure for the duration of
 * the call; it's never stored or logged.
 */
export async function aiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const key = await getActiveProviderKey().catch(() => null);
  // No configured key -> identical to a plain fetch (env fallback applies
  // server-side). This keeps aiFetch a true drop-in: dev, tests, and E2E behave
  // exactly as before, and only a configured BYO key adds the header.
  if (!key) return fetch(input, init);

  const headers = new Headers(init.headers);
  headers.set(PROVIDER_API_KEY_HEADER, key);
  return fetch(input, { ...init, headers });
}
