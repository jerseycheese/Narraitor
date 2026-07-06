import React, { useRef } from 'react';
import { useWorldStore } from '../../src/state/worldStore';
import { useCharacterStore } from '../../src/state/characterStore';
import { useSessionStore } from '../../src/state/sessionStore';
import { useNarrativeStore } from '../../src/state/narrativeStore';
import { useInventoryStore } from '../../src/state/inventoryStore';
import { useJournalStore } from '../../src/state/journalStore';
import { useNPCStore } from '../../src/state/npcStore';
import { useGoalStore } from '../../src/state/goalStore';
import { useLoreStore } from '../../src/state/loreStore';

/**
 * One reusable decorator for seeding Zustand stores in Storybook (issue #1485).
 *
 * Generalizes the per-story `useXStore.setState(...)` pattern (e.g.
 * `withDashboardScenario`, the game-session decorators) into a single call:
 *
 *   decorators: [withStores({ world: { worlds: {...} }, character: {...} })]
 *
 * Each value is merged into its store via the store's imperative `setState`,
 * so you only pass the slices a story reads. Seeding happens synchronously
 * before the story's first render — components that read store state on mount
 * have data immediately (matching the inline ActiveGameSession pattern), with a
 * ref guard so it runs once per mount instead of on every render.
 *
 * Stores are NOT auto-reset between stories (mirrors the existing helpers): seed
 * everything a story depends on rather than relying on prior-story leftovers.
 *
 * Note: the jest-based `mockStoreFactories` can't run in Storybook, so this
 * uses real store `setState` with plain mock data instead.
 */
export interface StoreSeed {
  world?: Partial<ReturnType<typeof useWorldStore.getState>>;
  character?: Partial<ReturnType<typeof useCharacterStore.getState>>;
  session?: Partial<ReturnType<typeof useSessionStore.getState>>;
  narrative?: Partial<ReturnType<typeof useNarrativeStore.getState>>;
  inventory?: Partial<ReturnType<typeof useInventoryStore.getState>>;
  journal?: Partial<ReturnType<typeof useJournalStore.getState>>;
  npc?: Partial<ReturnType<typeof useNPCStore.getState>>;
  goal?: Partial<ReturnType<typeof useGoalStore.getState>>;
  lore?: Partial<ReturnType<typeof useLoreStore.getState>>;
}

const applySeed = (seed: StoreSeed): void => {
  if (seed.world) useWorldStore.setState(seed.world);
  if (seed.character) useCharacterStore.setState(seed.character);
  if (seed.session) useSessionStore.setState(seed.session);
  if (seed.narrative) useNarrativeStore.setState(seed.narrative);
  if (seed.inventory) useInventoryStore.setState(seed.inventory);
  if (seed.journal) useJournalStore.setState(seed.journal);
  if (seed.npc) useNPCStore.setState(seed.npc);
  if (seed.goal) useGoalStore.setState(seed.goal);
  if (seed.lore) useLoreStore.setState(seed.lore);
};

export function withStores(seed: StoreSeed) {
  const Decorator = (Story: React.ComponentType) => {
    const seeded = useRef(false);
    if (!seeded.current) {
      seeded.current = true;
      applySeed(seed);
    }
    return <Story />;
  };
  Decorator.displayName = 'withStores';
  return Decorator;
}
