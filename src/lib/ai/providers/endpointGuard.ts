// src/lib/ai/providers/endpointGuard.ts

/**
 * Gate for provider endpoints that arrive from the browser.
 *
 * SECURITY: a player's provider endpoint travels in a request header and the
 * *server* makes the outbound call, so an unchecked value turns our API routes
 * into a request forwarder pointed anywhere the deployment can reach — cloud
 * metadata services and internal hosts included. Everything below is a refusal
 * to make that request, not a warning.
 *
 * A rejected endpoint falls back to the built-in Gemini path rather than
 * failing the turn, so a bad or hostile header can't take the story loop down.
 */

/**
 * Hostnames that must never be reachable through a player-supplied endpoint:
 * loopback, RFC 1918 private space, and the link-local range that carries cloud
 * instance metadata.
 */
const BLOCKED_HOST_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /\.localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^\[?::1\]?$/,
  /^\[?fe80:/i,
  // Unique local addresses (fc00::/7).
  /^\[?f[cd][0-9a-f]{2}:/i,
];

/**
 * Whether an endpoint is safe for the server to call on a player's behalf.
 *
 * HTTPS only. A local Ollama is the obvious casualty of that rule, and
 * deliberately so: a server-side route can't reach a model running on the
 * player's own machine anyway, so allowing plain HTTP would buy nothing and
 * open the forwarder.
 */
export function isSafeProviderEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:') return false;

  const hostname = url.hostname;
  if (!hostname) return false;

  return !BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}
