
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

  it('defaults PROGRESSIVE_DISCLOSURE to true and BUFFERED_STREAMING to false when env vars are missing', () => {
    const { isFeatureEnabled } = load({
      NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING: undefined,
      NEXT_PUBLIC_FEATURE_PROGRESSIVE_DISCLOSURE: undefined,
    });

    // BUFFERED_STREAMING defaults off: real API streaming (issue #1476)
    // covers the live play surface's progressive-reveal now, and this
    // fake-typewriter pass is only an opt-in fallback for when it can't.
    expect(isFeatureEnabled('BUFFERED_STREAMING')).toBe(false);
    expect(isFeatureEnabled('PROGRESSIVE_DISCLOSURE')).toBe(true);
  });

  it('enables BUFFERED_STREAMING only when env var is exactly "true"', () => {
    const { isFeatureEnabled } = load({
      NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING: 'true',
    });

    expect(isFeatureEnabled('BUFFERED_STREAMING')).toBe(true);
  });

  it('treats non-true values as disabled for a default-off flag', () => {
    const { isFeatureEnabled } = load({
      NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING: 'TRUE',
    });

    expect(isFeatureEnabled('BUFFERED_STREAMING')).toBe(false);
  });

  it('treats non-false values as enabled for a default-on flag', () => {
    const { isFeatureEnabled } = load({
      NEXT_PUBLIC_FEATURE_PROGRESSIVE_DISCLOSURE: 'TRUE',
    });

    expect(isFeatureEnabled('PROGRESSIVE_DISCLOSURE')).toBe(true);
  });

  it('defaults WORLD_CLOCK on and turns it off only for the exact string "false"', () => {
    expect(load({ NEXT_PUBLIC_FEATURE_WORLD_CLOCK: undefined }).isFeatureEnabled('WORLD_CLOCK')).toBe(true);
    jest.resetModules();
    expect(load({ NEXT_PUBLIC_FEATURE_WORLD_CLOCK: 'false' }).isFeatureEnabled('WORLD_CLOCK')).toBe(false);
    jest.resetModules();
    expect(load({ NEXT_PUBLIC_FEATURE_WORLD_CLOCK: 'FALSE' }).isFeatureEnabled('WORLD_CLOCK')).toBe(true);
  });

  it('defaults WORLD_DESCRIPTION_IN_SCENE to false and enables it only for the exact string "true"', () => {
    expect(
      load({ NEXT_PUBLIC_FEATURE_WORLD_DESCRIPTION_IN_SCENE: undefined }).isFeatureEnabled(
        'WORLD_DESCRIPTION_IN_SCENE'
      )
    ).toBe(false);
    jest.resetModules();
    expect(
      load({ NEXT_PUBLIC_FEATURE_WORLD_DESCRIPTION_IN_SCENE: 'true' }).isFeatureEnabled(
        'WORLD_DESCRIPTION_IN_SCENE'
      )
    ).toBe(true);
    jest.resetModules();
    expect(
      load({ NEXT_PUBLIC_FEATURE_WORLD_DESCRIPTION_IN_SCENE: 'TRUE' }).isFeatureEnabled(
        'WORLD_DESCRIPTION_IN_SCENE'
      )
    ).toBe(false);
  });

  it('supports downstream gating decisions for BUFFERED_STREAMING', () => {
    const { isFeatureEnabled } = load({
      NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING: 'false',
    });

    const mode = isFeatureEnabled('BUFFERED_STREAMING') ? 'buffered' : 'legacy';
    expect(mode).toBe('legacy');
  });
});
