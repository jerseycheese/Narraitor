
describe('featureFlags', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const load = (env: Record<string, string | undefined>) => {
    process.env = { ...process.env, ...env };
    return require('@/lib/featureFlags') as typeof import('@/lib/featureFlags');
  };

  it('defaults BUFFERED_STREAMING and PROGRESSIVE_DISCLOSURE to true when env vars are missing', () => {
    const { isFeatureEnabled } = load({
      NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING: undefined,
      NEXT_PUBLIC_FEATURE_PROGRESSIVE_DISCLOSURE: undefined,
    });

    expect(isFeatureEnabled('BUFFERED_STREAMING')).toBe(true);
    expect(isFeatureEnabled('PROGRESSIVE_DISCLOSURE')).toBe(true);
  });

  it('disables BUFFERED_STREAMING only when env var is exactly "false"', () => {
    const { isFeatureEnabled } = load({
      NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING: 'false',
    });

    expect(isFeatureEnabled('BUFFERED_STREAMING')).toBe(false);
  });

  it('treats non-false values as enabled for default-on flags', () => {
    const { isFeatureEnabled } = load({
      NEXT_PUBLIC_FEATURE_PROGRESSIVE_DISCLOSURE: 'TRUE',
      NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING: '1',
    });

    expect(isFeatureEnabled('PROGRESSIVE_DISCLOSURE')).toBe(true);
    expect(isFeatureEnabled('BUFFERED_STREAMING')).toBe(true);
  });

  it('supports downstream gating decisions for BUFFERED_STREAMING', () => {
    const { isFeatureEnabled } = load({
      NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING: 'false',
    });

    const mode = isFeatureEnabled('BUFFERED_STREAMING') ? 'buffered' : 'legacy';
    expect(mode).toBe('legacy');
  });
});
