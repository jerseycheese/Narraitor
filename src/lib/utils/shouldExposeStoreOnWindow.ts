import { isPlaywrightEnv } from '@/lib/utils/isPlaywrightEnv';

/**
 * Whether a Zustand store should publish itself on `window` for seeding and
 * debugging.
 *
 * Every store used to gate this on `NODE_ENV !== 'production'` alone, which is
 * fine for a dev server but silently removes the seam from a `next build` —
 * and the visual suites now serve from `next start`, where the specs still have
 * to reach `window.useSessionStore` and friends to seed state.
 *
 * The Playwright escape hatch mirrors the tour hooks in TutorialProvider. It
 * keys off an explicit in-page flag rather than the environment, so a real
 * production visitor never trips it.
 */
export const shouldExposeStoreOnWindow = (): boolean =>
  process.env.NODE_ENV !== 'production' || isPlaywrightEnv();
