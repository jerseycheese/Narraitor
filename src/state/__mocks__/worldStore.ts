// Mock for the worldStore module
console.log('[__mocks__/worldStore.ts] Mock module loading');

import { World, WorldAttribute, WorldSkill, WorldSettings } from '@/types/world.types';

interface MockWorldState {
  worlds: Record<string, World>;
  currentWorldId: string | null;
  error: string | null;
  loading: boolean;
}

// Simulated store state
let mockState: MockWorldState = {
  worlds: {},
  currentWorldId: null,
  error: null,
  loading: false
};

const mockCreateWorld = jest.fn((worldData: Partial<World>): string => {
  console.log('[__mocks__/worldStore.ts] mockCreateWorld called with:', JSON.stringify(worldData, null, 2));
  console.log('[__mocks__/worldStore.ts] Checking validation - name is:', worldData.name ? `"${worldData.name}"` : 'empty/null');
  
  // Validate required fields - THROW on validation failure
  if (!worldData.name || worldData.name.trim() === '') {
    console.log('[__mocks__/worldStore.ts] VALIDATION FAILURE: World name is required!');
    console.log('[__mocks__/worldStore.ts] Throwing exception...');
    throw new Error('World name is required');
  }
  
  // Actually create the world in our mock state
  const worldId = 'mock-world-id';
  const newWorld: World = {
    id: worldId,
    name: worldData.name,
    description: worldData.description || '',
    theme: worldData.theme || '',
    attributes: worldData.attributes || [],
    skills: worldData.skills || [],
    settings: worldData.settings || {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 20,
      skillPointPool: 20
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockState.worlds[worldId] = newWorld;
  console.log('[__mocks__/worldStore.ts] Created world in mock state:', mockState.worlds[worldId]);
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
  reset: jest.Mock;
  setError: jest.Mock;
  clearError: jest.Mock;
  setLoading: jest.Mock;
  getWorldById: jest.Mock;
}

type WorldStore = MockWorldState & WorldStoreActions;

// Create mock actions that mutate the shared state
const mockUpdateWorld = jest.fn((worldId: string, updates: Partial<World>) => {
  console.log('[__mocks__/worldStore.ts] updateWorld called:', worldId, updates);
  if (!mockState.worlds[worldId]) {
    mockState.error = 'World not found';
    return;
  }
  mockState.worlds[worldId] = {
    ...mockState.worlds[worldId],
    ...updates,
    updatedAt: new Date().toISOString()
  };
});

const mockDeleteWorld = jest.fn((worldId: string) => {
  console.log('[__mocks__/worldStore.ts] deleteWorld called:', worldId);
  if (mockState.currentWorldId === worldId) {
    mockState.currentWorldId = null;
  }
  delete mockState.worlds[worldId];
});

const mockSetCurrentWorld = jest.fn((worldId: string | null) => {
  console.log('[__mocks__/worldStore.ts] setCurrentWorld called:', worldId);
  if (worldId && !mockState.worlds[worldId]) {
    mockState.error = 'World not found';
    return;
  }
  mockState.currentWorldId = worldId;
});

const mockAddAttribute = jest.fn((worldId: string, attribute: Partial<WorldAttribute>) => {
  console.log('[__mocks__/worldStore.ts] addAttribute called:', worldId, attribute);
  if (!mockState.worlds[worldId]) {
    mockState.error = 'World not found';
    return;
  }
  const world = mockState.worlds[worldId];
  if (world.attributes.length >= (world.settings?.maxAttributes || 10)) {
    console.log('[__mocks__/worldStore.ts] LIMIT REACHED - setting error "Maximum attributes limit reached"');
    mockState.error = 'Maximum attributes limit reached';
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
  console.log('[__mocks__/worldStore.ts] updateAttribute called:', worldId, attributeId, updates);
  if (!mockState.worlds[worldId]) {
    mockState.error = 'World not found';
    return;
  }
  const world = mockState.worlds[worldId];
  const attr = world.attributes.find((a: WorldAttribute) => a.id === attributeId);
  if (attr) {
    Object.assign(attr, updates);
  }
});

const mockRemoveAttribute = jest.fn((worldId: string, attributeId: string) => {
  console.log('[__mocks__/worldStore.ts] removeAttribute called:', worldId, attributeId);
  if (!mockState.worlds[worldId]) {
    mockState.error = 'World not found';
    return;
  }
  const world = mockState.worlds[worldId];
  world.attributes = world.attributes.filter((a: WorldAttribute) => a.id !== attributeId);
});

const mockAddSkill = jest.fn((worldId: string, skill: Partial<WorldSkill>) => {
  console.log('[__mocks__/worldStore.ts] addSkill called:', worldId, skill);
  if (!mockState.worlds[worldId]) {
    mockState.error = 'World not found';
    return;
  }
  const world = mockState.worlds[worldId];
  if (world.skills.length >= (world.settings?.maxSkills || 10)) {
    console.log('[__mocks__/worldStore.ts] LIMIT REACHED - setting error "Maximum skills limit reached"');
    mockState.error = 'Maximum skills limit reached';
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
  console.log('[__mocks__/worldStore.ts] updateSkill called:', worldId, skillId, updates);
  if (!mockState.worlds[worldId]) {
    mockState.error = 'World not found';
    return;
  }
  const world = mockState.worlds[worldId];
  const skill = world.skills.find((s: WorldSkill) => s.id === skillId);
  if (skill) {
    Object.assign(skill, updates);
  }
});

const mockRemoveSkill = jest.fn((worldId: string, skillId: string) => {
  console.log('[__mocks__/worldStore.ts] removeSkill called:', worldId, skillId);
  if (!mockState.worlds[worldId]) {
    mockState.error = 'World not found';
    return;
  }
  const world = mockState.worlds[worldId];
  world.skills = world.skills.filter((s: WorldSkill) => s.id !== skillId);
});

const mockUpdateSettings = jest.fn((worldId: string, settings: Partial<WorldSettings>) => {
  console.log('[__mocks__/worldStore.ts] updateSettings called:', worldId, settings);
  if (!mockState.worlds[worldId]) {
    mockState.error = 'World not found';
    return;
  }
  mockState.worlds[worldId].settings = {
    ...mockState.worlds[worldId].settings,
    ...settings
  };
});

const mockGetWorldById = jest.fn((worldId: string) => {
  console.log('[__mocks__/worldStore.ts] getWorldById called:', worldId);
  return mockState.worlds[worldId] || null;
});

const mockReset = jest.fn(() => {
  console.log('[__mocks__/worldStore.ts] reset called');
  mockState = {
    worlds: {},
    currentWorldId: null,
    error: null,
    loading: false
  };
});

const mockSetError = jest.fn((error: string | null) => {
  console.log('[__mocks__/worldStore.ts] setError called:', error);
  mockState.error = error;
});

const mockClearError = jest.fn(() => {
  console.log('[__mocks__/worldStore.ts] clearError called');
  mockState.error = null;
});

const mockSetLoading = jest.fn((loading: boolean) => {
  console.log('[__mocks__/worldStore.ts] setLoading called:', loading);
  mockState.loading = loading;
});

const mockFetchWorlds = jest.fn(() => Promise.resolve());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockWorldStore = jest.fn((selector?: (state: WorldStore) => any) => {
  console.log('[__mocks__/worldStore.ts] worldStore mock called with selector type:', typeof selector);
  
  const state: WorldStore = {
    ...mockState,
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
    getWorldById: mockGetWorldById,
    reset: mockReset,
    setError: mockSetError,
    clearError: mockClearError,
    setLoading: mockSetLoading,
  };
  
  // If no selector is provided, return the entire state (like useStore() with no selector)
  if (!selector || typeof selector !== 'function') {
    console.log('[__mocks__/worldStore.ts] No selector provided, returning full state');
    return state;
  }
  
  const result = selector(state);
  console.log('[__mocks__/worldStore.ts] Selector returned:', result);
  return result;
});

// Add mock for static methods
const mockGetState = jest.fn((): WorldStore => {
  console.log('[__mocks__/worldStore.ts] getState called');
  
  const state: WorldStore = {
    ...mockState,
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
    getWorldById: mockGetWorldById,
    reset: mockReset,
    setError: mockSetError,
    clearError: mockClearError,
    setLoading: mockSetLoading,
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
    // Reset the mock state
    mockState = {
      worlds: {},
      currentWorldId: null,
      error: null,
      loading: false
    };
  },
  getState: mockGetState,
});

export const useWorldStore = worldStore;

console.log('[__mocks__/worldStore.ts] Mock module exported');
console.log('[__mocks__/worldStore.ts] worldStore has getState:', typeof worldStore.getState);
