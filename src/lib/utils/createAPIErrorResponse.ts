import { getUserFriendlyError } from './errorUtils';
import { reportServerError } from '@/lib/telemetry/reportServerError';

/**
 * Creates a standardized API error response using NextResponse.
 *
 * Consolidates duplicate error response formatting across all API routes.
 * Automatically converts errors to user-friendly messages and includes
 * all necessary fields for consistent client-side error handling.
 *
 * Server failures (status >= 500) are also forwarded to the error sink
 * (#1641). This is the single hook covering every route that runs through
 * processGeminiTextRequest — narrative/generate, narrative/choices,
 * ai/validate-provider — plus generate-character and generate-world, which is
 * why those 17 routes didn't each need editing. A client 4xx is the caller's
 * mistake, not a production failure, so it isn't reported.
 *
 * Lives outside errorUtils.ts (which it used to share a file with) so that
 * errorUtils stays a pure leaf: the moment a transport imported it, the
 * classification seam closed a cycle the skott gate counts.
 *
 * @param error - Error object or string message to convert
 * @param status - HTTP status code (defaults to 500)
 * @param details - Optional additional details to include in response
 * @returns NextResponse with standardized error format
 *
 * @example
 * ```ts
 * // In an API route
 * return createAPIErrorResponse(
 *   new Error('400 bad request: world data is required'),
 *   400
 * );
 *
 * // With additional details
 * return createAPIErrorResponse(
 *   new Error('Service error'),
 *   500,
 *   'Specific error details here'
 * );
 * ```
 */
export function createAPIErrorResponse(
  error: Error | string,
  status = 500,
  details?: string
): Response {
  // Dynamic require is necessary to avoid importing Next.js server components in test environments
  // where Request/Response globals are not available
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NextResponse } = require('next/server');

  const errorObj = typeof error === 'string' ? new Error(error) : error;
  const friendlyError = getUserFriendlyError(errorObj);

  if (status >= 500) {
    // This helper has no idea which route called it; the stack frames in the
    // report are what identify the failing handler.
    reportServerError(errorObj, { source: 'route', route: '/api' });
  }

  return NextResponse.json(
    {
      error: friendlyError.message,
      title: friendlyError.title,
      type: friendlyError.type,
      severity: friendlyError.severity,
      retryable: friendlyError.retryable,
      ...(friendlyError.suggestion && { suggestion: friendlyError.suggestion }),
      ...(friendlyError.actionLabel && { actionLabel: friendlyError.actionLabel }),
      ...(details && { details })
    },
    { status }
  );
}
