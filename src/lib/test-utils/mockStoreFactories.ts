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
  partialState: Partial<T> | T
): jest.MockedFunction<typeof useStore> & { getState: () => T } {
  const mock = useStore as unknown as jest.MockedFunction<typeof useStore> & { getState: () => T };

  mock.mockImplementation(((selector?: (state: T) => unknown) => {
    const fullState = partialState as T;
    return selector ? selector(fullState) : fullState;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any);

  // Add this line to mock getState
  mock.getState = jest.fn(() => partialState as T);

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
    id: null,
    status: 'idle',
    currentSceneId: null,
    playerChoices: [],
    error: null,
    worldId: null,
    characterId: null,
    savedSessions: {},
    sessionLifecycle: {},
    templateHistory: [],
    autoSave: {
      enabled: true,
      status: 'idle',
      lastSaveTime: null,
      errorMessage: null,
      totalSaves: 0,
    },
    onboardingCompleted: false,
    narrativeHeight: 400,
    initializeSession: jest.fn().mockResolvedValue(undefined),
    endSession: jest.fn(),
    setStatus: jest.fn(),
    setError: jest.fn(),
    setPlayerChoices: jest.fn(),
    selectChoice: jest.fn(),
    clearPlayerChoices: jest.fn(),
    setCurrentScene: jest.fn(),
    pauseSession: jest.fn(),
    resumeSession: jest.fn(),
    setSessionId: jest.fn(),
    setCharacterId: jest.fn(),
    getSavedSession: jest.fn(() => undefined),
    resumeSavedSession: jest.fn(() => false),
    deleteSavedSession: jest.fn(),
    updateSavedSessionNarrativeCount: jest.fn(),
    fixExistingSessionNarrativeCounts: jest.fn().mockResolvedValue(undefined),
    upsertSessionLifecycle: jest.fn(),
    setSessionLifecycleStatus: jest.fn(),
    getSessionLifecycle: jest.fn(() => undefined),
    addTemplateToHistory: jest.fn(),
    getTemplateHistory: jest.fn(() => []),
    clearTemplateHistory: jest.fn(),
    setAutoSaveEnabled: jest.fn(),
    updateAutoSaveStatus: jest.fn(),
    recordAutoSave: jest.fn(),
    setOnboardingCompleted: jest.fn(),
    isFirstTimeUser: jest.fn(() => true),
    shouldShowOnboarding: jest.fn(() => false),
    ...overrides,
  } as SessionStore;
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
    reset: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    setLoading: jest.fn(),
    ...overrides,
  } as JournalStore;
}

/**
 * Creates a mock NarrativeStore with sensible defaults
 */
export function createMockNarrativeStore(overrides?: Partial<NarrativeStore>): NarrativeStore {
  return {
    segments: {},
    sessionSegments: {},
    decisions: {},
    sessionDecisions: {},
    endedSessions: {},
    currentEnding: null,
    isGeneratingEnding: false,
    endingError: null,
    error: null,
    loading: false,
    _hasHydrated: false,
    addSegment: jest.fn(),
    updateSegment: jest.fn(),
    deleteSegment: jest.fn(),
    addDecision: jest.fn(),
    updateDecision: jest.fn(),
    selectDecisionOption: jest.fn(),
    getSessionDecisions: jest.fn(() => []),
    getLatestDecision: jest.fn(() => null),
    getSessionSegments: jest.fn(() => []),
    reset: jest.fn(),
    clearSessionSegments: jest.fn(),
    clearSessionDecisions: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    setLoading: jest.fn(),
    setHasHydrated: jest.fn(),
    generateEnding: jest.fn().mockResolvedValue(undefined),
    clearEnding: jest.fn(),
    setCurrentEnding: jest.fn(),
    saveEndingToHistory: jest.fn(),
    hasActiveEnding: jest.fn(() => false),
    getEndingForSession: jest.fn(() => null),
    isSessionEnded: jest.fn(() => false),
    markSessionEnded: jest.fn(),
    ...overrides,
  } as NarrativeStore;
}

/**
 * Creates a mock InventoryStore with sensible defaults
 */
export function createMockInventoryStore(overrides?: Partial<InventoryStore>): InventoryStore {
  return {
    items: {},
    entities: {},
    characterInventories: {},
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
    createItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    addItem: jest.fn(),
    removeItem: jest.fn(),
    updateItemQuantity: jest.fn(),
    getCharacterItems: jest.fn(() => []),
    clearCharacterInventory: jest.fn(),
    useItem: jest.fn(() => ({ success: true, message: 'Item used' })),
    ...overrides,
  } as InventoryStore;
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
  } as NPCStore;
}

/**
 * Creates a mock WorldStore with sensible defaults
 */
export function createMockWorldStore(overrides?: Partial<WorldStore>): WorldStore {
  return {
    worlds: {},
    entities: {},
    worldStates: {},
    currentWorldId: null,
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
    syncDerivedState: jest.fn(),
    createWorld: jest.fn(),
    updateWorld: jest.fn(),
    deleteWorld: jest.fn(),
    setCurrentWorld: jest.fn(),
    fetchWorlds: jest.fn().mockResolvedValue(undefined),
    addAttribute: jest.fn(),
    updateAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    addSkill: jest.fn(),
    updateSkill: jest.fn(),
    removeSkill: jest.fn(),
    updateSettings: jest.fn(),
    updateToneSettings: jest.fn(),
    ...overrides,
  } as WorldStore;
}

/**
 * Creates a mock GoalStore with sensible defaults
 */
export function createMockGoalStore(overrides?: Partial<GoalStore>): GoalStore {
  return {
    goals: {},
    entities: {},
    sessionGoals: {},
    activeGoalIds: [],
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
    createGoal: jest.fn(),
    updateGoal: jest.fn(),
    deleteGoal: jest.fn(),
    getActiveGoalsBySession: jest.fn(() => []),
    getGoalsByPriority: jest.fn(() => []),
    getRecentlyMentionedGoals: jest.fn(() => []),
    incrementMentionCount: jest.fn(),
    addProgressNote: jest.fn(),
    clearSessionGoals: jest.fn(),
    processSegmentForGoals: jest.fn().mockResolvedValue({
      newGoalsCreated: 0,
      goalsUpdated: 0,
      goalsCompleted: 0
    }),
    ...overrides,
  } as GoalStore;
}

/**
 * Creates a mock LoreStore with sensible defaults
 */
export function createMockLoreStore(overrides?: Partial<LoreStore>): LoreStore {
  return {
    facts: {},
    entities: {},
    factHistory: {},
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
    addFact: jest.fn(),
    getFacts: jest.fn(() => []),
    clearFacts: jest.fn(),
    cleanupOldFacts: jest.fn(),
    compactFactHistory: jest.fn(),
    getFactsCount: jest.fn(() => 0),
    updateFact: jest.fn(),
    deleteFact: jest.fn(),
    validateFactUniqueness: jest.fn(() => true),
    findSimilarFacts: jest.fn(() => []),
    searchFacts: jest.fn(() => []),
    exportFacts: jest.fn(() => '[]'),
    importFacts: jest.fn(),
    getFactHistory: jest.fn(() => []),
    validateFact: jest.fn(() => true),
    validateKey: jest.fn(() => true),
    getLoreContext: jest.fn(() => ({ facts: [], categories: [] })),
    addStructuredLore: jest.fn(),
    ...overrides,
  } as LoreStore;
}
