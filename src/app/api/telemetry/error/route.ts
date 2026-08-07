import { NextRequest } from 'next/server';
import {
  sanitizeDigest,
  sanitizeErrorName,
  sanitizeRoute,
  sanitizeSource,
  sanitizeStack,
  sanitizeType,
  type ErrorReport,
} from '@/lib/telemetry/errorReport';
import { logErrorReport } from '@/lib/telemetry/reportServerError';

/** Roughly 4KB. A legitimate report is a few hundred bytes. */
const MAX_BODY_CHARS = 4096;

/**
 * Sink for client-side error reports (#1641).
 *
 * The posted body is treated as hostile: every field is re-run through the
 * same sanitizers the client used and anything outside the schema is dropped,
 * so a crafted POST can't inject content into the runtime log.
 *
 * Always answers 204, including on failure — a rejected or differentiated
 * response would make this endpoint a probe target.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const raw = await request.text();
    if (raw.length <= MAX_BODY_CHARS) {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        logErrorReport(rebuildReport(parsed as Record<string, unknown>));
      }
    }
  } catch {
    // Malformed body, oversized payload, unreadable stream: all silent.
  }

  return new Response(null, { status: 204 });
}

function rebuildReport(input: Record<string, unknown>): ErrorReport {
  const frames = Array.isArray(input.frames)
    ? input.frames.filter((frame): frame is string => typeof frame === 'string')
    : [];

  const report: ErrorReport = {
    source: sanitizeSource(input.source),
    name: sanitizeErrorName(input.name),
    type: sanitizeType(input.type),
    route: sanitizeRoute(input.route),
    // Re-running the frame filter over the posted lines drops anything that
    // isn't frame-shaped, which is what keeps free text out of the log.
    frames: sanitizeStack(frames.join('\n')),
  };

  const digest = sanitizeDigest(input.digest);
  return digest ? { ...report, digest } : report;
}
