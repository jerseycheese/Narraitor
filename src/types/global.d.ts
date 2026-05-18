declare global {
  interface Window {
    worldListTestUtils: {
      addTestWorlds: () => Promise<void>;
      clearWorlds: () => Promise<void>;
      setLoadingState: (loading: boolean) => Promise<void>;
      setErrorState: (error: string | null) => Promise<void>;
      inspectStore: () => void;
    };
    /** Flag set by Playwright tests to disable DevTools during test runs */
    __PLAYWRIGHT__?: boolean;
    /** Stores exposed on window in development for manual debugging only — see each store file */
    useCharacterStore?: typeof import('@/state/characterStore').useCharacterStore;
    useWorldStore?: typeof import('@/state/worldStore').useWorldStore;
    useNarrativeStore?: typeof import('@/state/narrativeStore').useNarrativeStore;
    useInventoryStore?: typeof import('@/state/inventoryStore').useInventoryStore;
    useJournalStore?: typeof import('@/state/journalStore').useJournalStore;
    useSessionStore?: typeof import('@/state/sessionStore').useSessionStore;
    useNPCStore?: typeof import('@/state/npcStore').useNPCStore;
  }
}

export {};
