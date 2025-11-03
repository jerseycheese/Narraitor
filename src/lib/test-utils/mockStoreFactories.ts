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
import type { SessionStore } from '@/state/sessionStore';
import type { JournalStore } from '@/state/journalStore';
import type { NarrativeStore } from '@/state/narrativeStore';
import type { InventoryStore } from '@/state/inventoryStore';
import type { NPCStore } from '@/state/npcStore';
import type { WorldStore } from '@/state/worldStore';
import type { GoalStore } from '@/state/goalStore';
import type { LoreStore } from '@/state/loreStore';

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
  useStore: (...args: any[]) => T,
  partialState: Partial<T>
): jest.MockedFunction<typeof useStore> {
  const mock = useStore as unknown as jest.MockedFunction<typeof useStore>;

  mock.mockImplementation((selector?: (state: T) => unknown) => {
    const fullState = partialState as T;
    return selector ? selector(fullState) : fullState;
  });

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
  };
}

/**
 * Creates a mock SessionStore with sensible defaults
 */
export function createMockSessionStore(overrides?: Partial<SessionStore>): SessionStore {
  return {
    sessions: {},
    savedSessions: {},
    currentSessionId: null,
    currentContext: null,
    error: null,
    loading: false,
    startSession: jest.fn(),
    endSession: jest.fn(),
    getCurrentSession: jest.fn(() => undefined),
    updateSession: jest.fn(),
    saveCurrentSession: jest.fn(),
    loadSession: jest.fn(),
    deleteSession: jest.fn(),
    getSavedSessions: jest.fn(() => []),
    reset: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    setLoading: jest.fn(),
    addToHistory: jest.fn(),
    updateContext: jest.fn(),
    setOnboardingComplete: jest.fn(),
    isOnboardingComplete: jest.fn(() => false),
    ...overrides,
  };
}

/**
 * Creates a mock JournalStore with sensible defaults
 */
export function createMockJournalStore(overrides?: Partial<JournalStore>): JournalStore {
  return {
    entries: {},
    sessionEntries: {},
    error: null,
    loading: false,
    addEntry: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
    markAsRead: jest.fn(),
    getSessionEntries: jest.fn(() => []),
    getSessionEntriesWithCharacter: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    deleteSessionEntries: jest.fn(),
    clearAllEntries: jest.fn(),
    reset: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    setLoading: jest.fn(),
    ...overrides,
  };
}

/**
 * Creates a mock NarrativeStore with sensible defaults
 */
export function createMockNarrativeStore(overrides?: Partial<NarrativeStore>): NarrativeStore {
  return {
    segments: {},
    currentSegmentId: null,
    history: [],
    choices: [],
    error: null,
    loading: false,
    isGenerating: false,
    addSegment: jest.fn(),
    updateSegment: jest.fn(),
    deleteSegment: jest.fn(),
    setCurrentSegment: jest.fn(),
    generateNarrative: jest.fn(),
    addToHistory: jest.fn(),
    clearHistory: jest.fn(),
    setChoices: jest.fn(),
    clearChoices: jest.fn(),
    getSegmentsBySession: jest.fn(() => []),
    reset: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    setLoading: jest.fn(),
    setGenerating: jest.fn(),
    ...overrides,
  };
}

/**
 * Creates a mock InventoryStore with sensible defaults
 */
export function createMockInventoryStore(overrides?: Partial<InventoryStore>): InventoryStore {
  return {
    inventories: {},
    error: null,
    loading: false,
    addItem: jest.fn(),
    removeItem: jest.fn(),
    updateItem: jest.fn(),
    getInventory: jest.fn(() => undefined),
    getItem: jest.fn(() => undefined),
    useItem: jest.fn(),
    reset: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    setLoading: jest.fn(),
    ...overrides,
  };
}

/**
 * Creates a mock NPCStore with sensible defaults
 */
export function createMockNPCStore(overrides?: Partial<NPCStore>): NPCStore {
  return {
    npcs: {},
    entities: {},
    worldNpcs: {},
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
    createNPC: jest.fn(),
    updateNPC: jest.fn(),
    deleteNPC: jest.fn(),
    getNPCsByWorld: jest.fn(() => []),
    clearWorldNPCs: jest.fn(),
    ...overrides,
  };
}

/**
 * Creates a mock WorldStore with sensible defaults
 */
export function createMockWorldStore(overrides?: Partial<WorldStore>): WorldStore {
  return {
    worlds: {},
    entities: {},
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
    ...overrides,
  };
}

/**
 * Creates a mock GoalStore with sensible defaults
 */
export function createMockGoalStore(overrides?: Partial<GoalStore>): GoalStore {
  return {
    goals: {},
    entities: {},
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
    getGoalsByCharacter: jest.fn(() => []),
    ...overrides,
  };
}

/**
 * Creates a mock LoreStore with sensible defaults
 */
export function createMockLoreStore(overrides?: Partial<LoreStore>): LoreStore {
  return {
    lore: {},
    entities: {},
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
    getLoreByWorld: jest.fn(() => []),
    ...overrides,
  };
}
