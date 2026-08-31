/**
 * Narrative-styled error copy for the game-session play loop (Issue #201).
 *
 * Errors that surface while a story is being generated should read as part of
 * the story, not as technical faults. This maps an error to genre-neutral,
 * jargon-free copy and frames the recovery action as a narrative choice.
 *
 * Scoped to the play surfaces on purpose — the global getUserFriendlyError copy
 * stays generic because it is also used in non-narrative contexts (forms, etc.).
 */

import {
  getUserFriendlyError,
  ErrorType,
  type ErrorSeverity,
} from '@/lib/utils/errorUtils';

export interface NarrativeError {
  title: string;
  message: string;
  /** Narrative-appropriate next step the player can take. */
  suggestion?: string;
  retryable: boolean;
  /** Recovery action framed as a narrative choice. */
  retryLabel: string;
  severity: ErrorSeverity;
}

export const PARTIAL_RECONCILIATION_ERROR: NarrativeError = {
  title: 'The story paused',
  message: 'The story advanced, but some session changes did not finish.',
  suggestion: 'Stop here rather than making another choice.',
  retryable: false,
  retryLabel: 'Continue the story',
  severity: 'error',
};

const RETRY_LABEL = 'Continue the story';

const NARRATIVE_COPY: Record<
  ErrorType,
  { title: string; message: string; suggestion: string }
> = {
  [ErrorType.NETWORK]: {
    title: 'The story paused',
    message: 'We lost the connection needed to continue your story.',
    suggestion: 'Check that you\'re online, then pick up where you left off.',
  },
  [ErrorType.SERVICE]: {
    title: 'The story needs a moment',
    message: 'The story is moving faster than it can keep up.',
    suggestion: 'Wait a few moments, then continue.',
  },
  [ErrorType.AUTH]: {
    title: 'The story can\'t continue',
    message: 'Your story can\'t continue until your account settings are sorted out.',
    suggestion: 'Open Settings to check your access, then return to your story.',
  },
  [ErrorType.VALIDATION]: {
    title: 'That didn\'t fit the story',
    message: 'Part of what happened didn\'t come together as expected.',
    suggestion: 'Try a different choice to continue.',
  },
  [ErrorType.UNKNOWN]: {
    title: 'The story stumbled',
    message: 'Something interrupted your story unexpectedly.',
    suggestion: 'Try to continue — if it keeps happening, refresh and resume.',
  },
};

/**
 * Maps an error (or raw error string) to narrative-styled copy. Reuses the
 * shared categorization in errorUtils so retryability and severity stay
 * consistent with the rest of the app.
 */
export function getNarrativeError(error: Error | string): NarrativeError {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  const { type, retryable, severity } = getUserFriendlyError(errorObj);
  const copy = NARRATIVE_COPY[type];

  return {
    title: copy.title,
    message: copy.message,
    suggestion: copy.suggestion,
    retryable,
    retryLabel: RETRY_LABEL,
    severity,
  };
}
