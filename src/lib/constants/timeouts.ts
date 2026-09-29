import { SINGLE_ATTEMPT_TEXT_TIMEOUT_MS } from './aiTimeouts';

/**
 * Centralized AI-generation and loading-safety timeouts (milliseconds).
 */

/**
 * Browser ceiling on a single AI narrative or choice generation call. Derived
 * from the server route budget in aiTimeouts.ts so the client never gives up
 * on a request the server is still allowed to finish.
 */
export const AI_GENERATION_TIMEOUT_MS = SINGLE_ATTEMPT_TEXT_TIMEOUT_MS;

/** Safety timeout to auto-clear a stuck navigation loading state. */
export const NAV_SAFETY_TIMEOUT_MS = 30000;
