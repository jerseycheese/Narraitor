// Mock for the worldStore module

import { World, WorldAttribute, WorldSkill, WorldSettings } from '@/types/world.types';
import { getTimestamp } from '@/lib/utils';
import { UserFriendlyError, ErrorType } from '@/lib/utils/errorUtils';
import { WorldState, WorldStateUpdate, createEmptyWorldState } from '@/types/world-state.types';
import { applyWorldStateUpdate, getActiveWorldState, mergeState } from '@/lib/world';

interface MockWorldState {
  worlds: Record<string, World>;
  entities: Record<string, World>;
  worldStates: Record<string, WorldState>;
  currentWorldId: string | null;
  currentEntityId: string | null;
  error: UserFriendlyError | null;
  loading: boolean;
}

// Simulated store state
let mockState: MockWorldState = {
  worlds: {},
  entities: {},
  worldStates: {},
  currentWorldId: null,
  currentEntityId: null,
  error: null,
  loading: false
};

const createError = (
  message: string,
  {
    title = message,
    type = ErrorType.UNKNOWN,
    retryable = false,
  }: { title?: string; type?: ErrorType; retryable?: boolean } = {}
): UserFriendlyError => ({
  title,
  message,
  retryable,
  type,
});

const syncWorldToEntities = (worldId: string) => {
  const world = mockState.worlds[worldId];
  if (world) {
    mockState.entities[worldId] = world;
  } else {
    delete mockState.entities[worldId];
  }
};

const ensureWorldState = (worldId: string): WorldState => {
  if (!mockState.worldStates[worldId]) {
    mockState.worldStates[worldId] = createEmptyWorldState(worldId);
  }
  return mockState.worldStates[worldId];
};

const mockInitializeWorldState = jest.fn((worldId: string) => {
  ensureWorldState(worldId);
});

const mockUpdateWorldState = jest.fn((worldId: string, update: WorldStateUpdate, sessionId: string) => {
  const current = ensureWorldState(worldId);
  mockState.worldStates[worldId] = applyWorldStateUpdate(worldId, current, update, sessionId);
});

const mockMergeWorldState = jest.fn((incomingState: WorldState) => {
  const current = mockState.worldStates[incomingState.worldId];
  mockState.worldStates[incomingState.worldId] = current ? mergeState(current, incomingState) : incomingState;
});

const mockGetWorldState = jest.fn((worldId: string, options?: { includeEndedSessions?: boolean }) => {
  const current = ensureWorldState(worldId);
  if (options?.includeEndedSessions) {
    return current;
  }
  return getActiveWorldState(worldId, current);
});

const mockGetRawWorldState = jest.fn((worldId: string) => {
  return mockState.worldStates[worldId];
});

const mockCreateWorld = jest.fn((worldData: Partial<World>): string => {
  // Validate required fields - THROW on validation failure
  if (!worldData.name || worldData.name.trim() === '') {
    throw new Error('World name is required');
  }

  // Actually create the world in our mock state
  const worldId = 'mock-world-id';
  const newWorld: World = {
    id: worldId,
    name: worldData.name,
    description: worldData.description || '',
    genre: worldData.genre || 'other',
    attributes: worldData.attributes || [],
    skills: worldData.skills || [],
    settings: worldData.settings || {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 20,
      skillPointPool: 20
    },
    toneSettings: worldData.toneSettings,
    createdAt: getTimestamp(),
    updatedAt: getTimestamp()
  };

  mockState.worlds[worldId] = newWorld;
  syncWorldToEntities(worldId);
  ensureWorldState(worldId);
  return worldId;
});

