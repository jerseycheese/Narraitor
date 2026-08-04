/* eslint-disable no-console -- console IS the transport here. Vercel's runtime
   log is the destination for server-side reports, so routing this through the
   Logger (which is itself a console wrapper) or over an HTTP hop from the
   server to its own API would only add ways to fail. */
import { buildErrorReport, type ErrorReport, type ErrorSource } from './errorReport';

/** Grep handle for the runtime log. One report per line, machine-readable. */
const PREFIX = '[error-report]';

/**
 * Write a report as a single structured line. Shared with the telemetry API
 * route so client-originated and server-originated reports land identically.
 */
export function logErrorReport(report: ErrorReport): void {
  try {
    console.error(PREFIX, JSON.stringify(report));
  } catch {
    // Best-effort: a serialization failure must not take out the caller.
  }
}

/**
 * Server-side sink for an error report (#1641). Same sanitized shape as the
 * client path — see errorReport.ts for what does and doesn't travel.
 *
 * Never throws.
 */
export function reportServerError(
  error: unknown,
  context: { source?: ErrorSource; route: string; digest?: string }
): void {
  try {
    logErrorReport(
      buildErrorReport(error, {
        source: context.source ?? 'route',
        route: context.route,
        digest: context.digest,
      })
    );
  } catch {
    // Swallow everything: reporting is best-effort by design.
  }
}
