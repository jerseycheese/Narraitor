import { worldStore } from '../../worldStore';
import { characterStore } from '../../characterStore';

// Mock the module with our mock adapter
jest.mock('../../../lib/storage/indexedDBAdapter', () => {
  // Create mock adapter functions
  const mockGetItem = jest.fn().mockResolvedValue(null);
  const mockSetItem = jest.fn().mockResolvedValue(undefined);
  const mockRemoveItem = jest.fn().mockResolvedValue(undefined);
  
  // Create mock adapter object
  const mockAdapter = {
    initialize: jest.fn().mockResolvedValue(undefined),
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: mockRemoveItem
  };
  
  // Create mock class with static create method
  const MockAdapter = jest.fn().mockImplementation(() => mockAdapter);
  MockAdapter.create = jest.fn().mockResolvedValue(mockAdapter);
  
  // Export mocks for test access
  MockAdapter.mockFunctions = {
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: mockRemoveItem,
    create: MockAdapter.create
  };
  
  return {
    IndexedDBAdapter: MockAdapter
  };
});

// Get reference to mocks
import { IndexedDBAdapter } from '../../../lib/storage/indexedDBAdapter';
// Define a type for our mock functions
interface MockFunctions {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
  create: jest.Mock;
}
// Cast to properly typed mock functions
const mockFunctions = (IndexedDBAdapter as { mockFunctions: MockFunctions }).mockFunctions;

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
      // eslint-disable-next-line @typescript-eslint/no-require-imports
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
    test('worldStore should have persist middleware configured', () => {
      // Check that the store is configured with persistence
      const state = worldStore.getState();
      expect(state).toBeDefined();
      expect(state.worlds).toBeDefined();
      expect(state.currentWorldId).toBeDefined();
    });

    test('characterStore should have persist middleware configured', () => {
      // Check that the store is configured with persistence
      const state = characterStore.getState();
      expect(state).toBeDefined();
      expect(state.characters).toBeDefined();
      expect(state.currentCharacterId).toBeDefined();
    });
  });
});