// Define the store interface
interface WorldStoreActions {
  createWorld: typeof mockCreateWorld;
  updateWorld: jest.Mock;
  deleteWorld: jest.Mock;
  setCurrentWorld: jest.Mock;
  fetchWorlds: jest.Mock;
  addAttribute: jest.Mock;
  updateAttribute: jest.Mock;
  removeAttribute: jest.Mock;
  addSkill: jest.Mock;
  updateSkill: jest.Mock;
  removeSkill: jest.Mock;
  updateSettings: jest.Mock;
  updateToneSettings: jest.Mock;
  initializeWorldState: jest.Mock;
  updateWorldState: jest.Mock;
  mergeWorldState: jest.Mock;
  getWorldState: jest.Mock;
  getRawWorldState: jest.Mock;
  reset: jest.Mock;
  setError: jest.Mock;
  clearError: jest.Mock;
  setLoading: jest.Mock;
  getWorldById: jest.Mock;
  // CrudStore compatibility
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  setCurrent: jest.Mock;
  getById: jest.Mock;
  getAll: jest.Mock;
}

type WorldStore = MockWorldState & WorldStoreActions;

// Create mock actions that mutate the shared state
const mockUpdateWorld = jest.fn((worldId: string, updates: Partial<World>) => {
  if (!mockState.worlds[worldId]) {
    mockState.error = createError('World not found', { type: ErrorType.VALIDATION });
    return;
  }
  mockState.worlds[worldId] = {
    ...mockState.worlds[worldId],
    ...updates,
    updatedAt: getTimestamp()
  };
  syncWorldToEntities(worldId);
});

const mockDeleteWorld = jest.fn((worldId: string) => {
  if (mockState.currentWorldId === worldId) {
    mockState.currentWorldId = null;
    mockState.currentEntityId = null;
  }
  delete mockState.worlds[worldId];
  delete mockState.entities[worldId];
});

const mockSetCurrentWorld = jest.fn((worldId: string | null) => {
  if (worldId && !mockState.worlds[worldId]) {
    mockState.error = createError('World not found', { type: ErrorType.VALIDATION });
    return;
  }
  mockState.currentWorldId = worldId;
  mockState.currentEntityId = worldId;
  mockState.error = null;
});

const mockAddAttribute = jest.fn((worldId: string, attribute: Partial<WorldAttribute>) => {
  if (!mockState.worlds[worldId]) {
    mockState.error = createError('World not found', { type: ErrorType.VALIDATION });
    return;
  }
  const world = mockState.worlds[worldId];
  if (world.attributes.length >= (world.settings?.maxAttributes || 10)) {
    mockState.error = createError('Maximum attributes limit reached', { type: ErrorType.VALIDATION });
    return;
  }
  const newAttribute: WorldAttribute = {
    id: `attr-${Date.now()}`,
    worldId,
    name: attribute.name || '',
    description: attribute.description || '',
    baseValue: attribute.baseValue || 0,
    minValue: attribute.minValue || 0,
    maxValue: attribute.maxValue || 10,
    category: attribute.category
  };
  world.attributes.push(newAttribute);
});

const mockUpdateAttribute = jest.fn((worldId: string, attributeId: string, updates: Partial<WorldAttribute>) => {
  if (!mockState.worlds[worldId]) {
    mockState.error = createError('World not found', { type: ErrorType.VALIDATION });
    return;
  }
  const world = mockState.worlds[worldId];
  const attr = world.attributes.find((a: WorldAttribute) => a.id === attributeId);
  if (attr) {
    Object.assign(attr, updates);
  }
  syncWorldToEntities(worldId);
});

const mockRemoveAttribute = jest.fn((worldId: string, attributeId: string) => {
  if (!mockState.worlds[worldId]) {
    mockState.error = createError('World not found', { type: ErrorType.VALIDATION });
    return;
  }
  const world = mockState.worlds[worldId];
  world.attributes = world.attributes.filter((a: WorldAttribute) => a.id !== attributeId);
  syncWorldToEntities(worldId);
});

