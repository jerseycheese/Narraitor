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

  describe('workshop routes', () => {
    test.each([
      '/worlds',
      '/worlds/create',
      '/worlds/world-123',
      '/worlds/world-123/edit',
      '/characters',
      '/characters/create',
      '/characters/char-123',
      '/characters/char-123/edit',
      '/settings',
    ])('returns workshop for %s', (path) => {
      expect(getSurfaceMode(path)).toBe('workshop');
    });
  });

  describe('default routes', () => {
    test.each(['/', '/about', '/dev', '/dev/design-system'])(
      'returns default for %s',
      (path) => {
        expect(getSurfaceMode(path)).toBe('default');
      }
    );
  });

  test('normalizes missing leading slash and trailing slash', () => {
    expect(getSurfaceMode('worlds')).toBe('workshop');
    expect(getSurfaceMode('/worlds/')).toBe('workshop');
  });

  test.each([
    ['/worlds?view=grid', 'workshop'],
    ['/settings#theme', 'workshop'],
    ['/characters/create?from=home#step-2', 'workshop'],
    ['/play?resume=true', 'manuscript'],
  ])('ignores query params and hash fragments for %s', (path, expected) => {
    expect(getSurfaceMode(path)).toBe(expected);
  });

  test.each(['', '?view=grid', '#theme'])(
    'treats empty or fragment-only input as default route for %s',
    (path) => {
      expect(getSurfaceMode(path)).toBe('default');
    }
  );
});
