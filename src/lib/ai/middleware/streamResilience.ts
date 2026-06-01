/**
 * Stream resilience middleware
 *
 * Wraps a streaming generation function so that transient interruptions
 * (dropped connections, timeouts, unexpected stream closes) auto-resume
 * instead of failing the whole generation. See issue #903.
 *
 * The wrapper is deliberately decoupled from any store or AI client. On each
 * (re)attempt it calls `generateFn` with a {@link ResumeContext} carrying the
 * output captured so far, so a continuation-aware caller can send a new request
 * that picks up where the interrupted one stopped — the wrapper relays whatever
 * that stream yields. `onResume` is a separate, purely informational hook for UI
 * feedback ("Reconnecting…"); it is NOT a persistence seam (see its docs below).
 */

import { isRetryableError } from '@/lib/utils/errorUtils';
import Logger from '@/lib/utils/logger';

const logger = new Logger('StreamResilience');

/** Default number of resume attempts per generation (per issue #903 AC). */
export const DEFAULT_MAX_RESUMES = 2;

/** Default pause before a resume attempt, giving a flaky connection a moment to settle. */
const DEFAULT_RESUME_DELAY_MS = 1000;

/**
 * Raised when a stream ends without throwing but {@link ResilientStreamOptions.isComplete}
 * reports the output is unfinished — i.e. an unexpected EOF surfaced as a clean
 * iterator close rather than a rejected read. Treated as transient.
 */
export class StreamInterruptedError extends Error {
  constructor(message = 'Stream closed before completion') {
    super(message);
    this.name = 'StreamInterruptedError';
  }
}

/** Context passed to `generateFn` on each (re)attempt so it can continue generation. */
export interface ResumeContext {
  /** Resume attempt this stream serves; 0 is the initial attempt. */
  attempt: number;
  /**
   * Output already emitted to the consumer across prior attempts. On a resume a
   * continuation-aware caller should send this back to the provider as context
   * (e.g. append it to the message history) so the new stream continues rather
   * than regenerating from the start.
   */
  partialOutput: string;
}

/** Details handed to `onResume` when a resume is triggered. */
export interface ResumeInfo {
  /** 1-based resume attempt (1 = first resume after the initial try). */
  attempt: number;
  /** Cumulative output emitted to the consumer across all attempts so far. */
  partialOutput: string;
  /** Output emitted since the previous resume (the delta this attempt produced). */
  newOutput: string;
  /** The error (or {@link StreamInterruptedError}) that triggered this resume. */
  error: unknown;
}

export interface ResilientStreamOptions {
  /** Max resume attempts before giving up and rethrowing. Default {@link DEFAULT_MAX_RESUMES}. */
  maxResumes?: number;
  /** Pause before each resume attempt, in ms. Default 1000. */
  resumeDelayMs?: number;
  /**
   * Decides whether a thrown error is transient (resumable). Defaults to
   * {@link isRetryableError} for `Error` instances (and any
   * {@link StreamInterruptedError}); anything else is rethrown immediately.
   */
  isTransient?: (error: unknown) => boolean;
  /**
   * Optional completion validator, called when a stream ends WITHOUT throwing.
   * Return `false` to treat the close as a premature interruption and resume —
   * this covers providers/transports that signal an unexpected EOF as a normal
   * iterator close. When omitted, any clean stream end is treated as complete.
   */
  isComplete?: (fullOutput: string) => boolean;
  /**
   * Informational hook fired once per resume, before the delay — use it to flip
   * a "Reconnecting…" indicator. It is NOT a persistence seam: `partialOutput`
   * is cumulative, so appending it on every resume would duplicate earlier text.
   * Persist continuation context inside `generateFn` via {@link ResumeContext}
   * instead; use `newOutput` here only if you need the per-attempt delta.
   */
  onResume?: (info: ResumeInfo) => void;
  /** Injectable delay so tests can run without real timers. Defaults to setTimeout. */
  delay?: (ms: number) => Promise<void>;
}

const defaultDelay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const defaultIsTransient = (error: unknown): boolean =>
  error instanceof StreamInterruptedError ||
  (error instanceof Error && isRetryableError(error));

/**
 * Wraps a streaming generation function with auto-resume on transient failures.
 *
 * On each attempt it calls `generateFn` with the output captured so far and
 * relays its chunks. If the stream throws a transient error — or ends early per
 * `isComplete` — it notifies via `onResume`, waits, and re-attempts, up to
 * `maxResumes`. Non-transient errors and an exhausted budget rethrow so the
 * caller can fall back to manual retry.
 *
 * Continuation is the caller's responsibility: `generateFn` receives the
 * captured `partialOutput` and is expected to continue from it. A factory that
 * ignores it and regenerates from scratch will emit duplicated output.
 *
 * @param generateFn Produces the chunk stream for a given {@link ResumeContext}.
 * @param options    Resume budget, timing, transient/completion detection, hook.
 */
export async function* resilientStream(
  generateFn: (context: ResumeContext) => AsyncGenerator<string>,
  options: ResilientStreamOptions = {}
): AsyncGenerator<string> {
  const {
    maxResumes = DEFAULT_MAX_RESUMES,
    resumeDelayMs = DEFAULT_RESUME_DELAY_MS,
    isTransient = defaultIsTransient,
    isComplete,
    onResume,
    delay = defaultDelay,
  } = options;

  let partialOutput = '';
  let resumeAttempts = 0;

  while (resumeAttempts <= maxResumes) {
    const outputBeforeAttempt = partialOutput;
    let resumeError: unknown;

    try {
      const stream = generateFn({ attempt: resumeAttempts, partialOutput });
      for await (const chunk of stream) {
        partialOutput += chunk;
        yield chunk;
      }

      // Stream ended without throwing.
      if (!isComplete || isComplete(partialOutput)) {
        return; // Genuinely complete.
      }
      // Premature close: an unexpected EOF that didn't reject. Resume it.
      resumeError = new StreamInterruptedError();
    } catch (error) {
      if (!isTransient(error)) {
        logger.error('resilientStream', 'Non-transient stream failure:', error);
        throw error;
      }
      resumeError = error;
    }

    if (resumeAttempts >= maxResumes) {
      logger.error(
        'resilientStream',
        `Giving up after ${resumeAttempts} resume(s):`,
        resumeError
      );
      throw resumeError;
    }

    resumeAttempts += 1;
    logger.warn(
      'resilientStream',
      `Stream interrupted, resuming (attempt ${resumeAttempts}/${maxResumes})`,
      resumeError
    );
    onResume?.({
      attempt: resumeAttempts,
      partialOutput,
      newOutput: partialOutput.slice(outputBeforeAttempt.length),
      error: resumeError,
    });
    await delay(resumeDelayMs);
    // Loop re-attempts generateFn with the captured partialOutput as context.
  }
}
