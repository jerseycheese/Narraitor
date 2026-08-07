/**
 * Feature flags, read from NEXT_PUBLIC_* env vars.
 *
 * This file is the one place a flag's default lives. `.env.example` points
 * here rather than restating them, so the two can't drift apart.
 *
 * Env access stays literal on purpose: Next.js inlines `process.env.NEXT_PUBLIC_*`
 * at build time, so a dynamic lookup keyed off a variable would read undefined
 * in the browser.
 */
const FEATURE_FLAG_DEFAULTS = {
  BUFFERED_STREAMING: true,
  PROGRESSIVE_DISCLOSURE: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAG_DEFAULTS;

/**
 * A default-off flag turns on only for the exact string "true"; a default-on
 * flag turns off only for the exact string "false". Anything else (unset,
 * "TRUE", "1", junk) keeps the default.
 */
const resolve = (value: string | undefined, defaultValue: boolean): boolean =>
  defaultValue ? value !== 'false' : value === 'true';

const getFeatureFlags = (): Record<FeatureFlag, boolean> => ({
  BUFFERED_STREAMING: resolve(
    process.env.NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING,
    FEATURE_FLAG_DEFAULTS.BUFFERED_STREAMING
  ),
  PROGRESSIVE_DISCLOSURE: resolve(
    process.env.NEXT_PUBLIC_FEATURE_PROGRESSIVE_DISCLOSURE,
    FEATURE_FLAG_DEFAULTS.PROGRESSIVE_DISCLOSURE
  ),
});

export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  return getFeatureFlags()[flag];
};
