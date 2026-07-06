
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

  it('defaults all flags to false when env vars are missing, except PROGRESSIVE_DISCLOSURE which defaults to true', () => {
    const { isFeatureEnabled } = load({
      NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING: undefined,
      NEXT_PUBLIC_FEATURE_PROGRESSIVE_DISCLOSURE: undefined,
    });

    expect(isFeatureEnabled('BUFFERED_STREAMING')).toBe(false);
    expect(isFeatureEnabled('PROGRESSIVE_DISCLOSURE')).toBe(true);
  });

  it('enables BUFFERED_STREAMING only when env var is true', () => {
    const { isFeatureEnabled } = load({
      NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING: 'true',
    });

    expect(isFeatureEnabled('BUFFERED_STREAMING')).toBe(true);
  });

  it('treats non-true values as disabled', () => {
    const { isFeatureEnabled } = load({
      NEXT_PUBLIC_FEATURE_PROGRESSIVE_DISCLOSURE: 'TRUE',
      NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING: '1',
    });

    expect(isFeatureEnabled('PROGRESSIVE_DISCLOSURE')).toBe(true);
    expect(isFeatureEnabled('BUFFERED_STREAMING')).toBe(false);
  });

  it('supports downstream gating decisions for BUFFERED_STREAMING', () => {
    const { isFeatureEnabled } = load({
      NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING: 'true',
    });

    const mode = isFeatureEnabled('BUFFERED_STREAMING') ? 'buffered' : 'legacy';
    expect(mode).toBe('buffered');
  });
});
