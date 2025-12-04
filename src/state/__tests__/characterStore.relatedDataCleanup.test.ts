import { act, renderHook } from '@testing-library/react';
import { useCharacterStore } from '../characterStore';
import { useJournalStore } from '../journalStore';
import { useInventoryStore } from '../inventoryStore';
import { JournalEntry, JournalEntryType } from '@/types/journal.types';
import { EntityID } from '@/types/common.types';
import { mockZustandStore, createMockJournalStore, createMockInventoryStore } from '@/lib/test-utils';
import { createTestCharacterData } from './characterStore.testHelpers';

// Mock stores
jest.mock('../journalStore');
jest.mock('../inventoryStore');

// Test helper for journal entries
const createTestJournalEntry = (
  id: EntityID,
  characterId: EntityID,
  overrides?: Partial<JournalEntry>
): JournalEntry => ({
  id,
  sessionId: `session-${id.split('-')[1]}` as EntityID,
  worldId: 'world-1' as EntityID,
  characterId,
  type: 'character_event' as JournalEntryType,
  title: `Test Entry ${id.split('-')[1]}`,
  content: `Content for ${id}`,
  significance: 'minor' as const,
  isRead: false,
  relatedEntities: [],
  metadata: { tags: [], automaticEntry: true },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('CharacterStore - Related Data Cleanup', () => {
  let testCharacterId1: EntityID;
  let testCharacterId2: EntityID;

  const mockJournalStore = {
    entries: {} as Record<EntityID, JournalEntry>,
    sessionEntries: {
      'session-1': ['entry-1'],
      'session-2': ['entry-2'],
      'session-3': ['entry-3']
    },
    deleteSessionEntries: jest.fn(),
    getSessionEntries: jest.fn(),
    error: null,
    loading: false,
    addEntry: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
    clearAllEntries: jest.fn(),
    reset: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    setLoading: jest.fn(),
    markAsRead: jest.fn(),
    getSessionEntriesWithCharacter: jest.fn(),
    getEntriesByType: jest.fn(),
  };

  const mockInventoryStore = {
    items: {},
    characterInventories: {},
    clearCharacterInventory: jest.fn(),
    getCharacterItems: jest.fn(() => []),
    addItem: jest.fn(),
    removeItem: jest.fn(),
    updateItemQuantity: jest.fn(),
    delete: jest.fn(),
    error: null,
    loading: false,
    generatingImageFor: new Set(),
  };

  // Initialize entries dynamically based on test character IDs
  const initializeMockEntries = (charId1: EntityID, charId2: EntityID) => {
    mockJournalStore.entries = {
      'entry-1': createTestJournalEntry('entry-1' as EntityID, charId1, { content: 'Test entry' }),
      'entry-2': createTestJournalEntry('entry-2' as EntityID, charId1, { content: 'Another entry' }),
      'entry-3': createTestJournalEntry('entry-3' as EntityID, charId2, { content: 'Different character entry' })
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize test character IDs
    testCharacterId1 = 'char-1' as EntityID;
    testCharacterId2 = 'char-2' as EntityID;
    initializeMockEntries(testCharacterId1, testCharacterId2);

    mockZustandStore(useJournalStore as jest.MockedFunction<typeof useJournalStore>, createMockJournalStore(mockJournalStore));
    mockZustandStore(useInventoryStore as jest.MockedFunction<typeof useInventoryStore>, createMockInventoryStore(mockInventoryStore));

    // Mock getState for store access
    (useJournalStore as jest.MockedFunction<typeof useJournalStore>).getState = jest.fn(() => mockJournalStore);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useInventoryStore as jest.MockedFunction<typeof useInventoryStore>).getState = jest.fn(() => mockInventoryStore as any);

    // Clear character store before each test
    const { result } = renderHook(() => useCharacterStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Character Deletion', () => {
    test('deletes character from store', () => {
      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        testCharacterId1 = result.current.createCharacter(
          createTestCharacterData({ name: 'Test Character 1', description: 'Test description 1' })
        );

        testCharacterId2 = result.current.createCharacter(
          createTestCharacterData({ name: 'Test Character 2', description: 'Test description 2', level: 2 })
        );

        // Initialize mock journal entries with actual character IDs
        initializeMockEntries(testCharacterId1, testCharacterId2);
      });

      expect(result.current.characters[testCharacterId1]).toBeDefined();
      expect(result.current.characters[testCharacterId2]).toBeDefined();

      act(() => {
        result.current.deleteCharacter(testCharacterId1);
      });

      expect(result.current.characters[testCharacterId1]).toBeUndefined();
      expect(result.current.characters[testCharacterId2]).toBeDefined();

    });

    test('clears currentCharacterId when active character is deleted', () => {
      const { result } = renderHook(() => useCharacterStore());

      let characterId: string = '';

      act(() => {
        characterId = result.current.createCharacter({
          name: 'Test Character',
          description: 'Test description',
          worldId: 'world-1',
          level: 1,
          attributes: [],
          skills: [],
          background: {
            history: 'Test history',
            personality: 'Test personality',
            goals: [],
            fears: [],
            relationships: []
          },
          isPlayer: true,
          status: {
            health: 100,
            maxHealth: 100,
            conditions: []
          },
          inventory: {
            characterId: '',
            items: [],
            capacity: 20,
            categories: [],
            itemOrder: [],
          }
        });

        // Set as current character
        result.current.setCurrentCharacter(characterId);
      });

      expect(result.current.currentCharacterId).toBe(characterId);

      act(() => {
        result.current.deleteCharacter(characterId);
      });

      expect(result.current.currentCharacterId).toBeNull();
    });

    test('preserves currentCharacterId when non-active character is deleted', () => {
      const { result } = renderHook(() => useCharacterStore());

      let activeCharacterId: string = '';
      let otherCharacterId: string;

      act(() => {
        activeCharacterId = result.current.createCharacter({
          name: 'Active Character',
          description: 'Active character description',
          worldId: 'world-1',
          level: 1,
          attributes: [],
          skills: [],
          background: {
            history: 'Active character history',
            personality: 'Active character personality',
            goals: [],
            fears: [],
            relationships: []
          },
          isPlayer: true,
          status: {
            health: 100,
            maxHealth: 100,
            conditions: []
          },
          inventory: {
            characterId: '',
            items: [],
            capacity: 20,
            categories: [],
            itemOrder: [],
          }
        });

        otherCharacterId = result.current.createCharacter({
          name: 'Other Character',
          description: 'Other description', 
          worldId: 'world-1',
          level: 2,
          attributes: [],
          skills: [],
          background: {
            history: 'Other history',
            personality: 'Other personality',
            goals: [],
            fears: [],
            relationships: []
          },
          isPlayer: true,
          status: {
            health: 100,
            maxHealth: 100,
            conditions: []
          },
          inventory: {
            characterId: '',
            items: [],
            capacity: 20,
            categories: [],
            itemOrder: []
          }
        });

        // Set first character as active
        result.current.setCurrentCharacter(activeCharacterId);
      });

      expect(result.current.currentCharacterId).toBe(activeCharacterId);

      act(() => {
        result.current.deleteCharacter(otherCharacterId);
      });

      expect(result.current.currentCharacterId).toBe(activeCharacterId);
    });

    test('handles deletion gracefully when character does not exist', () => {
      const { result } = renderHook(() => useCharacterStore());

      const initialCharacterCount = Object.keys(result.current.characters).length;

      act(() => {
        result.current.deleteCharacter('non-existent-id');
      });

      expect(Object.keys(result.current.characters)).toHaveLength(initialCharacterCount);
    });

    test('cleans up character inventory when character is deleted', () => {
      const { result } = renderHook(() => useCharacterStore());

      let characterId: EntityID = '' as EntityID;

      act(() => {
        characterId = result.current.createCharacter(
          createTestCharacterData({ name: 'Test Character', description: 'Test description' })
        );
      });

      act(() => {
        result.current.deleteCharacter(characterId);
      });

      // Verify inventory cleanup was called
      expect(mockInventoryStore.clearCharacterInventory).toHaveBeenCalledWith(characterId);
    });

    test('cleans up inventory for all characters when world is deleted', () => {
      const { result } = renderHook(() => useCharacterStore());

      let char1Id: EntityID = '' as EntityID;
      let char2Id: EntityID = '' as EntityID;
      let char3Id: EntityID = '' as EntityID;

      act(() => {
        // Create characters in world-1
        char1Id = result.current.createCharacter(
          createTestCharacterData({ name: 'Character 1', worldId: 'world-1' as EntityID })
        );
        char2Id = result.current.createCharacter(
          createTestCharacterData({ name: 'Character 2', worldId: 'world-1' as EntityID })
        );
        // Create character in world-2 (should NOT be cleaned)
        char3Id = result.current.createCharacter(
          createTestCharacterData({ name: 'Character 3', worldId: 'world-2' as EntityID })
        );
      });

      act(() => {
        result.current.deleteCharactersInWorld('world-1' as EntityID);
      });

      // Verify inventory cleanup was called for world-1 characters only
      expect(mockInventoryStore.clearCharacterInventory).toHaveBeenCalledWith(char1Id);
      expect(mockInventoryStore.clearCharacterInventory).toHaveBeenCalledWith(char2Id);
      expect(mockInventoryStore.clearCharacterInventory).not.toHaveBeenCalledWith(char3Id);
      expect(mockInventoryStore.clearCharacterInventory).toHaveBeenCalledTimes(2);
    });
  });
});