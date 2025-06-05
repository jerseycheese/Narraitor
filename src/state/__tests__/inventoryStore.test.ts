import { useInventoryStore } from '../inventoryStore';

describe('useInventoryStore', () => {
  beforeEach(() => {
    useInventoryStore.getState().reset();
  });

  describe('initialization', () => {
    test('should initialize with default state', () => {
      const state = useInventoryStore.getState();
      expect(state.items).toEqual({});
      expect(state.characterInventories).toEqual({});
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });

  describe('addItem', () => {
    test('should add item to character inventory', () => {
      const characterId = 'character-1';
      const itemData = {
        name: 'Sword',
        category: 'weapon',
        quantity: 1,
        weight: 5,
        value: 100,
        equipped: false
      };

      const itemId = useInventoryStore.getState().addItem(characterId, itemData);
      const state = useInventoryStore.getState();

      expect(itemId).toBeDefined();
      expect(state.items[itemId]).toBeDefined();
      expect(state.items[itemId].name).toBe('Sword');
      expect(state.items[itemId].characterId).toBe(characterId);
      expect(state.characterInventories[characterId]).toContain(itemId);
    });

    test('should validate required fields', () => {
      const characterId = 'character-1';
      const invalidItemData = {
        name: '',
        category: '',
        quantity: 0,
        weight: -1,
        value: -1,
        equipped: false
      };

      expect(() => {
        useInventoryStore.getState().addItem(characterId, invalidItemData);
      }).toThrow('Item name is required');
    });

    test('should initialize character inventory if not exists', () => {
      const characterId = 'new-character';
      const itemData = {
        name: 'Health Potion',
        category: 'consumable',
        quantity: 3,
        weight: 0.5,
        value: 50,
        equipped: false
      };

      const itemId = useInventoryStore.getState().addItem(characterId, itemData);
      const state = useInventoryStore.getState();

      expect(state.characterInventories[characterId]).toBeDefined();
      expect(state.characterInventories[characterId]).toContain(itemId);
    });
  });

  describe('updateItem', () => {
    test('should update existing item', () => {
      const characterId = 'character-1';
      const itemId = useInventoryStore.getState().addItem(characterId, {
        name: 'Old Sword',
        category: 'weapon',
        quantity: 1,
        weight: 5,
        value: 100,
        equipped: false
      });

      useInventoryStore.getState().updateItem(itemId, {
        name: 'Enchanted Sword',
        value: 500,
        equipped: true
      });

      const state = useInventoryStore.getState();
      expect(state.items[itemId].name).toBe('Enchanted Sword');
      expect(state.items[itemId].value).toBe(500);
      expect(state.items[itemId].equipped).toBe(true);
    });

    test('should handle non-existent item', () => {
      useInventoryStore.getState().updateItem('non-existent-id', { name: 'Updated' });
      const state = useInventoryStore.getState();
      expect(state.error).toBe('Item not found');
    });
  });

  describe('removeItem', () => {
    test('should remove item from inventory', () => {
      const characterId = 'character-1';
      const itemId = useInventoryStore.getState().addItem(characterId, {
        name: 'To Remove',
        category: 'misc',
        quantity: 1,
        weight: 1,
        value: 10,
        equipped: false
      });

      useInventoryStore.getState().removeItem(itemId);
      const state = useInventoryStore.getState();

      expect(state.items[itemId]).toBeUndefined();
      expect(state.characterInventories[characterId]).not.toContain(itemId);
    });

    test('should handle removing item from non-existent inventory', () => {
      const characterId = 'character-1';
      const itemId = useInventoryStore.getState().addItem(characterId, {
        name: 'Item',
        category: 'misc',
        quantity: 1,
        weight: 1,
        value: 10,
        equipped: false
      });

      // Remove character inventory manually to simulate edge case
      delete useInventoryStore.getState().characterInventories[characterId];

      useInventoryStore.getState().removeItem(itemId);
      const state = useInventoryStore.getState();

      expect(state.items[itemId]).toBeUndefined();
      expect(state.error).toBeNull(); // Should handle gracefully
    });
  });

  describe('transferItem', () => {
    test('should transfer item between characters', () => {
      const fromCharacterId = 'character-1';
      const toCharacterId = 'character-2';
      
      const itemId = useInventoryStore.getState().addItem(fromCharacterId, {
        name: 'Transferable Item',
        category: 'misc',
        quantity: 1,
        weight: 1,
        value: 10,
        equipped: false
      });

      useInventoryStore.getState().transferItem(itemId, toCharacterId);
      const state = useInventoryStore.getState();

      expect(state.items[itemId].characterId).toBe(toCharacterId);
      expect(state.characterInventories[fromCharacterId]).not.toContain(itemId);
      expect(state.characterInventories[toCharacterId]).toContain(itemId);
    });

    test('should initialize target character inventory if not exists', () => {
      const fromCharacterId = 'character-1';
      const toCharacterId = 'new-character';
      
      const itemId = useInventoryStore.getState().addItem(fromCharacterId, {
        name: 'Transferable Item',
        category: 'misc',
        quantity: 1,
        weight: 1,
        value: 10,
        equipped: false
      });

      useInventoryStore.getState().transferItem(itemId, toCharacterId);
      const state = useInventoryStore.getState();

      expect(state.characterInventories[toCharacterId]).toBeDefined();
      expect(state.characterInventories[toCharacterId]).toContain(itemId);
    });

    test('should unequip item when transferring', () => {
      const fromCharacterId = 'character-1';
      const toCharacterId = 'character-2';
      
      const itemId = useInventoryStore.getState().addItem(fromCharacterId, {
        name: 'Equipped Item',
        category: 'weapon',
        quantity: 1,
        weight: 5,
        value: 100,
        equipped: true
      });

      useInventoryStore.getState().transferItem(itemId, toCharacterId);
      const state = useInventoryStore.getState();

      expect(state.items[itemId].equipped).toBe(false);
    });
  });

  describe('getCharacterItems', () => {
    test('should get all items for a character', () => {
      const characterId = 'character-1';
      
      const itemId1 = useInventoryStore.getState().addItem(characterId, {
        name: 'Item 1',
        category: 'misc',
        quantity: 1,
        weight: 1,
        value: 10,
        equipped: false
      });

      const itemId2 = useInventoryStore.getState().addItem(characterId, {
        name: 'Item 2',
        category: 'misc',
        quantity: 2,
        weight: 2,
        value: 20,
        equipped: false
      });

      const items = useInventoryStore.getState().getCharacterItems(characterId);

      expect(items).toHaveLength(2);
      expect(items.map(item => item.id)).toContain(itemId1);
      expect(items.map(item => item.id)).toContain(itemId2);
    });

    test('should return empty array for character with no items', () => {
      const items = useInventoryStore.getState().getCharacterItems('no-items-character');
      expect(items).toEqual([]);
    });
  });

  describe('getEquippedItems', () => {
    test('should get only equipped items for a character', () => {
      const characterId = 'character-1';
      
      useInventoryStore.getState().addItem(characterId, {
        name: 'Equipped Sword',
        category: 'weapon',
        quantity: 1,
        weight: 5,
        value: 100,
        equipped: true
      });

      useInventoryStore.getState().addItem(characterId, {
        name: 'Unequipped Sword',
        category: 'weapon',
        quantity: 1,
        weight: 5,
        value: 100,
        equipped: false
      });

      const equippedItems = useInventoryStore.getState().getEquippedItems(characterId);

      expect(equippedItems).toHaveLength(1);
      expect(equippedItems[0].name).toBe('Equipped Sword');
    });
  });

  describe('calculateTotalWeight', () => {
    test('should calculate total weight of character inventory', () => {
      const characterId = 'character-1';
      
      useInventoryStore.getState().addItem(characterId, {
        name: 'Heavy Item',
        category: 'misc',
        quantity: 2,
        weight: 10,
        value: 100,
        equipped: false
      });

      useInventoryStore.getState().addItem(characterId, {
        name: 'Light Item',
        category: 'misc',
        quantity: 3,
        weight: 0.5,
        value: 10,
        equipped: false
      });

      const totalWeight = useInventoryStore.getState().calculateTotalWeight(characterId);

      // Heavy Item: 2 * 10 = 20
      // Light Item: 3 * 0.5 = 1.5
      // Total: 21.5
      expect(totalWeight).toBe(21.5);
    });

    test('should return 0 for character with no items', () => {
      const totalWeight = useInventoryStore.getState().calculateTotalWeight('no-items-character');
      expect(totalWeight).toBe(0);
    });
  });

  describe('error handling', () => {
    test('should set and clear errors', () => {
      useInventoryStore.getState().setError('Test error');
      expect(useInventoryStore.getState().error).toBe('Test error');

      useInventoryStore.getState().clearError();
      expect(useInventoryStore.getState().error).toBeNull();
    });
  });

  describe('loading state', () => {
    test('should set loading state', () => {
      useInventoryStore.getState().setLoading(true);
      expect(useInventoryStore.getState().loading).toBe(true);

      useInventoryStore.getState().setLoading(false);
      expect(useInventoryStore.getState().loading).toBe(false);
    });
  });

  describe('reset', () => {
    test('should reset store to initial state', () => {
      // Add some data
      const characterId = 'character-1';
      useInventoryStore.getState().addItem(characterId, {
        name: 'Test Item',
        category: 'misc',
        quantity: 1,
        weight: 1,
        value: 10,
        equipped: false
      });
      useInventoryStore.getState().setError('Some error');
      useInventoryStore.getState().setLoading(true);

      // Reset
      useInventoryStore.getState().reset();
      const state = useInventoryStore.getState();

      expect(state.items).toEqual({});
      expect(state.characterInventories).toEqual({});
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });
});
