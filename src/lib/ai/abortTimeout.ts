/**
 * AbortSignal.timeout guarded for environments that lack it (jsdom in Jest).
 * Every production runtime here — modern browsers and Node 18+ — supports it;
 * returning undefined in jsdom just means no timeout guard inside tests.
 */
export function timeoutSignal(ms: number): AbortSignal | undefined {
  return typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(ms) : undefined;
}
