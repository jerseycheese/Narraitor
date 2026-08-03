export type SurfaceMode = 'app' | 'manuscript';

/**
 * Returns the top-level surface mode for a route path.
 * Two surfaces (#1655): the chrome-free manuscript for play, and app chrome
 * everywhere else. See DESIGN.md "Surfaces".
 */
export function getSurfaceMode(pathname: string): SurfaceMode {
  const normalizedPath = normalizePath(pathname);

  if (
    normalizedPath === '/play' ||
    normalizedPath.startsWith('/play/') ||
    /^\/worlds\/[^/]+\/play(?:\/.*)?$/.test(normalizedPath)
  ) {
    return 'manuscript';
  }

  return 'app';
}

function normalizePath(pathname: string): string {
  if (!pathname) {
    return '/';
  }

  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const withoutHash = withLeadingSlash.split('#')[0] || '/';
  const withoutQuery = withoutHash.split('?')[0] || '/';

  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
    return withoutQuery.slice(0, -1);
  }

  return withoutQuery;
}
