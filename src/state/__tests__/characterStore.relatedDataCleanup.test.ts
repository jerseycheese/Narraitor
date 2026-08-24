import { act, renderHook } from '@testing-library/react';
import { useCharacterStore } from '../characterStore';
import { EntityID } from '@/types/common.types';
import { storeEvents, StoreEventTypes } from '@/lib/state/storePubSub';
import { createTestCharacterData } from './characterStore.testHelpers';

// Mock store events
jest.spyOn(storeEvents, 'emit').mockImplementation(() => Promise.resolve());

describe('CharacterStore - Related Data Cleanup', () => {
  let testCharacterId1: EntityID;
  let testCharacterId2: EntityID;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Clear character store before each test
    const { result } = renderHook(() => useCharacterStore());
    await act(async () => {
      result.current.reset();
    });
  });

  describe('Character Deletion', () => {
    test('deletes character from store', async () => {
      const { result } = renderHook(() => useCharacterStore());

      await act(async () => {
        testCharacterId1 = result.current.createCharacter(
          createTestCharacterData({
            name: 'Test Character 1',
            description: 'Test description 1',
          })
        );

        testCharacterId2 = result.current.createCharacter(
          createTestCharacterData({
            name: 'Test Character 2',
            description: 'Test description 2',
            level: 2,
          })
        );
      });

      expect(result.current.characters[testCharacterId1]).toBeDefined();
      expect(result.current.characters[testCharacterId2]).toBeDefined();

      await act(async () => {
        await result.current.deleteCharacter(testCharacterId1);
      });

      expect(result.current.characters[testCharacterId1]).toBeUndefined();
      expect(result.current.characters[testCharacterId2]).toBeDefined();
    });

    test('clears currentCharacterId when active character is deleted', async () => {
      const { result } = renderHook(() => useCharacterStore());

      let characterId: string = '';

      await act(async () => {
        characterId = result.current.createCharacter({
          name: 'Test Character',
          description: 'Test description',
          worldId: 'world-1',
          level: 1,
          attributes: [],
          skills: [],
          derivedStats: [],
          background: {
            history: 'Test history',
            personality: 'Test personality',
            goals: [],
            fears: [],
            relationships: [],
          },
          isPlayer: true,
          status: {
            conditions: [],
          },
          inventory: {
            characterId: '',
            items: [],
            capacity: 20,
            categories: [],
            itemOrder: [],
          },
        });

        // Set as current character
        result.current.setCurrentCharacter(characterId);
      });

      expect(result.current.currentCharacterId).toBe(characterId);

      await act(async () => {
        await result.current.deleteCharacter(characterId);
      });

      expect(result.current.currentCharacterId).toBeNull();
    });

    test('preserves currentCharacterId when non-active character is deleted', async () => {
      const { result } = renderHook(() => useCharacterStore());

      let activeCharacterId: string = '';
      let otherCharacterId: string;

      await act(async () => {
        activeCharacterId = result.current.createCharacter({
          name: 'Active Character',
          description: 'Active character description',
          worldId: 'world-1',
          level: 1,
          attributes: [],
          skills: [],
          derivedStats: [],
          background: {
            history: 'Active character history',
            personality: 'Active character personality',
            goals: [],
            fears: [],
            relationships: [],
          },
          isPlayer: true,
          status: {
            conditions: [],
          },
          inventory: {
            characterId: '',
            items: [],
            capacity: 20,
            categories: [],
            itemOrder: [],
          },
        });

        otherCharacterId = result.current.createCharacter({
          name: 'Other Character',
          description: 'Other description',
          worldId: 'world-1',
          level: 2,
          attributes: [],
          skills: [],
          derivedStats: [],
          background: {
            history: 'Other history',
            personality: 'Other personality',
            goals: [],
            fears: [],
            relationships: [],
          },
          isPlayer: true,
          status: {
            conditions: [],
          },
          inventory: {
            characterId: '',
            items: [],
            capacity: 20,
            categories: [],
            itemOrder: [],
          },
        });

        // Set first character as active
        result.current.setCurrentCharacter(activeCharacterId);
      });

      expect(result.current.currentCharacterId).toBe(activeCharacterId);

      await act(async () => {
        await result.current.deleteCharacter(otherCharacterId);
      });

      expect(result.current.currentCharacterId).toBe(activeCharacterId);
    });

    test('handles deletion gracefully when character does not exist', async () => {
      const { result } = renderHook(() => useCharacterStore());

      const initialCharacterCount = Object.keys(
        result.current.characters
      ).length;

      await act(async () => {
        await result.current.deleteCharacter('non-existent-id');
      });

      expect(Object.keys(result.current.characters)).toHaveLength(
        initialCharacterCount
      );
    });

    test('emits event to clean up character inventory when character is deleted', async () => {
      const { result } = renderHook(() => useCharacterStore());

      let characterId: EntityID = '' as EntityID;

      await act(async () => {
        characterId = result.current.createCharacter(
          createTestCharacterData({
            name: 'Test Character',
            description: 'Test description',
          })
        );
      });

      await act(async () => {
        await result.current.deleteCharacter(characterId);
      });

      // Verify event emission
      expect(storeEvents.emit).toHaveBeenCalledWith(
        StoreEventTypes.CHARACTER_DELETED,
        { characterId }
      );
    });

    test('emits events to clean up inventory for all characters when world is deleted', async () => {
      const { result } = renderHook(() => useCharacterStore());

      let char1Id: EntityID = '' as EntityID;
      let char2Id: EntityID = '' as EntityID;
      let char3Id: EntityID = '' as EntityID;

      await act(async () => {
        // Create characters in world-1
        char1Id = result.current.createCharacter(
          createTestCharacterData({
            name: 'Character 1',
            worldId: 'world-1' as EntityID,
          })
        );
        char2Id = result.current.createCharacter(
          createTestCharacterData({
            name: 'Character 2',
            worldId: 'world-1' as EntityID,
          })
        );
        // Create character in world-2 (should NOT be cleaned)
        char3Id = result.current.createCharacter(
          createTestCharacterData({
            name: 'Character 3',
            worldId: 'world-2' as EntityID,
          })
        );
      });

      await act(async () => {
        await result.current.deleteCharactersInWorld('world-1' as EntityID);
      });

      // Verify event emissions for world-1 characters
      expect(storeEvents.emit).toHaveBeenCalledWith(
        StoreEventTypes.CHARACTER_DELETED,
        { characterId: char1Id }
      );
      expect(storeEvents.emit).toHaveBeenCalledWith(
        StoreEventTypes.CHARACTER_DELETED,
        { characterId: char2Id }
      );
      expect(storeEvents.emit).not.toHaveBeenCalledWith(
        StoreEventTypes.CHARACTER_DELETED,
        { characterId: char3Id }
      );
    });
  });
});
