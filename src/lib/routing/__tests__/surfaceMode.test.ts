import { getSurfaceMode } from '@/lib/routing/surfaceMode';

describe('getSurfaceMode', () => {
  describe('manuscript routes', () => {
    test.each([
      '/play',
      '/play/journal',
      '/worlds/world-123/play',
      '/worlds/world-123/play/journal',
    ])('returns manuscript for %s', (path) => {
      expect(getSurfaceMode(path)).toBe('manuscript');
    });
  });

  describe('app routes', () => {
    test.each([
      '/',
      '/about',
      '/dashboard',
      '/dev',
      '/dev/game-session',
      '/worlds',
      '/worlds/create',
      '/worlds/world-123',
      '/worlds/world-123/edit',
      '/characters',
      '/characters/create',
      '/characters/char-123',
      '/characters/char-123/edit',
      '/settings',
    ])('returns app for %s', (path) => {
      expect(getSurfaceMode(path)).toBe('app');
    });
  });

  test('normalizes missing leading slash and trailing slash', () => {
    expect(getSurfaceMode('worlds')).toBe('app');
    expect(getSurfaceMode('/worlds/')).toBe('app');
  });

  test.each([
    ['/worlds?view=grid', 'app'],
    ['/settings#theme', 'app'],
    ['/characters/create?from=home#step-2', 'app'],
    ['/play?resume=true', 'manuscript'],
  ])('ignores query params and hash fragments for %s', (path, expected) => {
    expect(getSurfaceMode(path)).toBe(expected);
  });

  test.each(['', '?view=grid', '#theme'])(
    'treats empty or fragment-only input as an app route for %s',
    (path) => {
      expect(getSurfaceMode(path)).toBe('app');
    }
  );
});
