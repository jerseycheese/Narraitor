// src/lib/ai/providers/endpointGuard.ts

/**
 * Gate for provider endpoints that arrive from the browser.
 *
 * SECURITY: a player's provider endpoint travels in a request header and the
 * *server* makes the outbound call, so an unchecked value turns our API routes
 * into an unauthenticated request forwarder — and one that returns the upstream
 * body, so it is not even blind. Cloud metadata services and internal hosts are
 * the targets that matter. Everything below is a refusal to make that request,
 * not a warning.
 *
 * A rejected endpoint falls back to the built-in Gemini path rather than
 * failing the turn, so a bad or hostile header can't take the story loop down.
 *
 * What this does NOT stop, stated plainly so nobody reads more into it:
 * resolve-then-connect leaves a DNS-rebinding window, because the address this
 * module checks is not the address the socket ends up using. Closing that needs
 * the resolved IP pinned into the connection via a custom agent, which is not
 * available on every runtime this deploys to. The checks here raise the cost of
 * an attack substantially; they are not a proof of unreachability.
 */

/**
 * Resolve a hostname to every address it answers with.
 *
 * Imported lazily and with `webpackIgnore` because this module is reachable
 * from the client graph — `defaultGeminiClient` requires the provider factory,
 * and client hooks import that. A static `node:dns` import there fails the
 * production build outright (UnhandledSchemeError), so the dependency stays a
 * runtime one on the server path that actually uses it.
 */
async function resolveHostAddresses(hostname: string): Promise<Array<{ address: string }>> {
  const dns = await import(/* webpackIgnore: true */ 'node:dns/promises');
  return dns.lookup(hostname, { all: true });
}

/**
 * Address literals that must never be reachable: loopback, RFC 1918 private
 * space, carrier-grade NAT, the link-local range that carries cloud instance
 * metadata, and the IPv6 equivalents.
 *
 * Applied both to a hostname written as an IP and to every address a hostname
 * resolves to.
 */
const BLOCKED_ADDRESS_PATTERNS: RegExp[] = [
  /^127\./,
  /^0\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  // Carrier-grade NAT; routable to a provider's internal network, not the public internet.
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^::1?$/,
  /^fe80:/i,
  // Unique local addresses (fc00::/7).
  /^f[cd][0-9a-f]{2}:/i,
];

/**
 * The IPv4 address inside an IPv4-mapped IPv6 address, or null.
 *
 * Both spellings have to be handled, because the two sources disagree.
 * `dns.lookup` reports the dotted form, `::ffff:127.0.0.1`. WHATWG URL parsing
 * serializes the same address as `::ffff:7f00:1`, so a hostname that arrived in
 * a URL never carries the dotted form — a dotted-only check reads as a control
 * while passing every mapped address a player can type.
 *
 * Unwrapping rather than pattern-matching the mapped form also means the IPv4
 * list below is the only place private ranges are written down.
 */
function mappedIPv4(address: string): string | null {
  const dotted = address.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (dotted) return dotted[1];

  const hex = address.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (!hex) return null;

  const high = parseInt(hex[1], 16);
  const low = parseInt(hex[2], 16);
  return [high >> 8, high & 0xff, low >> 8, low & 0xff].join('.');
}

/** Hostnames that name a local or internal machine without being an address. */
const BLOCKED_HOST_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /\.localhost$/i,
  // Common internal-only TLDs. Not exhaustive — DNS resolution below is what
  // actually catches an internal name, this just fails the obvious ones early.
  /\.local$/i,
  /\.internal$/i,
];

function isBlockedAddress(address: string): boolean {
  const bare = address.replace(/^\[|\]$/g, '');
  const candidates = [bare, mappedIPv4(bare)].filter((value): value is string => value !== null);
  return candidates.some((candidate) =>
    BLOCKED_ADDRESS_PATTERNS.some((pattern) => pattern.test(candidate))
  );
}

/**
 * The synchronous half: is this a well-formed https URL that doesn't obviously
 * name a private host?
 *
 * Used where an answer is needed without I/O — resolving a request's provider,
 * and rejecting a typed endpoint in the config wizard. The network-level check
 * runs later, at the point of the request.
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

  if (BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) return false;
  return !isBlockedAddress(hostname);
}

/**
 * The asynchronous half, run immediately before the request goes out: resolve
 * the hostname and refuse if *any* address it answers with is private.
 *
 * This is what catches the case the string check cannot — a perfectly ordinary
 * public hostname, under the attacker's control, whose A record points at
 * 169.254.169.254. A resolution failure is treated as a refusal: if we can't
 * tell where the request would go, we don't send it.
 *
 * Throws rather than returning a boolean so the refusal cannot be ignored at a
 * call site.
 */
export async function assertPublicProviderEndpoint(endpoint: string): Promise<void> {
  if (!isSafeProviderEndpoint(endpoint)) {
    throw new Error('Service error: the provider endpoint must be an https URL on a public host');
  }

  const { hostname } = new URL(endpoint);

  let addresses: Array<{ address: string }>;
  try {
    addresses = await resolveHostAddresses(hostname);
  } catch {
    throw new Error('Network error - the provider endpoint could not be resolved');
  }

  if (addresses.length === 0 || addresses.some(({ address }) => isBlockedAddress(address))) {
    throw new Error('Service error: the provider endpoint resolves to a private address');
  }
}
