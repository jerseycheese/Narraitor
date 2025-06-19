// This is a helper function to get the world store
// Added for compatibility with the template implementation
import { useWorldStore } from './worldStore';

/**
 * Returns the worldStore instance
 * This is used by the template loader to avoid directly accessing the store
 */
export const getWorldStore = () => useWorldStore;

// Re-export the store as a hook (Zustand stores are already hooks)
export { useWorldStore } from './worldStore';
