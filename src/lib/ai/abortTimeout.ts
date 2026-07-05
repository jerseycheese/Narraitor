/**
 * AbortSignal.timeout guarded for environments that lack it (jsdom in Jest).
 * Every production runtime here — modern browsers and Node 18+ — supports it;
 * returning undefined in jsdom just means no timeout guard inside tests.
 */
export function timeoutSignal(ms: number): AbortSignal | undefined {
  return typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(ms) : undefined;
}

/**
 * Compose signals so the result aborts when ANY input aborts — lets a caller's
 * cancellation signal ride alongside a timeout ceiling instead of replacing it.
 * Uses native AbortSignal.any where available, with a manual fallback for
 * runtimes that lack it (jsdom). Undefined inputs are skipped; composing fewer
 * than two real signals returns the lone signal (or undefined) unchanged.
 */
export function anySignal(
  ...signals: Array<AbortSignal | undefined>
): AbortSignal | undefined {
  const present = signals.filter((s): s is AbortSignal => Boolean(s));
  if (present.length <= 1) return present[0];
  if (typeof AbortSignal.any === 'function') return AbortSignal.any(present);

  const controller = new AbortController();
  for (const signal of present) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), {
      once: true,
    });
  }
  return controller.signal;
}
