import type { WorldStore } from '@/state/worldStore';

// Utility functions to help test the World List Screen Harness in the browser console

export const testUtils = {
  // Add test worlds to the store
  async addTestWorlds() {
    const { worldStore } = await import('@/state/worldStore');
    const store = worldStore.getState() as WorldStore;
    
    const testWorlds = [
      {
        name: 'Test Medieval Kingdom',
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
    
    console.log('Added test worlds to store');
  },
  
  // Clear all worlds from the store
  async clearWorlds() {
    const { worldStore } = await import('@/state/worldStore');
    const store = worldStore.getState() as WorldStore;
    
    if ('worlds' in store && 'deleteWorld' in store) {
      const worlds = Object.values(store.worlds);
      
      for (const world of worlds) {
        await store.deleteWorld(world.id);
      }
    }
    
    console.log('Cleared all worlds from store');
  },
  
  // Trigger loading state
  async setLoadingState(loading: boolean) {
    const { worldStore } = await import('@/state/worldStore');
    const store = worldStore.getState() as WorldStore;
    
    if ('setLoading' in store) {
      store.setLoading(loading);
    }
    
    console.log(`Set loading state to: ${loading}`);
  },
  
  // Trigger error state
  async setErrorState(error: string | null) {
    const { worldStore } = await import('@/state/worldStore');
    const store = worldStore.getState() as WorldStore;
    
    if ('setError' in store) {
      store.setError(error);
    }
    
    console.log(`Set error state to: ${error}`);
  },
};

// Make utils available in browser console
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).worldListTestUtils = testUtils;
}