const mockAddSkill = jest.fn((worldId: string, skill: Partial<WorldSkill>) => {
  if (!mockState.worlds[worldId]) {
    mockState.error = createError('World not found', { type: ErrorType.VALIDATION });
    return;
  }
  const world = mockState.worlds[worldId];
  if (world.skills.length >= (world.settings?.maxSkills || 10)) {
    mockState.error = createError('Maximum skills limit reached', { type: ErrorType.VALIDATION });
    return;
  }
  const newSkill: WorldSkill = {
    id: `skill-${Date.now()}`,
    worldId,
    name: skill.name || '',
    description: skill.description || '',
    difficulty: skill.difficulty || 'medium',
    category: skill.category,
    attributeIds: skill.attributeIds,
    baseValue: skill.baseValue || 5,
    minValue: skill.minValue || 1,
    maxValue: skill.maxValue || 10
  };
  world.skills.push(newSkill);
});

const mockUpdateSkill = jest.fn((worldId: string, skillId: string, updates: Partial<WorldSkill>) => {
  if (!mockState.worlds[worldId]) {
    mockState.error = createError('World not found', { type: ErrorType.VALIDATION });
    return;
  }
  const world = mockState.worlds[worldId];
  const skill = world.skills.find((s: WorldSkill) => s.id === skillId);
  if (skill) {
    Object.assign(skill, updates);
  }
  syncWorldToEntities(worldId);
});

const mockRemoveSkill = jest.fn((worldId: string, skillId: string) => {
  if (!mockState.worlds[worldId]) {
    mockState.error = createError('World not found', { type: ErrorType.VALIDATION });
    return;
  }
  const world = mockState.worlds[worldId];
  world.skills = world.skills.filter((s: WorldSkill) => s.id !== skillId);
  syncWorldToEntities(worldId);
});

const mockUpdateSettings = jest.fn((worldId: string, settings: Partial<WorldSettings>) => {
  if (!mockState.worlds[worldId]) {
    mockState.error = createError('World not found', { type: ErrorType.VALIDATION });
    return;
  }
  mockState.worlds[worldId].settings = {
    ...mockState.worlds[worldId].settings,
    ...settings
  };
  syncWorldToEntities(worldId);
});

const mockUpdateToneSettings = jest.fn((worldId: string, toneSettings: Partial<import('@/types/tone-settings.types').ToneSettings>) => {
  if (!mockState.worlds[worldId]) {
    mockState.error = createError('World not found', { type: ErrorType.VALIDATION });
    return;
  }
  const currentToneSettings = mockState.worlds[worldId].toneSettings || {
    contentRating: 'PG',
    narrativeStyle: 'balanced',
    languageComplexity: 'moderate'
  };
  mockState.worlds[worldId] = {
    ...mockState.worlds[worldId],
    toneSettings: {
      ...currentToneSettings,
      ...toneSettings
    },
    updatedAt: getTimestamp()
  };
  syncWorldToEntities(worldId);
});

const mockGetWorldById = jest.fn((worldId: string) => {
  return mockState.worlds[worldId] || null;
});

const mockCreate = jest.fn((data: Partial<World>) => mockCreateWorld(data));
const mockUpdate = jest.fn((id: string, updates: Partial<World>) => mockUpdateWorld(id, updates));
const mockDelete = jest.fn((id: string) => mockDeleteWorld(id));
const mockSetCurrent = jest.fn((id: string | null) => mockSetCurrentWorld(id));
const mockGetById = jest.fn((id: string) => mockGetWorldById(id));
const mockGetAll = jest.fn(() => Object.values(mockState.worlds));

const mockReset = jest.fn(() => {
  mockState = {
    worlds: {},
    entities: {},
    worldStates: {},
    currentWorldId: null,
    currentEntityId: null,
    error: null,
    loading: false
  };
});

const mockSetError = jest.fn((error: UserFriendlyError | string | null) => {
  if (typeof error === 'string') {
    mockState.error = createError(error);
  } else {
    mockState.error = error;
  }
});

const mockClearError = jest.fn(() => {
  mockState.error = null;
});

const mockSetLoading = jest.fn((loading: boolean) => {
  mockState.loading = loading;
});

