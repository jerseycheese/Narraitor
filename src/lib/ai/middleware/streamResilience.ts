/**
 * Stream resilience middleware
 *
 * Wraps a streaming generation function so that transient interruptions
 * (dropped connections, timeouts, unexpected stream closes) auto-resume
 * instead of failing the whole generation. See issue #903.
 *
 * The wrapper is deliberately decoupled from any store or AI client: it takes
 * a `generateFn` that produces an async stream of text chunks and resumes by
 * re-running it. Callers wire in their own context update + UI feedback through
 * the `onResume` seam, which keeps this primitive trivially testable and reusable
 * across narrative, choice, and ending generators.
 */

import { isRetryableError } from '@/lib/utils/errorUtils';
import Logger from '@/lib/utils/logger';

const logger = new Logger('StreamResilience');

/** Default number of resume attempts per generation (per issue #903 AC). */
export const DEFAULT_MAX_RESUMES = 2;

/** Default pause before a resume attempt, giving a flaky connection a moment to settle. */
export const DEFAULT_RESUME_DELAY_MS = 1000;

/** Details handed to `onResume` when a transient failure triggers a resume. */
export interface ResumeInfo {
  /** 1-based resume attempt (1 = first resume after the initial try). */
  attempt: number;
  /** Everything captured across all attempts so far. */
  partialOutput: string;
  /** The transient error that triggered this resume. */
  error: unknown;
}

export interface ResilientStreamOptions {
  /** Max resume attempts before giving up and rethrowing. Default {@link DEFAULT_MAX_RESUMES}. */
  maxResumes?: number;
  /** Pause before each resume attempt, in ms. Default {@link DEFAULT_RESUME_DELAY_MS}. */
  resumeDelayMs?: number;
  /**
   * Decides whether a thrown error is transient (resumable). Defaults to
   * {@link isRetryableError} for `Error` instances; anything else is treated
   * as non-transient and rethrown immediately.
   */
  isTransient?: (error: unknown) => boolean;
  /**
   * Called once per resume, before the delay. This is where a caller appends
   * the partial output to message history and flips a "Reconnecting…" indicator.
   */
  onResume?: (info: ResumeInfo) => void;
  /** Injectable delay so tests can run without real timers. Defaults to setTimeout. */
  delay?: (ms: number) => Promise<void>;
}

const defaultDelay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const defaultIsTransient = (error: unknown): boolean =>
  error instanceof Error && isRetryableError(error);

/**
 * Wraps a streaming generation function with auto-resume on transient failures.
 *
 * On a transient error it captures the partial output, notifies via `onResume`,
 * waits, then re-runs `generateFn` and keeps yielding. Non-transient errors and
 * exhausted resume budgets rethrow so the caller can fall back to manual retry.
 *
 * @param generateFn Produces the stream of text chunks. Re-invoked on each resume.
 * @param options    Resume budget, timing, transient-detection, and the resume hook.
 */
export async function* resilientStream(
  generateFn: () => AsyncGenerator<string>,
  options: ResilientStreamOptions = {}
): AsyncGenerator<string> {
  const {
    maxResumes = DEFAULT_MAX_RESUMES,
    resumeDelayMs = DEFAULT_RESUME_DELAY_MS,
    isTransient = defaultIsTransient,
    onResume,
    delay = defaultDelay,
  } = options;

  let partialOutput = '';
  let resumeAttempts = 0;

  while (resumeAttempts <= maxResumes) {
    try {
      const stream = generateFn();
      for await (const chunk of stream) {
        partialOutput += chunk;
        yield chunk;
      }
      // Stream completed cleanly.
      return;
    } catch (error) {
      if (!isTransient(error) || resumeAttempts >= maxResumes) {
        logger.error(
          'resilientStream',
          `Giving up after ${resumeAttempts} resume(s):`,
          error
        );
        throw error;
      }

      resumeAttempts += 1;
      logger.warn(
        'resilientStream',
        `Transient stream failure, resuming (attempt ${resumeAttempts}/${maxResumes})`,
        error
      );
      onResume?.({ attempt: resumeAttempts, partialOutput, error });
      await delay(resumeDelayMs);
      // Loop re-runs generateFn from the top to continue generation.
    }
  }
}
