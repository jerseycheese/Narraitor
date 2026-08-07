import { buildErrorReport, type ErrorSource } from './errorReport';
import { isPlaywrightEnv } from '@/lib/utils/isPlaywrightEnv';

const ENDPOINT = '/api/telemetry/error';

/**
 * Client transport for an error report (#1641).
 *
 * Only the sanitized report from buildErrorReport is sent — see that file for
 * the privacy contract. Dev stays console-only: the sink exists because
 * production failures are invisible, and a local crash already isn't.
 *
 * Never throws and never rejects. A reporter that can break the app it reports
 * on is worse than no reporter.
 */
export function reportError(
  error: unknown,
  context: { source?: ErrorSource; digest?: string } = {}
): void {
  try {
    if (typeof window === 'undefined') return;
    if (isPlaywrightEnv()) return;
    if (process.env.NODE_ENV !== 'production') return;

    const report = buildErrorReport(error, {
      source: context.source ?? 'client',
      route: window.location.pathname,
      digest: context.digest,
    });
    const body = JSON.stringify(report);

    // sendBeacon survives the navigation or unload that often follows a crash.
    // Fall back to keepalive fetch where it's missing or refuses the payload.
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const queued = navigator.sendBeacon(
        ENDPOINT,
        new Blob([body], { type: 'application/json' })
      );
      if (queued) return;
    }

    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Swallow everything: reporting is best-effort by design.
  }
}
