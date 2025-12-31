/**
 * Breadcrumb segment interface
 */
export interface BreadcrumbSegment {
  label: string;
  href: string;
  isCurrentPage: boolean;
}

/**
 * Minimal types for entity lookups
 */
interface EntityWithName {
  name: string;
  id: string;
}

interface CharacterWithWorld extends EntityWithName {
  worldId: string;
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
  characters: Record<string, CharacterWithWorld>,
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
  
  // Handle consolidated world routes
  if (pathname.startsWith('/worlds/')) {
    const worldIdMatch = pathname.match(/\/worlds\/([^\/]+)/);
    if (worldIdMatch) {
      const worldId = worldIdMatch[1];
      
      // Skip adding breadcrumb for create page
      if (worldId === 'create') {
        segments.push({
          label: 'Create World',
          href: '/worlds/create',
          isCurrentPage: pathname === '/worlds/create'
        });
      } else {
        // Individual world
        const world = worlds[worldId];
        segments.push({
          label: world?.name || 'Loading...',
          href: `/worlds/${worldId}`,
          isCurrentPage: pathname === `/worlds/${worldId}`
        });
        
        // Handle sub-routes (edit, play)
        if (pathname.includes('/edit')) {
          segments.push({
            label: 'Edit',
            href: `/worlds/${worldId}/edit`,
            isCurrentPage: pathname === `/worlds/${worldId}/edit`
          });
        } else if (pathname.includes('/play')) {
          segments.push({
            label: 'Play',
            href: `/worlds/${worldId}/play`,
            isCurrentPage: pathname === `/worlds/${worldId}/play`
          });
        }
      }
    }
  }
  
  // Handle character routes - need world context
  if (pathname.includes('/characters')) {
    // For specific character routes, get the world from the character data
    const charIdMatch = pathname.match(/\/characters\/([^\/]+)(?:\/|$)/);
    let worldToShow = currentWorldId;
    
    if (charIdMatch && charIdMatch[1] !== 'create') {
      const charId = charIdMatch[1];
      const character = characters[charId];
      if (character && character.worldId) {
        worldToShow = character.worldId;
      }
    }
    
    // Add world breadcrumb if we have a world to show
    if (worldToShow && worlds[worldToShow]) {
      segments.push({
        label: worlds[worldToShow].name,
        href: `/worlds/${worldToShow}`,
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
    
    // Handle specific character (reuse the match from above)
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
