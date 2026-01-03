import type { NPCStore } from '@/state/npcStore';

export function createMockNPCStore(
  overrides?: Partial<NPCStore>
): NPCStore {
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
