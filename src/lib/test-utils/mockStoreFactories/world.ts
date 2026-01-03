import type { WorldStore } from '@/state/worldStore';

export function createMockWorldStore(
  overrides?: Partial<WorldStore>
): WorldStore {
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
