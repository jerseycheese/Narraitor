/**
 * Typed Mock Factory Functions for Zustand Stores
 *
 * This module provides factory functions for creating properly-typed mock stores
 * in tests, eliminating the need for `as unknown as` type assertions.
 *
 * ## Usage
 *
 * ### Basic Usage
 * ```typescript
 * import { createMockWorldStore } from '@/lib/test-utils/mockStoreFactories';
 *
 * const mockStore = createMockWorldStore({
 *   worlds: { 'world-1': mockWorld },
 *   currentEntityId: 'world-1'
 * });
 *
 * (useWorldStore as jest.Mock).mockReturnValue(mockStore);
 * ```
 *
 * ### With mockZustandStore Helper
 * ```typescript
 * import { mockZustandStore, createMockWorldStore } from '@/lib/test-utils';
 *
 * mockZustandStore(useWorldStore, createMockWorldStore({
 *   worlds: { 'world-1': mockWorld }
 * }));
 * ```
 *
 * ### Customizing Methods
 * ```typescript
 * const mockStore = createMockWorldStore({
 *   create: jest.fn().mockReturnValue('new-world-id'),
 *   getById: jest.fn((id) => id === 'world-1' ? mockWorld : undefined)
 * });
 * ```
 */

export { mockZustandStore } from './mockStoreFactories/mockZustandStore';
export { createMockCharacterStore } from './mockStoreFactories/character';
export { createMockSessionStore } from './mockStoreFactories/session';
export { createMockJournalStore } from './mockStoreFactories/journal';
export { createMockNarrativeStore } from './mockStoreFactories/narrative';
export { createMockInventoryStore } from './mockStoreFactories/inventory';
export { createMockNPCStore } from './mockStoreFactories/npc';
export { createMockWorldStore } from './mockStoreFactories/world';
