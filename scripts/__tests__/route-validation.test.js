/**
 * @jest-environment node
 *
 * Unit tests for the pure route-validation logic (issue #420). Fixture-based and
 * deterministic -- no fs, no live codebase scan, so it stays green in CI.
 */

import {
  appFileToRoutePattern,
  extractReferences,
  normalizeReference,
  matchesRoute,
  matchesAnyRoute,
  toSegments,
  extractRedirectSources,
  redirectSourceToPattern,
  findBrokenReferences,
} from '../route-validation.js';

describe('appFileToRoutePattern', () => {
  it('maps the root page to /', () => {
    expect(appFileToRoutePattern('page.tsx')).toBe('/');
  });

  it('maps a nested page to its path', () => {
    expect(appFileToRoutePattern('worlds/create/page.tsx')).toBe('/worlds/create');
  });

  it('keeps dynamic segments', () => {
    expect(appFileToRoutePattern('worlds/[id]/edit/page.tsx')).toBe('/worlds/[id]/edit');
  });

  it('keeps an optional catch-all segment', () => {
    expect(appFileToRoutePattern('dev/design-system/[[...variant]]/page.tsx')).toBe(
      '/dev/design-system/[[...variant]]'
    );
  });

  it('drops route groups from the URL', () => {
    expect(appFileToRoutePattern('(marketing)/about/page.tsx')).toBe('/about');
  });

  it('returns null for non-page files', () => {
    expect(appFileToRoutePattern('worlds/[id]/layout.tsx')).toBeNull();
    expect(appFileToRoutePattern('api/debug/route.ts')).toBeNull();
  });
});

describe('extractReferences', () => {
  it('extracts a string-literal href', () => {
    const refs = extractReferences('<Link href="/worlds">Worlds</Link>', 'a.tsx');
    expect(refs).toHaveLength(1);
    expect(refs[0].raw).toBe('/worlds');
  });

  it('extracts a template-literal href with a hole', () => {
    const refs = extractReferences('<Link href={`/worlds/${world.id}`}>', 'a.tsx');
    expect(refs[0].raw).toBe('/worlds/${world.id}');
  });

  it('extracts router.push and router.replace', () => {
    const src = "router.push('/worlds/create');\nrouter.replace(`/characters/${id}`);";
    const refs = extractReferences(src, 'a.tsx');
    expect(refs.map((r) => r.raw)).toEqual(['/worlds/create', '/characters/${id}']);
  });

  it('extracts redirect() targets', () => {
    const refs = extractReferences("redirect('/login');", 'a.tsx');
    expect(refs[0].raw).toBe('/login');
  });

  it('reports a 1-based line number', () => {
    const src = 'const x = 1;\nconst y = 2;\nrouter.push("/play");';
    const refs = extractReferences(src, 'a.tsx');
    expect(refs[0].line).toBe(3);
  });

  it('does not match a bare variable href (no literal to capture)', () => {
    const refs = extractReferences('<Link href={item.href}>x</Link>', 'a.tsx');
    expect(refs).toHaveLength(0);
  });
});

describe('normalizeReference', () => {
  it('strips query strings', () => {
    expect(normalizeReference('/characters?worldId=1').segments).toEqual(['characters']);
  });

  it('strips hash fragments', () => {
    expect(normalizeReference('/worlds#top').segments).toEqual(['worlds']);
  });

  it('turns template holes into a :dynamic token', () => {
    expect(normalizeReference('/worlds/${id}/play').segments).toEqual([
      'worlds',
      ':dynamic',
      'play',
    ]);
  });

  it('skips external and protocol URLs', () => {
    expect(normalizeReference('https://example.com').skip).toBe(true);
    expect(normalizeReference('//cdn.example.com/x').skip).toBe(true);
  });

  it('skips mailto, relative paths, and pure hashes', () => {
    expect(normalizeReference('mailto:a@b.com').skip).toBe(true);
    expect(normalizeReference('worlds/create').skip).toBe(true);
    expect(normalizeReference('#section').skip).toBe(true);
  });
});

