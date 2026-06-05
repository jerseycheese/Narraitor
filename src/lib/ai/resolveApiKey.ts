// src/lib/ai/resolveApiKey.ts

import type { NextRequest } from 'next/server';
import { PROVIDER_API_KEY_HEADER } from './providerKeyHeader';

export { PROVIDER_API_KEY_HEADER };

/**
 * Resolve the effective Gemini key for a request.
 *
 * Priority: the player's bring-your-own key (sent per request in
 * PROVIDER_API_KEY_HEADER) -> the server env key as a dev/local fallback. Returns
 * null when neither is usable, so callers reproduce today's "no key" behavior
 * exactly (mock client / "API key not configured").
 *
 * The MOCK_API_KEY sentinel only gates the env branch — a real player would
 * never type it. NextRequest is a type-only import, so this module is safe to
 * pull into the client bundle (for the shared header constant).
 *
 * SECURITY: never log the return value or the header.
 */
export function resolveApiKey(request?: NextRequest): string | null {
  const headerKey = request?.headers.get(PROVIDER_API_KEY_HEADER)?.trim();
  if (headerKey) return headerKey;

  const envKey = process.env.GEMINI_API_KEY;
  if (!envKey || envKey === 'MOCK_API_KEY') return null;
  return envKey;
}
