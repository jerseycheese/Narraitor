/**
 * Centralized AI-generation and loading-safety timeouts (milliseconds).
 *
 * These are grouped because they're interdependent: a fallback/safety timer must
 * outlast the generation it guards, or the fallback fires mid-generation. Keep this
 * ordering in mind when tuning:
 *   AI_GENERATION_TIMEOUT_MS <= CHOICE_FALLBACK_DELAY_MS <= INITIAL_GENERATION_MAX_WAIT_MS
 */

/** Hard ceiling on a single AI narrative/choice generation call before falling back. */
export const AI_GENERATION_TIMEOUT_MS = 15000;

/** Max time to wait for the initial scene to generate before giving up. */
export const INITIAL_GENERATION_MAX_WAIT_MS = 20000;

/** Fallback delay before surfacing default choices if generation stalls. */
export const CHOICE_FALLBACK_DELAY_MS = 15000;

/** Fallback delay during session bootstrap before proceeding without AI. */
export const BOOTSTRAP_FALLBACK_DELAY_MS = 4000;

/** Server-side timeout for world-template generation. */
export const TEMPLATE_GENERATION_TIMEOUT_MS = 45_000;

/** Safety timeout to auto-clear a stuck navigation loading state. */
export const NAV_SAFETY_TIMEOUT_MS = 30000;
