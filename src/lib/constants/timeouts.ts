import { SINGLE_ATTEMPT_TEXT_TIMEOUT_MS } from './aiTimeouts';

/**
 * Centralized AI-generation and loading-safety timeouts (milliseconds).
 *
 * Derived from the server-side route budget in aiTimeouts.ts (30s attempt + 15s headroom).
 */

/** Hard ceiling on a single AI narrative/choice generation call before falling back. */
export const AI_GENERATION_TIMEOUT_MS = SINGLE_ATTEMPT_TEXT_TIMEOUT_MS;

/** Safety timeout to auto-clear a stuck navigation loading state. */
export const NAV_SAFETY_TIMEOUT_MS = 30000;
