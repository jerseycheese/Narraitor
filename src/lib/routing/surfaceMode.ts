export type SurfaceMode = 'default' | 'workshop' | 'manuscript';

/**
 * Returns the top-level surface mode for a route path.
 * This is used to select between default, workshop, and manuscript shells.
 */
export function getSurfaceMode(pathname: string): SurfaceMode {
  const normalizedPath = normalizePath(pathname);

  // Manuscript routes
  if (
    normalizedPath === '/play' ||
    normalizedPath.startsWith('/play/') ||
    /^\/worlds\/[^/]+\/play(?:\/.*)?$/.test(normalizedPath)
  ) {
    return 'manuscript';
  }

  // Workshop routes
  if (
    /^\/worlds(?:\/.*)?$/.test(normalizedPath) ||
    /^\/characters(?:\/.*)?$/.test(normalizedPath) ||
    /^\/settings(?:\/.*)?$/.test(normalizedPath)
  ) {
    return 'workshop';
  }

  return 'default';
}

function normalizePath(pathname: string): string {
  if (!pathname) {
    return '/';
  }

  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith('/')) {
    return withLeadingSlash.slice(0, -1);
  }

  return withLeadingSlash;
}
