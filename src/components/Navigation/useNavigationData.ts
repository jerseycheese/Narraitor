'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore, type StoreCharacter } from '@/state/characterStore';
import { useNavigationLoadingContext } from '@/components/shared/NavigationLoadingProvider';
import type { WorldStore } from '@/state/worldStore';
import type { CharacterStore } from '@/state/characterStore';

export interface NavigationData {
  pathname: string;
  currentWorldId: string | null;
  worlds: WorldStore['worlds'];
  characters: CharacterStore['characters'];
  currentWorld: WorldStore['worlds'][string] | null;
  hasWorldsStore: boolean;
  worldCharacterCount: number;
  navigateWithLoading: ReturnType<typeof useNavigationLoadingContext>['navigateWithLoading'];
  setCurrentWorld: WorldStore['setCurrentWorld'];
}

/**
 * Shared navigation data/state used by both header and sidebar navigation components.
 */
export function useNavigationData(): NavigationData {
  const pathname = usePathname();
  const { currentWorldId, worlds, setCurrentWorld } = useWorldStore();
  const { characters } = useCharacterStore();
  const { navigateWithLoading } = useNavigationLoadingContext();

  const currentWorld = currentWorldId ? worlds[currentWorldId] : null;
  const hasWorldsStore = Object.keys(worlds).length > 0;

  const worldCharacterCount = useMemo(() => {
    if (!currentWorldId) {
      return 0;
    }

    return (Object.values(characters) as StoreCharacter[]).filter(
      (char) => char.worldId === currentWorldId
    ).length;
  }, [characters, currentWorldId]);

  return {
    pathname,
    currentWorldId,
    worlds,
    characters,
    currentWorld,
    hasWorldsStore,
    worldCharacterCount,
    navigateWithLoading,
    setCurrentWorld,
  };
}