describe('matchesRoute', () => {
  const routes = {
    static: toSegments('/worlds/create'),
    dynamic: toSegments('/worlds/[id]/play'),
    catchAll: toSegments('/docs/[...slug]'),
    optionalCatchAll: toSegments('/dev/design-system/[[...variant]]'),
  };

  it('matches a static path exactly', () => {
    expect(matchesRoute(toSegments('/worlds/create'), routes.static)).toBe(true);
    expect(matchesRoute(toSegments('/worlds/edit'), routes.static)).toBe(false);
  });

  it('matches a dynamic segment against a concrete id', () => {
    expect(matchesRoute(toSegments('/worlds/abc-123/play'), routes.dynamic)).toBe(true);
  });

  it('matches a template hole against a dynamic segment', () => {
    expect(matchesRoute(['worlds', ':dynamic', 'play'], routes.dynamic)).toBe(true);
  });

  it('rejects an extra trailing segment on a static route', () => {
    expect(matchesRoute(toSegments('/worlds/create/extra'), routes.static)).toBe(false);
  });

  it('requires at least one segment for a required catch-all', () => {
    expect(matchesRoute(toSegments('/docs/a'), routes.catchAll)).toBe(true);
    expect(matchesRoute(toSegments('/docs/a/b/c'), routes.catchAll)).toBe(true);
    expect(matchesRoute(toSegments('/docs'), routes.catchAll)).toBe(false);
  });

  it('matches zero or more segments for an optional catch-all', () => {
    expect(matchesRoute(toSegments('/dev/design-system'), routes.optionalCatchAll)).toBe(true);
    expect(matchesRoute(toSegments('/dev/design-system/2'), routes.optionalCatchAll)).toBe(true);
    expect(matchesRoute(toSegments('/dev/design-system/a/b'), routes.optionalCatchAll)).toBe(true);
  });
});

describe('matchesAnyRoute', () => {
  it('returns true if any pattern matches', () => {
    const patterns = ['/worlds', '/worlds/[id]'];
    expect(matchesAnyRoute(toSegments('/worlds/x'), patterns)).toBe(true);
    expect(matchesAnyRoute(toSegments('/characters'), patterns)).toBe(false);
  });
});

describe('redirect handling', () => {
  const config = `
    async redirects() {
      return [
        { source: '/app/dev/:path*', destination: '/dev/:path*', permanent: true },
        { source: '/dev/design-system-2', destination: '/dev/design-system/2', permanent: false },
      ];
    }
  `;

  it('extracts redirect source strings', () => {
    expect(extractRedirectSources(config)).toEqual([
      '/app/dev/:path*',
      '/dev/design-system-2',
    ]);
  });

  it('converts :path* params to an optional catch-all pattern', () => {
    expect(redirectSourceToPattern('/app/dev/:path*')).toBe('/app/dev/[[...rest]]');
    expect(redirectSourceToPattern('/users/:id')).toBe('/users/[param]');
  });
});

describe('findBrokenReferences', () => {
  const routePatterns = ['/', '/worlds', '/worlds/[id]/play', '/characters/create'];

  it('flags only the references that match no route', () => {
    const references = [
      { raw: '/worlds', filePath: 'a.tsx', line: 1 },
      { raw: '/worlds/${id}/play', filePath: 'b.tsx', line: 2 },
      { raw: '/characters/create', filePath: 'c.tsx', line: 3 },
      { raw: '/world/create', filePath: 'd.tsx', line: 4 }, // typo -> broken
      { raw: 'https://example.com', filePath: 'e.tsx', line: 5 }, // external -> skipped
    ];
    const broken = findBrokenReferences({ references, routePatterns });
    expect(broken).toHaveLength(1);
    expect(broken[0].raw).toBe('/world/create');
  });

  it('treats a redirect source as a valid target', () => {
    const references = [{ raw: '/dev/design-system-2', filePath: 'a.tsx', line: 1 }];
    const broken = findBrokenReferences({
      references,
      routePatterns,
      redirectSources: ['/dev/design-system-2'],
    });
    expect(broken).toHaveLength(0);
  });
});
