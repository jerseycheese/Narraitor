import type { CharacterStore } from '@/state/characterStore';

export function createMockCharacterStore(
  overrides?: Partial<CharacterStore>
): CharacterStore {
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
