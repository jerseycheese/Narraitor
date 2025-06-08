import type { WorldStore } from '@/state/worldStore';

/**
 * Debug logging utility for testUtils - only logs in development when enabled
 */
const debugLog = (message: string) => {
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true') {
    console.log(`[TestUtils] ${message}`);
  }
};

// Utility functions to help test the World List Screen Harness in the browser console

export const testUtils = {
  // Add test worlds to the store
  async addTestWorlds() {
    const { useWorldStore } = await import('@/state/worldStore');
    const store = useWorldStore.getState() as WorldStore;
    
    const testWorlds = [
      {
        name: 'Test Medieval Kingdom',
        description: 'A test medieval fantasy kingdom for development purposes',
        theme: 'fantasy' as const,
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 10,
          maxSkills: 10,
          attributePointPool: 0,
          skillPointPool: 0,
        },
      },
      {
        name: 'Test Space Colony',
        description: 'A test sci-fi space colony for development purposes',
        theme: 'scifi' as const,
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 10,
          maxSkills: 10,
          attributePointPool: 0,
          skillPointPool: 0,
        },
      },
    ];
    
    // Add each world to the store
    for (const world of testWorlds) {
      store.createWorld(world);
    }
    
    debugLog('Added test worlds to store');
  },
  
  // Clear all worlds from the store
  async clearWorlds() {
    const { useWorldStore } = await import('@/state/worldStore');
    const store = useWorldStore.getState() as WorldStore;
    
    if ('worlds' in store && 'deleteWorld' in store) {
      const worlds = Object.values(store.worlds);
      
      for (const world of worlds) {
        await store.deleteWorld(world.id);
      }
    }
    
    debugLog('Cleared all worlds from store');
  },
  
  // Trigger loading state
  async setLoadingState(loading: boolean) {
    const { useWorldStore } = await import('@/state/worldStore');
    const store = useWorldStore.getState() as WorldStore;
    
    if ('setLoading' in store) {
      store.setLoading(loading);
    }
    
    debugLog(`Set loading state to: ${loading}`);
  },
  
  // Trigger error state
  async setErrorState(error: string | null) {
    const { useWorldStore } = await import('@/state/worldStore');
    const store = useWorldStore.getState() as WorldStore;
    
    if ('setError' in store) {
      store.setError(error);
    }
    
    debugLog(`Set error state to: ${error}`);
  },
};

// Make utils available in browser console
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).worldListTestUtils = testUtils;
}
