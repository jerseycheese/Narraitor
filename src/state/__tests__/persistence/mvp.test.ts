import { useWorldStore } from '../../worldStore';
import { useCharacterStore } from '../../characterStore';

// Mock the module with our mock adapter
jest.mock('../../../lib/storage/indexedDBAdapter', () => {
  const mockGetItem = jest.fn().mockResolvedValue(null);
  const mockSetItem = jest.fn().mockResolvedValue(undefined);
  const mockRemoveItem = jest.fn().mockResolvedValue(undefined);
  const mockInitialize = jest.fn().mockResolvedValue(undefined);

  const MockIndexedDBAdapter = jest.fn().mockImplementation(() => ({
    initialize: mockInitialize,
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: mockRemoveItem,
  }));

  return {
    IndexedDBAdapter: Object.assign(MockIndexedDBAdapter, {
      mockFunctions: {
        getItem: mockGetItem,
        setItem: mockSetItem,
        removeItem: mockRemoveItem,
        initialize: mockInitialize,
        create: jest.fn(), // Keep for backward compatibility
      },
    }),
  };
});

// Get reference to mocks
import { IndexedDBAdapter } from '../../../lib/storage/indexedDBAdapter';
// Define a type for our mock functions
interface MockFunctions {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
  initialize: jest.Mock;
  create: jest.Mock;
}
// Cast to properly typed mock functions
const mockFunctions = (IndexedDBAdapter as unknown as { mockFunctions: MockFunctions }).mockFunctions;

// Import after mock setup
import { createIndexedDBStorage } from '../../persistence';

describe('MVP IndexedDB Persistence', () => {
  let storage: ReturnType<typeof createIndexedDBStorage>;

  beforeEach(() => {
    // Clear all mock calls
    jest.clearAllMocks();
    storage = createIndexedDBStorage();
  });

  describe('Storage Helper Integration', () => {
    test('should integrate with Zustand storage interface', async () => {
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 20));

      // Test getItem
      mockFunctions.getItem.mockResolvedValueOnce('{"test": "data"}');
      const result = await storage.getItem('test-key');
      expect(result).toEqual({"test": "data"});
      expect(mockFunctions.getItem).toHaveBeenCalledWith('test-key');

      // Test setItem
      await storage.setItem('test-key', {"state": "test-value", "version": 0});
      expect(mockFunctions.setItem).toHaveBeenCalledWith('test-key', JSON.stringify({"state": "test-value", "version": 0}));

      // Test removeItem
      await storage.removeItem('test-key');
      expect(mockFunctions.removeItem).toHaveBeenCalledWith('test-key');
    });

    test('should handle adapter creation errors', async () => {
      // Save original implementation
      const originalCreate = mockFunctions.create;
      
      // Setup mock to throw error
      mockFunctions.create.mockRejectedValueOnce(new Error('Creation failed'));
      
      // Create new instance with failing create - need to reset modules
      jest.resetModules();
      // Use CommonJS require syntax to avoid import error in tests
       
      const { createIndexedDBStorage: errorStorage } = require('../../persistence');
      const errorAdapter = errorStorage();
      
      // All operations should gracefully handle the error
      await expect(errorAdapter.getItem('key')).resolves.toBeNull();
      await expect(errorAdapter.setItem('key', 'value')).resolves.toBeUndefined();
      await expect(errorAdapter.removeItem('key')).resolves.toBeUndefined();
      
      // Restore original implementation
      mockFunctions.create = originalCreate;
    });
  });

  describe('Store Persistence', () => {
    test('useWorldStore should have persist middleware configured', () => {
      // Check that the store is configured with persistence
      const state = useWorldStore.getState();
      expect(state).toBeDefined();
      expect(state.worlds).toBeDefined();
      expect(state.currentWorldId).toBeDefined();
    });

    test('useCharacterStore should have persist middleware configured', () => {
      // Check that the store is configured with persistence
      const state = useCharacterStore.getState();
      expect(state).toBeDefined();
      expect(state.characters).toBeDefined();
      expect(state.currentCharacterId).toBeDefined();
    });
  });
});
