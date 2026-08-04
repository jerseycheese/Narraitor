import { getUserFriendlyError, ErrorType } from '@/lib/utils/errorUtils';

/**
 * The shape of an error report and the sanitizers that build it — the whole
 * privacy contract lives in this file.
 *
 * Hard privacy constraint (#1641), the same allowlist-by-construction posture
 * as trackFunnelStep (#1367): the ONLY thing that travels is a closed
 * vocabulary — a source from a fixed union, a sanitized error class name, a
 * category enum, a masked route, an optional hex digest, and stack frames with
 * the message header stripped.
 *
 * Never transported, in any form: the free-form `error.message`, request
 * bodies or headers, world/character/narrative content, and the player's
 * provider key. The message IS read locally to classify the error — only the
 * resulting ErrorType enum leaves.
 */

/**
 * Where the failure happened. Closed union — no free-form values.
 *
 * `error-boundary` and `global-error` are kept apart because they mean
 * different things when triaging: a segment render crash still has the app
 * shell around it, a root-layout crash doesn't.
 */
export type ErrorSource = 'client' | 'route' | 'error-boundary' | 'global-error';

export const ERROR_SOURCES: readonly ErrorSource[] = [
  'client',
  'route',
  'error-boundary',
  'global-error',
];

export interface ErrorReport {
  /** Where it happened. Closed union — no free-form values. */
  source: ErrorSource;
  /** Error class name, sanitized. */
  name: string;
  /** Category from getUserFriendlyError — the classification seam. */
  type: ErrorType;
  /** Sanitized pathname. */
  route: string;
  /** Next.js error digest, hex only, when present. */
  digest?: string;
  /** Stack frames with the message header stripped. */
  frames: string[];
}

const MAX_ROUTE_CHARS = 128;
const MAX_FRAMES = 10;
const MAX_FRAME_CHARS = 200;

/** Identifier shape: a class name is a compile-time constant, never user data. */
const SAFE_ERROR_NAME = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;

const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Narraitor entity ids look like `world-1753812345678-a1b2`; mask that shape too.
 * The digit lookahead is load-bearing: without it a long kebab-case route
 * segment gets masked as well, and `/api/narrative/validate-event-significance`
 * reports as `/api/narrative/:id`.
 */
const OPAQUE_ID_SEGMENT = /^(?=[\w-]*\d)[A-Za-z0-9_-]{16,}$/;

/** V8 and Firefox both prefix a frame with `at `; the message header never does. */
const FRAME_LINE = /^\s*at\s+\S/;

const HEX_DIGEST = /^[0-9a-f]{1,64}$/i;

/**
 * A thrown non-Error can carry anything on `.name` — a whole sentence, a
 * template string, story text — so accept only identifier-shaped names and
 * collapse everything else to a constant.
 */
export function sanitizeErrorName(name: unknown): string {
  return typeof name === 'string' && SAFE_ERROR_NAME.test(name) ? name : 'Error';
}

/**
 * Mask a pathname down to a route shape.
 *
 * The query string and hash are dropped whole rather than filtered — they
 * routinely carry ids, search terms, and pasted content, and there is no
 * allowlist of safe params worth maintaining.
 */
export function sanitizeRoute(pathname: unknown): string {
  if (typeof pathname !== 'string' || pathname.trim() === '') return '/unknown';

  const path = pathname.split('?')[0].split('#')[0];
  const masked = path
    .split('/')
    .map((segment) =>
      UUID_SEGMENT.test(segment) || OPAQUE_ID_SEGMENT.test(segment) ? ':id' : segment
    )
    .join('/');

  const rooted = masked.startsWith('/') ? masked : `/${masked}`;
  return rooted.slice(0, MAX_ROUTE_CHARS) || '/unknown';
}

/**
 * Turn a raw stack into transportable frames.
 *
 * The sharp edge: `error.stack` STARTS WITH the message — `"Error: <message>\n
 * at ..."` — so shipping the stack verbatim ships the message. Everything
 * before the first frame line is discarded, and only frame-shaped lines
 * survive, which also drops any multi-line message body.
 *
 * Query strings inside a frame go too (a bundler URL can carry a `?query`
 * naming a module or, in dev, an inlined payload). That costs the trailing
 * line:column on webpack-internal frames — worth it to keep the rule simple.
 */
export function sanitizeStack(stack: unknown): string[] {
  if (typeof stack !== 'string') return [];

  return stack
    .split('\n')
    .filter((line) => FRAME_LINE.test(line))
    .slice(0, MAX_FRAMES)
    .map((line) =>
      line
        .trim()
        .replace(/data:[^\s)]*/gi, 'data:')
        .replace(/\?[^\s)]*/g, '')
        .slice(0, MAX_FRAME_CHARS)
    );
}

/** Next.js digests are hex hashes; anything else is not a digest we produced. */
export function sanitizeDigest(digest: unknown): string | undefined {
  return typeof digest === 'string' && HEX_DIGEST.test(digest) ? digest : undefined;
}

export function sanitizeSource(source: unknown): ErrorSource {
  return ERROR_SOURCES.includes(source as ErrorSource) ? (source as ErrorSource) : 'client';
}

export function sanitizeType(type: unknown): ErrorType {
  return Object.values(ErrorType).includes(type as ErrorType)
    ? (type as ErrorType)
    : ErrorType.UNKNOWN;
}

/**
 * Pick the argument worth reporting out of a logger call's varargs.
 *
 * Nearly every logger.error site reads `logger.error('Failed to X:', err)`, so
 * the first argument is a label and the failure is the second. Reporting args[0]
 * blind would ship client reports with no stack frames and an UNKNOWN type —
 * technically a transport, practically useless.
 */
export function selectReportableError(args: unknown[]): unknown {
  return args.find((arg) => arg instanceof Error) ?? args[0];
}

/**
 * Build the report. Every field passes through a sanitizer — there is no path
 * from caller-supplied text to a transported field.
 */
export function buildErrorReport(
  error: unknown,
  context: { source: ErrorSource; route: string; digest?: string }
): ErrorReport {
  const thrown = (typeof error === 'object' && error !== null ? error : {}) as {
    name?: unknown;
    stack?: unknown;
    message?: unknown;
  };

  const message =
    typeof thrown.message === 'string'
      ? thrown.message
      : typeof error === 'string'
        ? error
        : '';

  const report: ErrorReport = {
    source: sanitizeSource(context.source),
    name: sanitizeErrorName(thrown.name),
    // getUserFriendlyError reads the message to classify it. That read is
    // local; only the enum it returns ever leaves.
    type: getUserFriendlyError(error instanceof Error ? error : new Error(message)).type,
    route: sanitizeRoute(context.route),
    frames: sanitizeStack(thrown.stack),
  };

  const digest = sanitizeDigest(context.digest);
  return digest ? { ...report, digest } : report;
}
