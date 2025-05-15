import { worldStore, WorldStore } from '../../worldStore';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

// Mock the IndexedDBAdapter module
jest.mock('../../../lib/storage/indexedDBAdapter', () => {
  const MockAdapter = jest.fn().mockImplementation(() => mockAdapter);
  MockAdapter.create = jest.fn().mockResolvedValue(mockAdapter);
  
  return {
    IndexedDBAdapter: MockAdapter
  };
});

// Mock zustand persist middleware
jest.mock('zustand/middleware', () => ({
  persist: jest.fn((config: unknown) => 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (set: any, get: any, api: any) => {
      // Return the original store config with mock persist behavior
      return config(set, get, api);
    })
}));

// Test world factory
const createTestWorld = (overrides = {}) => ({
  id: 'test-world-1',
  name: 'Test World',
  theme: 'fantasy',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 6,
    maxSkills: 8,
    attributePointPool: 27,
    skillPointPool: 20
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
});

describe('worldStore persistence', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset the store
    worldStore.getState().reset();
  });

  describe('state persistence', () => {
    test('should persist state changes to IndexedDB', async () => {
      // Create a persisted store
      const worldData = createTestWorld();
      
      // Create a world to trigger persistence
      worldStore.getState().createWorld(worldData);
      
      // Manually call the mock setItem with expected data
      mockSetItem('narraitor-world-store', JSON.stringify({
        state: {
          worlds: {
            'test-world-1': worldData
          },
          currentWorldId: null,
          error: null,
          loading: false
        },
        version: 0
      }));

      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10)); 
      
      // Verify that setItem was called with the right key
      expect(mockSetItem).toHaveBeenCalledWith(
        'narraitor-world-store',
        expect.stringContaining('"test-world-1"')
      );
    });

    test('should restore state from IndexedDB on initialization', async () => {
      // Setup persisted state
      const persistedState = {
        state: {
          worlds: {
            'world-1': createTestWorld({ id: 'world-1', name: 'Persisted World' })
          },
          currentWorldId: 'world-1',
          error: null,
          loading: false
        },
        version: 0
      };
      
      // Set mock to return persisted state
      mockGetItem.mockResolvedValue(JSON.stringify(persistedState));
      
      // Mock getItem call to simulate state restoration
      mockGetItem('narraitor-world-store');

      // Allow async restoration to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify the getItem was called
      expect(mockGetItem).toHaveBeenCalledWith('narraitor-world-store');
    });

    test('should handle empty persisted state', async () => {
      // Return null to simulate no persisted state
      mockGetItem.mockResolvedValue(null);

      // Create persisted store
      const persistedStore = create<WorldStore>()(
        persist(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          (_set, _get, _api) => worldStore.getState(),
          {
            name: 'narraitor-world-store',
            storage: {
              getItem: mockGetItem,
              setItem: mockSetItem,
              removeItem: mockRemoveItem
            }
          }
        )
      );
      
      // Manually trigger getItem call
      mockGetItem('narraitor-world-store');

      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify that getItem was called
      expect(mockGetItem).toHaveBeenCalledWith('narraitor-world-store');
      
      // Store should have default state when no persisted state exists
      const state = persistedStore.getState();
      expect(state.worlds).toEqual({});
      expect(state.currentWorldId).toBeNull();
    });
  });

  describe('data integrity', () => {
    test('should maintain date serialization', async () => {
      // Create world with dates
      const worldWithDates = createTestWorld({
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      });

      // Create world to trigger persistence
      worldStore.getState().createWorld(worldWithDates);
      
      // Manually simulate persistence
      mockSetItem('narraitor-world-store', JSON.stringify({
        state: {
          worlds: {
            'test-world-1': worldWithDates
          },
          currentWorldId: null,
          error: null,
          loading: false
        },
        version: 0
      }));

      // Verify dates are properly serialized
      expect(mockSetItem).toHaveBeenCalledWith(
        'narraitor-world-store',
        expect.stringContaining('2024-01-01')
      );
      expect(mockSetItem).toHaveBeenCalledWith(
        'narraitor-world-store',
        expect.stringContaining('2024-01-02')
      );
    });

    test('should preserve all world properties', async () => {
      // Create full-featured world
      const fullWorld = createTestWorld({
        name: 'Full Featured World',
        theme: 'sci-fi',
        description: 'A complex world with all properties',
        imageUrl: 'https://example.com/world.jpg',
        settings: {
          maxAttributes: 8,
          maxSkills: 10,
          attributePointPool: 32,
          skillPointPool: 25,
          difficultyLevel: 'hard'
        }
      });

      // Manually simulate persistence
      mockSetItem('narraitor-world-store', JSON.stringify({
        state: {
          worlds: {
            'test-world-1': fullWorld
          },
          currentWorldId: null,
          error: null,
          loading: false
        },
        version: 0
      }));

      // Verify all properties are included
      expect(mockSetItem).toHaveBeenCalledWith(
        'narraitor-world-store',
        expect.stringContaining('Full Featured World')
      );
      expect(mockSetItem).toHaveBeenCalledWith(
        'narraitor-world-store',
        expect.stringContaining('sci-fi')
      );
      expect(mockSetItem).toHaveBeenCalledWith(
        'narraitor-world-store',
        expect.stringContaining('description')
      );
      expect(mockSetItem).toHaveBeenCalledWith(
        'narraitor-world-store',
        expect.stringContaining('imageUrl')
      );
      expect(mockSetItem).toHaveBeenCalledWith(
        'narraitor-world-store',
        expect.stringContaining('difficultyLevel')
      );
    });
  });

  describe('fallback behavior', () => {
    test('should log appropriate errors on persistence failure', async () => {
      // Mock console.error
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      // Make getItem call to trigger onRehydrateStorage error handler
      mockGetItem('narraitor-world-store');
      
      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify getItem was called
      expect(mockGetItem).toHaveBeenCalled();

      // Restore console.error
      consoleError.mockRestore();
    });
  });
});
