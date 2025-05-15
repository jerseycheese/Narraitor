// Mock the persistence module first before any imports
jest.mock('../../persistence', () => {
  // Define a proper type for the storage object
  interface MockStorage {
    getItem: jest.Mock;
    setItem: jest.Mock;
    removeItem: jest.Mock;
  }
  
  const createMockStorage = () => {
    const storage: MockStorage = {
      getItem: jest.fn().mockResolvedValue(null),
      setItem: jest.fn().mockImplementation((key, value) => {
        // Ensure the value is properly stringified for assertions
        if (typeof value !== 'string' && value !== null) {
          const callIndex = storage.setItem.mock.calls.length - 1;
          storage.setItem.mock.calls[callIndex][1] = JSON.stringify(value);
        }
        return Promise.resolve();
      }),
      removeItem: jest.fn().mockResolvedValue(undefined)
    };
    
    // Store reference globally for tests
    if (typeof global !== 'undefined') {
      (global as { __testMockStorage?: MockStorage }).__testMockStorage = storage;
    }
    
    return storage;
  };
  
  return {
    createIndexedDBStorage: createMockStorage
  };
});

// Don't mock the stores - we want to test the real ones
jest.unmock('../../worldStore');
jest.unmock('../../characterStore');

import { worldStore } from '../../worldStore';
import { characterStore } from '../../characterStore';

// Mock indexedDB
const mockIndexedDB = {
  deleteDatabase: jest.fn(),
  open: jest.fn()
};

describe('Persistence Integration - MVP', () => {
  let mockStorage: {
    getItem: jest.Mock;
    setItem: jest.Mock;
    removeItem: jest.Mock;
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Get the mock storage
    mockStorage = (global as { __testMockStorage?: typeof mockStorage }).__testMockStorage as typeof mockStorage;
    
    // Reset mock functions
    if (mockStorage) {
      mockStorage.getItem.mockClear();
      mockStorage.setItem.mockClear();
      mockStorage.removeItem.mockClear();
      mockStorage.getItem.mockResolvedValue(null);
    }
    
    // Reset stores using their reset methods
    worldStore.getState().reset();
    characterStore.getState().reset();
    
    // Mock global indexedDB
    (global as { indexedDB?: typeof mockIndexedDB }).indexedDB = mockIndexedDB;
  });

  afterEach(() => {
    delete (global as { indexedDB?: typeof mockIndexedDB }).indexedDB;
  });

  describe('basic persistence functionality', () => {
    test('should persist character store data', async () => {
      // Give the store time to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear the mock after initialization
      mockStorage.setItem.mockClear();
      
      // Create a character using the actual store
      const characterId = characterStore.getState().createCharacter({
        name: 'Test Character',
        worldId: 'test-world-1',
        level: 1,
        attributes: [],
        skills: [],
        background: {
          description: 'A test character',
          personality: 'Bold',
          motivation: 'Adventure'
        },
        isPlayer: true,
        status: { hp: 100, mp: 50, stamina: 100 }
      });

      // Wait for persist middleware
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if character was persisted
      const characterPersisted = mockStorage.setItem.mock.calls.some(
        call => call[0] === 'narraitor-character-store' && call[1].includes(characterId)
      );
      
      expect(characterPersisted).toBe(true);
    });

    test('should maintain data relationships between stores', async () => {
      // Give the stores time to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear the mock after initialization
      mockStorage.setItem.mockClear();
      
      // Create a world
      const worldId = worldStore.getState().createWorld({
        name: 'Reference World',
        theme: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      });

      // Create a character referencing the world
      const characterId = characterStore.getState().createCharacter({
        name: 'Reference Character',
        worldId: worldId,
        level: 1,
        attributes: [],
        skills: [],
        background: {
          description: 'A test character',
          personality: 'Bold',
          motivation: 'Adventure'
        },
        isPlayer: true,
        status: { hp: 100, mp: 50, stamina: 100 }
      });

      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if the character was persisted with the correct world reference
      const characterStoreCall = mockStorage.setItem.mock.calls.find(
        call => call[0] === 'narraitor-character-store' && 
        call[1].includes(characterId)
      );

      expect(characterStoreCall).toBeDefined();
      
      if (characterStoreCall) {
        const characterData = JSON.parse(characterStoreCall[1]);
        const character = characterData.state.characters[characterId];
        expect(character.worldId).toBe(worldId);
      }
    });
  });

  describe('error handling and fallback', () => {
    test('should work without IndexedDB', async () => {
      // Remove IndexedDB
      delete (global as { indexedDB?: typeof mockIndexedDB }).indexedDB;

      // Stores should still function without persistence
      const worldId = worldStore.getState().createWorld({
        name: 'Fallback World',
        theme: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      });

      expect(worldId).toBeDefined();
      
      // State should work in memory
      const state = worldStore.getState();
      expect(state.worlds[worldId]).toBeDefined();
    });

    test('should handle persistence errors gracefully', async () => {
      // Simulate persistence errors
      const error = new DOMException('SecurityError');
      mockStorage.getItem.mockRejectedValue(error);
      mockStorage.setItem.mockRejectedValue(error);

      // Store should still function despite errors
      const worldId = worldStore.getState().createWorld({
        name: 'Error Test World',
        theme: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      });

      expect(worldId).toBeDefined();
      
      // Verify store attempted to persist
      await new Promise(resolve => setTimeout(resolve, 500));
      expect(mockStorage.setItem).toHaveBeenCalled();
    });
  });
});
