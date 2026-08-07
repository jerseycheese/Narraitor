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

export type SurfaceRegister = 'brand' | 'product';

/**
 * Brand-register route roots. Sub-paths come along, so a future
 * /privacy/cookies joins the register without a second edit here. /welcome is
 * the legacy alias for / — it permanent-redirects today so nothing renders
 * under it, listed so the two stay in step if that redirect is ever retired.
 */
const BRAND_ROUTE_PATTERN = /^\/(?:about|privacy|terms|welcome)(?:\/.*)?$/;

/**
 * Returns the visual register for a route path. Orthogonal to getSurfaceMode:
 * the register is a token layer inside the app surface, not a third chrome.
 * Every manuscript route is 'product'. See DESIGN.md "Surfaces".
 */
export function getSurfaceRegister(pathname: string): SurfaceRegister {
  const normalizedPath = normalizePath(pathname);

  // '/' is matched exactly, not as a prefix, or it would claim every route.
  if (normalizedPath === '/' || BRAND_ROUTE_PATTERN.test(normalizedPath)) {
    return 'brand';
  }

  return 'product';
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