const mockFetchWorlds = jest.fn(() => Promise.resolve());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockWorldStore = jest.fn((selector?: (state: WorldStore) => any) => {
  const state: WorldStore = {
    ...mockState,
    worldStates: mockState.worldStates,
    createWorld: mockCreateWorld,
    updateWorld: mockUpdateWorld,
    deleteWorld: mockDeleteWorld,
    setCurrentWorld: mockSetCurrentWorld,
    fetchWorlds: mockFetchWorlds,
    addAttribute: mockAddAttribute,
    updateAttribute: mockUpdateAttribute,
    removeAttribute: mockRemoveAttribute,
    addSkill: mockAddSkill,
    updateSkill: mockUpdateSkill,
    removeSkill: mockRemoveSkill,
    updateSettings: mockUpdateSettings,
    updateToneSettings: mockUpdateToneSettings,
    getWorldById: mockGetWorldById,
    initializeWorldState: mockInitializeWorldState,
    updateWorldState: mockUpdateWorldState,
    mergeWorldState: mockMergeWorldState,
    getWorldState: mockGetWorldState,
    getRawWorldState: mockGetRawWorldState,
    reset: mockReset,
    setError: mockSetError,
    clearError: mockClearError,
    setLoading: mockSetLoading,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete,
    setCurrent: mockSetCurrent,
    getById: mockGetById,
    getAll: mockGetAll,
  };

  // If no selector is provided, return the entire state (like useStore() with no selector)
  if (!selector || typeof selector !== 'function') {
    return state;
  }

  return selector(state);
});

// Add mock for static methods
const mockGetState = jest.fn((): WorldStore => {
  const state: WorldStore = {
    ...mockState,
    worldStates: mockState.worldStates,
    createWorld: mockCreateWorld,
    updateWorld: mockUpdateWorld,
    deleteWorld: mockDeleteWorld,
    setCurrentWorld: mockSetCurrentWorld,
    fetchWorlds: mockFetchWorlds,
    addAttribute: mockAddAttribute,
    updateAttribute: mockUpdateAttribute,
    removeAttribute: mockRemoveAttribute,
    addSkill: mockAddSkill,
    updateSkill: mockUpdateSkill,
    removeSkill: mockRemoveSkill,
    updateSettings: mockUpdateSettings,
    updateToneSettings: mockUpdateToneSettings,
    getWorldById: mockGetWorldById,
    initializeWorldState: mockInitializeWorldState,
    updateWorldState: mockUpdateWorldState,
    mergeWorldState: mockMergeWorldState,
    getWorldState: mockGetWorldState,
    getRawWorldState: mockGetRawWorldState,
    reset: mockReset,
    setError: mockSetError,
    clearError: mockClearError,
    setLoading: mockSetLoading,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete,
    setCurrent: mockSetCurrent,
    getById: mockGetById,
    getAll: mockGetAll,
  };

  return state;
});

// Export the mock function with the mock methods attached
export const worldStore = Object.assign(mockWorldStore, {
  __mockCreateWorld: mockCreateWorld,
  __resetMocks: () => {
    mockCreateWorld.mockClear();
    mockWorldStore.mockClear();
    mockGetState.mockClear();
    mockUpdateWorld.mockClear();
    mockDeleteWorld.mockClear();
    mockSetCurrentWorld.mockClear();
    mockAddAttribute.mockClear();
    mockUpdateAttribute.mockClear();
    mockRemoveAttribute.mockClear();
    mockAddSkill.mockClear();
    mockUpdateSkill.mockClear();
    mockRemoveSkill.mockClear();
    mockUpdateSettings.mockClear();
    mockReset.mockClear();
    mockSetError.mockClear();
    mockClearError.mockClear();
    mockSetLoading.mockClear();
    mockFetchWorlds.mockClear();
    mockCreate.mockClear();
    mockUpdate.mockClear();
    mockDelete.mockClear();
    mockSetCurrent.mockClear();
    mockGetById.mockClear();
    mockGetAll.mockClear();
    // Reset the mock state
    mockState = {
      worlds: {},
      entities: {},
      worldStates: {},
      currentWorldId: null,
      currentEntityId: null,
      error: null,
      loading: false
    };
  },
  getState: mockGetState,
});

export const useWorldStore = worldStore;
