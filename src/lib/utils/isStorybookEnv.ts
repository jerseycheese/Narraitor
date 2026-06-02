/**
 * Detects whether the app is running inside Storybook (port 6006 or a host
 * containing "storybook"). Image generators use this to serve mock SVGs instead
 * of hitting the real API.
 *
 * Centralized so every call site agrees on the check — it was previously a bare
 * `window.location.port === '6006'` copy-pasted across three files, which broke
 * silently if Storybook ran on any other port or host.
 */
export const isStorybookEnv = (): boolean =>
  typeof window !== 'undefined' &&
  (window.location.port === '6006' ||
    window.location.hostname.includes('storybook'));
