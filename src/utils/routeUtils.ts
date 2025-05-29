/**
 * Parsed route segment interface
 */
interface RouteSegment {
  path: string;
  param?: string;
  value?: string;
}

/**
 * Parsed route result
 */
export interface ParsedRoute {
  segments: RouteSegment[];
}

/**
 * Breadcrumb segment interface (matches test expectations)
 */
export interface BreadcrumbSegment {
  label: string;
  href: string;
  isCurrentPage: boolean;
}

/**
 * Parse a route path into segments
 * @param pathname The route pathname to parse
 * @returns Parsed route with segments
 */
export function parseRoute(pathname: string): ParsedRoute {
  // Remove leading slash and split by /
  const parts = pathname.split('/').filter(Boolean);
  
  if (parts.length === 0) {
    return { segments: [] };
  }
  
  const segments: RouteSegment[] = [];
  
  // Special handling for known patterns
  if (parts[0] === 'world' && parts[1]) {
    // /world/123 pattern
    segments.push({
      path: 'world',
      param: 'id',
      value: parts[1]
    });
    // Continue processing remaining parts
    for (let i = 2; i < parts.length; i++) {
      segments.push({
        path: parts[i],
        param: undefined,
        value: undefined
      });
    }
  } else if (parts[0] === 'characters' && parts[1] && parts[1] !== 'create') {
    // /characters/char-456 pattern
    segments.push({
      path: 'characters',
      param: undefined,
      value: undefined
    });
    segments.push({
      path: parts[1],
      param: 'id',
      value: parts[1]
    });
    // Continue processing remaining parts
    for (let i = 2; i < parts.length; i++) {
      segments.push({
        path: parts[i],
        param: undefined,
        value: undefined
      });
    }
  } else {
    // Default handling
    for (const part of parts) {
      segments.push({
        path: part,
        param: undefined,
        value: undefined
      });
    }
  }
  
  return { segments };
}

/**
 * Minimal types for entity lookups
 */
interface EntityWithName {
  name: string;
  id: string;
}

/**
 * Build breadcrumb segments from pathname and store data
 * @param pathname Current pathname
 * @param worlds World store data
 * @param characters Character store data
 * @param currentWorldId Current world ID from store
 * @returns Array of breadcrumb segments
 */
export function buildBreadcrumbSegments(
  pathname: string,
  worlds: Record<string, EntityWithName>,
  characters: Record<string, EntityWithName>,
  currentWorldId: string | null
): BreadcrumbSegment[] {
  const segments: BreadcrumbSegment[] = [];
  
  // Only show breadcrumbs for non-root paths
  const isRootPath = pathname === '/' || pathname === '/worlds';
  
  // Don't show breadcrumbs on the root/home page
  if (isRootPath) {
    return [];
  }
  
  // Start with Worlds for other pages
  segments.push({
    label: 'Worlds',
    href: '/worlds',
    isCurrentPage: false
  });
  
  // Handle world routes
  if (pathname.startsWith('/world/')) {
    const worldIdMatch = pathname.match(/\/world\/([^\/]+)/);
    if (worldIdMatch) {
      const worldId = worldIdMatch[1];
      const world = worlds[worldId];
      segments.push({
        label: world?.name || 'Loading...',
        href: `/world/${worldId}`,
        isCurrentPage: pathname === `/world/${worldId}`
      });
    }
  }
  
  // Handle character routes - need world context
  if (pathname.includes('/characters')) {
    // Add world breadcrumb if we have a current world
    if (currentWorldId && worlds[currentWorldId]) {
      segments.push({
        label: worlds[currentWorldId].name,
        href: `/world/${currentWorldId}`,
        isCurrentPage: false
      });
    }
    
    // Add characters list breadcrumb
    const isCharactersList = pathname === '/characters';
    segments.push({
      label: 'Characters',
      href: '/characters',
      isCurrentPage: isCharactersList || pathname === '/characters/create'
    });
    
    // Handle specific character
    const charIdMatch = pathname.match(/\/characters\/([^\/]+)(?:\/|$)/);
    if (charIdMatch && charIdMatch[1] !== 'create') {
      const charId = charIdMatch[1];
      const character = characters[charId];
      segments.push({
        label: character?.name || 'Loading...',
        href: `/characters/${charId}`,
        isCurrentPage: pathname === `/characters/${charId}`
      });
    }
  }
  
  return segments;
}