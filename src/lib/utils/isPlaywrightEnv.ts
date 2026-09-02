/**
 * Detects whether the app is running under a Playwright E2E/visual test.
 *
 * We key strictly off the explicit `window.__PLAYWRIGHT__` flag injected by our
 * test harness before scripts execute (see tests/visual/global.setup.ts).
 * We don't inspect the client user-agent string: user-agents are client-controlled,
 * so matching on substrings like 'Playwright' risks tripping test mode for real
 * production visitors (suppressing provider modals, AI narrative generation, and
 * telemetry).
 *
 * Centralized so call sites agree on the flag name and shape.
 */
export const isPlaywrightEnv = (): boolean =>
  typeof window !== 'undefined' && !!window.__PLAYWRIGHT__;

