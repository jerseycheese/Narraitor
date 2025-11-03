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

import type { CharacterStore } from '@/state/characterStore';
import type { SessionStore } from '@/types/game.types';
import type { NPCStore } from '@/state/npcStore';
import type { WorldStore } from '@/state/worldStore';
import { useJournalStore } from '@/state/journalStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useGoalStore } from '@/state/goalStore';
import { useLoreStore } from '@/state/loreStore';

// Infer types from store hooks for stores without exported interfaces
type JournalStore = ReturnType<typeof useJournalStore>;
type NarrativeStore = ReturnType<typeof useNarrativeStore>;
type InventoryStore = ReturnType<typeof useInventoryStore>;
type GoalStore = ReturnType<typeof useGoalStore>;
type LoreStore = ReturnType<typeof useLoreStore>;

/**
 * Creates a properly-typed mock for a Zustand store hook
 * Encapsulates the `as unknown as jest.Mock` pattern with type safety
 *
 * @param useStore - The Zustand store hook to mock
 * @param partialState - Partial state to return (merged with defaults)
 * @returns A jest.MockedFunction that can be further configured
 *
 * @example
 * ```typescript
 * mockZustandStore(useWorldStore, {
 *   worlds: { 'world-1': mockWorld },
 *   currentWorldId: 'world-1'
 * });
 * ```
 */
export function mockZustandStore<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useStore: (...args: any[]) => T,
  partialState: Partial<T>
): jest.MockedFunction<typeof useStore> {
  const mock = useStore as unknown as jest.MockedFunction<typeof useStore>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mock.mockImplementation(((selector?: (state: T) => unknown) => {
    const fullState = partialState as T;
    return selector ? selector(fullState) : fullState;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any);

  return mock;
}

/**
 * Creates a mock CharacterStore with sensible defaults
 * All methods are jest.fn() and can be further configured
 */
export function createMockCharacterStore(overrides?: Partial<CharacterStore>): CharacterStore {
  return {
    characters: {},
    entities: {},
    currentCharacterId: null,
    currentEntityId: null,
    error: null,
    loading: false,
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    setCurrent: jest.fn(),
    getById: jest.fn(() => undefined),
    getAll: jest.fn(() => []),
    reset: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    setLoading: jest.fn(),
    createCharacter: jest.fn(),
    updateCharacter: jest.fn(),
    deleteCharacter: jest.fn(),
    setCurrentCharacter: jest.fn(),
    addAttribute: jest.fn(),
    updateAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    addSkill: jest.fn(),
    cleanupCharacterHistory: jest.fn(),
    compactCharacterData: jest.fn(),
    getCharactersCount: jest.fn(() => 0),
    deleteCharactersInWorld: jest.fn(),
    syncDerivedState: jest.fn(),
    ...overrides,
  } as CharacterStore;
}

/**
 * Creates a mock SessionStore with sensible defaults
 */
export function createMockSessionStore(overrides?: Partial<SessionStore>): SessionStore {
  return {
    ...overrides,
  } as SessionStore;
}

/**
 * Creates a mock JournalStore with sensible defaults
 */
export function createMockJournalStore(overrides?: Partial<JournalStore>): JournalStore {
  return {
    ...overrides,
  } as JournalStore;
}

/**
 * Creates a mock NarrativeStore with sensible defaults
 */
export function createMockNarrativeStore(overrides?: Partial<NarrativeStore>): NarrativeStore {
  return {
    ...overrides,
  } as NarrativeStore;
}

/**
 * Creates a mock InventoryStore with sensible defaults
 */
export function createMockInventoryStore(overrides?: Partial<InventoryStore>): InventoryStore {
  return {
    ...overrides,
  } as InventoryStore;
}

/**
 * Creates a mock NPCStore with sensible defaults
 */
export function createMockNPCStore(overrides?: Partial<NPCStore>): NPCStore {
  return {
    ...overrides,
  } as NPCStore;
}

/**
 * Creates a mock WorldStore with sensible defaults
 */
export function createMockWorldStore(overrides?: Partial<WorldStore>): WorldStore {
  return {
    ...overrides,
  } as WorldStore;
}

/**
 * Creates a mock GoalStore with sensible defaults
 */
export function createMockGoalStore(overrides?: Partial<GoalStore>): GoalStore {
  return {
    ...overrides,
  } as GoalStore;
}

/**
 * Creates a mock LoreStore with sensible defaults
 */
export function createMockLoreStore(overrides?: Partial<LoreStore>): LoreStore {
  return {
    ...overrides,
  } as LoreStore;
}
