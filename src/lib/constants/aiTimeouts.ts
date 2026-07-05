/**
 * Shared AI request budgets (milliseconds), importable from both the browser
 * and API-route code. The invariant: a browser-side ceiling must be derived
 * from the server-side budget of the route it calls (server budget + headroom),
 * never sized independently — otherwise the two drift and the client ends up
 * waiting on a response the server gave up on long ago.
 */

/**
 * Server budget for a single Gemini attempt: makeGeminiRequest's
 * AbortController timeout and GeminiClient's per-attempt abort signal.
 */
export const GEMINI_ATTEMPT_TIMEOUT_MS = 30_000;

/**
 * Headroom the browser grants on top of the server budget it's waiting on:
 * transport, serverless cold start, queuing, and JSON handling.
 */
export const AI_CLIENT_HEADROOM_MS = 15_000;

/**
 * Browser ceiling for single-attempt text routes (/api/narrative/generate,
 * /api/narrative/choices). Those routes make exactly one Gemini attempt via
 * makeGeminiRequest — no retries — so the client budget is one attempt plus
 * headroom, not the retry-loop worst case.
 */
export const SINGLE_ATTEMPT_TEXT_TIMEOUT_MS =
  GEMINI_ATTEMPT_TIMEOUT_MS + AI_CLIENT_HEADROOM_MS;

/**
 * Browser ceiling for routes that run GeminiClient's retry loop server-side
 * (3 attempts x 30s + exponential backoff ≈ 93s worst case) or image
 * generation. Also aiFetch's default when no tighter budget is given.
 */
export const RETRYING_ROUTE_TIMEOUT_MS = 120_000;
