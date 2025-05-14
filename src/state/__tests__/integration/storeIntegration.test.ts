import { worldStore, characterStore, inventoryStore } from '../../index';

describe('Store Integration', () => {
  beforeEach(() => {
    worldStore.getState().reset();
    characterStore.getState().reset();
    inventoryStore.getState().reset();
  });

  describe('cross-store references', () => {
    test('should maintain referential integrity between worlds and characters', () => {
      // Create a world
      const worldId = worldStore.getState().createWorld({
        name: 'Test World',
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

      // Create a character in that world
      const characterId = characterStore.getState().createCharacter({
        name: 'Test Character',
        worldId: worldId,
        attributes: [],
        skills: [],
        background: {
          description: 'A character in the test world',
          personality: 'Brave',
          motivation: 'Adventure'
        },
        isPlayer: true
      });

      // Create inventory for the character
      inventoryStore.getState().addItem(characterId, {
        name: 'Sword',
        category: 'weapon',
        quantity: 1,
        weight: 5,
        value: 100,
        equipped: false
      });

      // Verify relationships
      const character = characterStore.getState().characters[characterId];
      expect(character.worldId).toBe(worldId);

      const items = inventoryStore.getState().getCharacterItems(characterId);
      expect(items).toHaveLength(1);
      expect(items[0].characterId).toBe(characterId);
    });

    test('should handle cascading deletes appropriately', () => {
      // Create world and character
      const worldId = worldStore.getState().createWorld({
        name: 'World to Delete',
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

      const characterId = characterStore.getState().createCharacter({
        name: 'Character to Orphan',
        worldId: worldId,
        attributes: [],
        skills: [],
        background: {
          description: 'Will lose its world',
          personality: 'Confused',
          motivation: 'Survival'
        },
        isPlayer: true
      });

      // Delete the world
      worldStore.getState().deleteWorld(worldId);

      // Character should still exist but be orphaned
      const character = characterStore.getState().characters[characterId];
      expect(character).toBeDefined();
      expect(character.worldId).toBe(worldId); // Still references deleted world
    });

    test('should handle character deletion with inventory', () => {
      const worldId = worldStore.getState().createWorld({
        name: 'Test World',
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

      const characterId = characterStore.getState().createCharacter({
        name: 'Character with Items',
        worldId: worldId,
        attributes: [],
        skills: [],
        background: {
          description: 'Has inventory',
          personality: 'Collector',
          motivation: 'Gathering'
        },
        isPlayer: true
      });

      // Add items to character
      const itemId1 = inventoryStore.getState().addItem(characterId, {
        name: 'Item 1',
        category: 'misc',
        quantity: 1,
        weight: 1,
        value: 10,
        equipped: false
      });

      const itemId2 = inventoryStore.getState().addItem(characterId, {
        name: 'Item 2',
        category: 'misc',
        quantity: 1,
        weight: 1,
        value: 10,
        equipped: false
      });

      // Delete the character
      characterStore.getState().deleteCharacter(characterId);

      // Character should be deleted
      expect(characterStore.getState().characters[characterId]).toBeUndefined();

      // Items should still exist but be orphaned
      const item1 = inventoryStore.getState().items[itemId1];
      const item2 = inventoryStore.getState().items[itemId2];
      expect(item1).toBeDefined();
      expect(item2).toBeDefined();
      expect(item1.characterId).toBe(characterId); // Still references deleted character
      expect(item2.characterId).toBe(characterId);
    });
  });

  describe('world-character-inventory chain', () => {
    test('should create complete game setup', () => {
      // Create a fantasy world
      const worldId = worldStore.getState().createWorld({
        name: 'Fantasy Realm',
        theme: 'fantasy',
        attributes: [
          {
            id: 'str-1',
            name: 'Strength',
            worldId: 'placeholder',
            baseValue: 10,
            minValue: 3,
            maxValue: 18,
            category: 'Physical'
          },
          {
            id: 'dex-1',
            name: 'Dexterity',
            worldId: 'placeholder',
            baseValue: 10,
            minValue: 3,
            maxValue: 18,
            category: 'Physical'
          }
        ],
        skills: [
          {
            id: 'sword-1',
            name: 'Swordsmanship',
            worldId: 'placeholder',
            linkedAttributeId: 'str-1',
            difficulty: 'medium',
            category: 'Combat'
          }
        ],
        settings: {
          maxAttributes: 6,
          maxSkills: 8,
          attributePointPool: 27,
          skillPointPool: 20
        }
      });

      // Create a character in that world
      const characterId = characterStore.getState().createCharacter({
        name: 'Hero',
        worldId: worldId,
        attributes: [
          {
            id: 'char-str-1',
            characterId: 'placeholder',
            name: 'Strength',
            baseValue: 14,
            modifiedValue: 14
          }
        ],
        skills: [
          {
            id: 'char-sword-1',
            characterId: 'placeholder',
            name: 'Swordsmanship',
            level: 3
          }
        ],
        background: {
          description: 'A brave adventurer',
          personality: 'Courageous',
          motivation: 'Save the realm'
        },
        isPlayer: true
      });

      // Give the character some equipment
      inventoryStore.getState().addItem(characterId, {
        name: 'Longsword',
        category: 'weapon',
        quantity: 1,
        weight: 5,
        value: 100,
        equipped: true
      });

      inventoryStore.getState().addItem(characterId, {
        name: 'Health Potion',
        category: 'consumable',
        quantity: 3,
        weight: 0.5,
        value: 50,
        equipped: false
      });

      // Verify complete setup
      const world = worldStore.getState().worlds[worldId];
      const character = characterStore.getState().characters[characterId];
      const items = inventoryStore.getState().getCharacterItems(characterId);

      expect(world).toBeDefined();
      expect(character).toBeDefined();
      expect(items).toHaveLength(2);

      // Verify character is in the correct world
      expect(character.worldId).toBe(worldId);

      // Verify character has attributes and skills
      expect(character.attributes).toHaveLength(1);
      expect(character.skills).toHaveLength(1);

      // Verify inventory
      const equippedItems = inventoryStore.getState().getEquippedItems(characterId);
      expect(equippedItems).toHaveLength(1);
      expect(equippedItems[0].name).toBe('Longsword');

      // Verify total weight calculation
      const totalWeight = inventoryStore.getState().calculateTotalWeight(characterId);
      expect(totalWeight).toBe(6.5); // Sword: 5, Potions: 3 * 0.5 = 1.5
    });
  });

  describe('error propagation', () => {
    test('should handle errors across stores independently', () => {
      // Set errors in different stores
      worldStore.getState().setError('World error');
      characterStore.getState().setError('Character error');
      inventoryStore.getState().setError('Inventory error');

      // Each store should maintain its own error state
      expect(worldStore.getState().error).toBe('World error');
      expect(characterStore.getState().error).toBe('Character error');
      expect(inventoryStore.getState().error).toBe('Inventory error');

      // Clearing one store's error shouldn't affect others
      worldStore.getState().clearError();
      expect(worldStore.getState().error).toBeNull();
      expect(characterStore.getState().error).toBe('Character error');
      expect(inventoryStore.getState().error).toBe('Inventory error');
    });
  });

  describe('loading states', () => {
    test('should handle loading states independently', () => {
      // Set loading states
      worldStore.getState().setLoading(true);
      characterStore.getState().setLoading(false);
      inventoryStore.getState().setLoading(true);

      // Each store should maintain its own loading state
      expect(worldStore.getState().loading).toBe(true);
      expect(characterStore.getState().loading).toBe(false);
      expect(inventoryStore.getState().loading).toBe(true);
    });
  });
});
