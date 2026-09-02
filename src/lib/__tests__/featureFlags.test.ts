import { readFileSync } from 'fs';
import path from 'path';

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

  it('defaults WORLD_DESCRIPTION_IN_SCENE to true and turns it off only for the exact string "false"', () => {
    expect(
      load({ NEXT_PUBLIC_FEATURE_WORLD_DESCRIPTION_IN_SCENE: undefined }).isFeatureEnabled(
        'WORLD_DESCRIPTION_IN_SCENE'
      )
    ).toBe(true);
    jest.resetModules();
    expect(
      load({ NEXT_PUBLIC_FEATURE_WORLD_DESCRIPTION_IN_SCENE: 'false' }).isFeatureEnabled(
        'WORLD_DESCRIPTION_IN_SCENE'
      )
    ).toBe(false);
    jest.resetModules();
    expect(
      load({ NEXT_PUBLIC_FEATURE_WORLD_DESCRIPTION_IN_SCENE: 'FALSE' }).isFeatureEnabled(
        'WORLD_DESCRIPTION_IN_SCENE'
      )
    ).toBe(true);
  });

  it('defaults SETTLED_COMMITMENT_CHOICES to false and enables it only for the exact string "true"', () => {
    expect(
      load({ NEXT_PUBLIC_FEATURE_SETTLED_COMMITMENT_CHOICES: undefined }).isFeatureEnabled(
        'SETTLED_COMMITMENT_CHOICES'
      )
    ).toBe(false);
    jest.resetModules();
    expect(
      load({ NEXT_PUBLIC_FEATURE_SETTLED_COMMITMENT_CHOICES: 'true' }).isFeatureEnabled(
        'SETTLED_COMMITMENT_CHOICES'
      )
    ).toBe(true);
    jest.resetModules();
    expect(
      load({ NEXT_PUBLIC_FEATURE_SETTLED_COMMITMENT_CHOICES: 'TRUE' }).isFeatureEnabled(
        'SETTLED_COMMITMENT_CHOICES'
      )
    ).toBe(false);
  });

  // The kill switches are only reachable in an incident if .env.example names
  // them, so this asserts the two files agree rather than trusting a docblock.
  it('gives every flag a commented override line in .env.example', () => {
    const repoRoot = path.resolve(__dirname, '../../..');
    const source = readFileSync(path.join(repoRoot, 'src/lib/featureFlags.ts'), 'utf8');
    const example = readFileSync(path.join(repoRoot, '.env.example'), 'utf8');

    const envVars = [...new Set(source.match(/NEXT_PUBLIC_FEATURE_[A-Z_]+/g) ?? [])];
    expect(envVars.length).toBeGreaterThan(0);

    const undocumented = envVars.filter(
      (name) => !new RegExp(`^#\\s*${name}=`, 'm').test(example)
    );
    expect(undocumented).toEqual([]);
  });

  it('supports downstream gating decisions for BUFFERED_STREAMING', () => {
    const { isFeatureEnabled } = load({
      NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING: 'false',
    });

    const mode = isFeatureEnabled('BUFFERED_STREAMING') ? 'buffered' : 'legacy';
    expect(mode).toBe('legacy');
  });
});
