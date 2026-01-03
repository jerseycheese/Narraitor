import type { InventoryStore } from './types';

export function createMockInventoryStore(
  overrides?: Partial<InventoryStore>
): InventoryStore {
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
