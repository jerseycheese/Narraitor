import { getSurfaceMode, getSurfaceRegister } from '@/lib/routing/surfaceMode';

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

describe('getSurfaceRegister', () => {
  describe('brand routes', () => {
    test.each(['/', '/about', '/privacy', '/terms', '/welcome'])(
      'returns brand for %s',
      (path) => {
        expect(getSurfaceRegister(path)).toBe('brand');
      }
    );
  });

  describe('brand sub-routes', () => {
    test.each(['/about/team', '/privacy/cookies', '/terms/changes'])(
      'returns brand for %s',
      (path) => {
        expect(getSurfaceRegister(path)).toBe('brand');
      }
    );
  });

  describe('product routes', () => {
    test.each([
      '/dashboard',
      '/dev',
      '/dev/game-session',
      '/worlds',
      '/worlds/create',
      '/worlds/world-123',
      '/worlds/world-123/edit',
      '/characters',
      '/characters/char-123',
      '/settings',
      '/settings/providers',
    ])('returns product for %s', (path) => {
      expect(getSurfaceRegister(path)).toBe('product');
    });
  });

  test.each(['/aboutus', '/termsofart', '/privacypolicy'])(
    'does not treat a brand root as a bare prefix for %s',
    (path) => {
      expect(getSurfaceRegister(path)).toBe('product');
    }
  );

  test('normalizes missing leading slash and trailing slash', () => {
    expect(getSurfaceRegister('about')).toBe('brand');
    expect(getSurfaceRegister('/about/')).toBe('brand');
    expect(getSurfaceRegister('/dashboard/')).toBe('product');
  });

  test.each([
    ['/about?ref=twitter', 'brand'],
    ['/privacy#cookies', 'brand'],
    ['/terms/?utm=x#top', 'brand'],
    ['/worlds?view=grid', 'product'],
  ])('ignores query params and hash fragments for %s', (path, expected) => {
    expect(getSurfaceRegister(path)).toBe(expected);
  });

  // Deliberate divergence from getSurfaceMode, where '' falls through to 'app':
  // normalizePath('') is '/', and '/' is the brand front door.
  test.each(['', '?ref=x', '#top'])(
    'treats empty or fragment-only input as the brand root for %s',
    (path) => {
      expect(getSurfaceRegister(path)).toBe('brand');
    }
  );

  describe('the two axes stay independent', () => {
    test.each(['/play', '/play/journal', '/worlds/world-123/play'])(
      'the manuscript surface is never the brand register (%s)',
      (path) => {
        expect(getSurfaceMode(path)).toBe('manuscript');
        expect(getSurfaceRegister(path)).toBe('product');
      }
    );
  });
});
