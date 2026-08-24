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
      removeItem: jest.fn().mockResolvedValue(undefined),
    };

    // Store reference globally for tests
    if (typeof global !== 'undefined') {
      (global as { __testMockStorage?: MockStorage }).__testMockStorage =
        storage;
    }

    return storage;
  };

  return {
    createIndexedDBStorage: createMockStorage,
  };
});

// Don't mock the stores - we want to test the real ones
jest.unmock('../../worldStore');
jest.unmock('../../characterStore');

import { useWorldStore } from '../../worldStore';
import { useCharacterStore } from '../../characterStore';

// Mock indexedDB
const mockIndexedDB = {
  deleteDatabase: jest.fn(),
  open: jest.fn(),
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
    mockStorage = (global as { __testMockStorage?: typeof mockStorage })
      .__testMockStorage as typeof mockStorage;

    // Reset mock functions
    if (mockStorage) {
      mockStorage.getItem.mockClear();
      mockStorage.setItem.mockClear();
      mockStorage.removeItem.mockClear();
      mockStorage.getItem.mockResolvedValue(null);
    }

    // Reset stores using their reset methods
    useWorldStore.getState().reset();
    useCharacterStore.getState().reset();

    // Mock global indexedDB
    (global as unknown as { indexedDB?: typeof mockIndexedDB }).indexedDB =
      mockIndexedDB;
  });

  afterEach(() => {
    delete (global as unknown as { indexedDB?: typeof mockIndexedDB })
      .indexedDB;
  });

  describe('basic persistence functionality', () => {
    test('should persist character store data', async () => {
      // Use Jest's fake timers
      jest.useFakeTimers();

      // Clear the mock after initialization
      mockStorage.setItem.mockClear();

      // Create a character using the actual store
      const characterId = useCharacterStore.getState().createCharacter({
        name: 'Test Character',
        description: 'A test character for persistence testing',
        worldId: 'test-world-1',
        level: 1,
        attributes: [],
        skills: [],
        derivedStats: [],
        background: {
          history: 'A test character',
          personality: 'Bold',
          goals: ['Adventure'],
          fears: [],
          relationships: [],
        },
        isPlayer: true,
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: [],
          itemOrder: [],
        },
        status: {
          conditions: [],
        },
      });

      // Advance timers and flush promises
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // Check if character was persisted
      const characterPersisted = mockStorage.setItem.mock.calls.some(
        (call) =>
          call[0] === 'narraitor-character-store' &&
          call[1].includes(characterId)
      );

      expect(characterPersisted).toBe(true);

      // Clean up
      jest.useRealTimers();
    }, 10000);

    test('should maintain data relationships between stores', async () => {
      // Use Jest's fake timers
      jest.useFakeTimers();

      // Clear the mock after initialization
      mockStorage.setItem.mockClear();

      // Create a world
      const worldId = useWorldStore.getState().createWorld({
        name: 'Reference World',
        description: 'A test world for persistence testing',
        genre: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20,
        },
      });

      // Create a character referencing the world
      const characterId = useCharacterStore.getState().createCharacter({
        name: 'Reference Character',
        description: 'A test character for persistence testing',
        worldId: worldId,
        level: 1,
        attributes: [],
        skills: [],
        derivedStats: [],
        background: {
          history: 'A test character',
          personality: 'Bold',
          goals: ['Adventure'],
          fears: [],
          relationships: [],
        },
        isPlayer: true,
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: [],
          itemOrder: [],
        },
        status: {
          conditions: [],
        },
      });

      // Advance timers and flush promises
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // Check if the character was persisted with the correct world reference
      const useCharacterStoreCall = mockStorage.setItem.mock.calls.find(
        (call) =>
          call[0] === 'narraitor-character-store' &&
          call[1].includes(characterId)
      );

      expect(useCharacterStoreCall).toBeDefined();

      if (useCharacterStoreCall) {
        const characterData = JSON.parse(useCharacterStoreCall[1]);
        const character = characterData.state.characters[characterId];
        expect(character.worldId).toBe(worldId);
      }

      // Clean up
      jest.useRealTimers();
    }, 10000);
  });

  describe('error handling and fallback', () => {
    test('should work without IndexedDB', async () => {
      // Remove IndexedDB
      delete (global as unknown as { indexedDB?: typeof mockIndexedDB })
        .indexedDB;

      // Stores should still function without persistence
      const worldId = useWorldStore.getState().createWorld({
        name: 'Fallback World',
        description: 'A test world for persistence testing',
        genre: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20,
        },
      });

      expect(worldId).toBeDefined();

      // State should work in memory, with the world intact rather than merely present.
      const stored = useWorldStore.getState().worlds[worldId];
      expect(stored).toMatchObject({
        id: worldId,
        name: 'Fallback World',
        genre: 'fantasy',
      });
    });

    test('should handle persistence errors gracefully', async () => {
      // Use Jest's fake timers
      jest.useFakeTimers();

      // Simulate persistence errors
      const error = new DOMException('SecurityError');
      mockStorage.getItem.mockRejectedValue(error);
      mockStorage.setItem.mockRejectedValue(error);

      // Store should still function despite errors
      const worldId = useWorldStore.getState().createWorld({
        name: 'Error Test World',
        description: 'A test world for persistence testing',
        genre: 'fantasy',
        attributes: [],
        skills: [],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20,
        },
      });

      expect(worldId).toBeDefined();

      // Advance timers and flush promises
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // Verify store attempted to persist
      expect(mockStorage.setItem).toHaveBeenCalled();

      // Clean up
      jest.useRealTimers();
    }, 10000);
  });
});
