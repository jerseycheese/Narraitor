const FEATURE_FLAGS = {
  BUFFERED_STREAMING: 'NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING',
  PROGRESSIVE_DISCLOSURE: 'NEXT_PUBLIC_FEATURE_PROGRESSIVE_DISCLOSURE',
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

const isEnabled = (value: string | undefined): boolean => value === 'true';

const getFeatureFlags = (): Record<FeatureFlag, boolean> => ({
  BUFFERED_STREAMING: isEnabled(process.env.NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING),
  PROGRESSIVE_DISCLOSURE: process.env.NEXT_PUBLIC_FEATURE_PROGRESSIVE_DISCLOSURE !== 'false',
});

export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  return getFeatureFlags()[flag];
};
