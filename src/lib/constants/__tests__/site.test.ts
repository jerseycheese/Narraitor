/**
 * Site origin resolution (#1636).
 *
 * The fallback order matters: robots.ts, sitemap.ts, and opengraph-image are
 * statically generated, so whatever this returns at build time is baked into
 * every canonical URL.
 */
import { getSiteUrl } from '../site';

// NODE_ENV is typed read-only, so it can only be swapped via defineProperty.
const setNodeEnv = (value: string) =>
  Object.defineProperty(process.env, 'NODE_ENV', { value, configurable: true });

describe('getSiteUrl', () => {
  const originalEnv = process.env;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;
    delete process.env.PORT;
  });

  afterEach(() => {
    process.env = originalEnv;
    setNodeEnv(originalNodeEnv ?? 'test');
  });

  it('prefers NEXT_PUBLIC_SITE_URL over the Vercel hosts', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://narraitor.example';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'project.vercel.app';

    expect(getSiteUrl()).toBe('https://narraitor.example');
  });

  it('strips a trailing slash', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://narraitor.example/';

    expect(getSiteUrl()).toBe('https://narraitor.example');
  });

  it('prefers the stable project host over the per-deployment host', () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'project.vercel.app';
    process.env.VERCEL_URL = 'project-a1b2c3.vercel.app';

    expect(getSiteUrl()).toBe('https://project.vercel.app');
  });

  it('falls back to the deployment host as https', () => {
    process.env.VERCEL_URL = 'project-a1b2c3.vercel.app';

    expect(getSiteUrl()).toBe('https://project-a1b2c3.vercel.app');
  });

  it('falls back to localhost when nothing is set', () => {
    expect(getSiteUrl()).toBe('http://localhost:3000');
  });

  it('honours the local PORT so worktree dev servers report their own origin', () => {
    process.env.PORT = '3684';

    expect(getSiteUrl()).toBe('http://localhost:3684');
  });

  it('refuses to publish a localhost origin from a production build', () => {
    setNodeEnv('production');

    expect(() => getSiteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL must be set/);
  });

  it('still resolves in production once an origin is configured', () => {
    setNodeEnv('production');
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'project.vercel.app';

    expect(getSiteUrl()).toBe('https://project.vercel.app');
  });
});
