/**
 * Detects whether the app is running under a Playwright E2E/visual test.
 * Playwright sets `window.__PLAYWRIGHT__` before the app loads (see
 * tests/visual/global.setup.ts); the user-agent check is a fallback.
 *
 * Centralized so every call site agrees on the flag name and shape — a prior
 * copy-paste used the wrong casing (`__playwright`) and silently never matched.
 */
export const isPlaywrightEnv = (): boolean =>
  typeof window !== 'undefined' &&
  (window.navigator.userAgent.includes('Playwright') || !!window.__PLAYWRIGHT__);
