// src/state/__tests__/inventoryStore.test.ts

import { useInventoryStore } from '../inventoryStore';
import { ErrorType } from '@/lib/utils/errorUtils';

describe('useInventoryStore', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    useInventoryStore.getState().reset();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('initialization', () => {
    test('should initialize with default state', () => {
      const state = useInventoryStore.getState();
      expect(state.items).toEqual({});
      expect(state.entities).toEqual({});
      expect(state.characterInventories).toEqual({});
      expect(state.currentItemId).toBeNull();
      expect(state.currentEntityId).toBeNull();
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });

  describe('createItem', () => {
    test('should create a new item with quantity 1', () => {
      const itemData = {
        name: 'Health Potion',
        description: 'Restores 50 HP',
        categoryId: 'cat-1',
        quantity: 1,
      };

      const itemId = useInventoryStore.getState().createItem(itemData);
      const state = useInventoryStore.getState();

      expect(itemId).toBeDefined();
      expect(state.items[itemId]).toBeDefined();
      expect(state.items[itemId].name).toBe('Health Potion');
      expect(state.items[itemId].quantity).toBe(1);
      expect(state.items[itemId].categoryId).toBe('cat-1');
      expect(state.items[itemId].createdAt).toBeDefined();
      expect(state.items[itemId].updatedAt).toBeDefined();
    });

    test('should create stackable item with quantity greater than 1', () => {
      const itemData = {
        name: 'Gold Coins',
        description: 'Currency',
        categoryId: 'cat-currency',
        quantity: 100,
      };

      const itemId = useInventoryStore.getState().createItem(itemData);
      const state = useInventoryStore.getState();

      expect(state.items[itemId].quantity).toBe(100);
    });

    test('should validate required fields', () => {
      const invalidItemData = {
        name: '',
        description: '',
        categoryId: '',
        quantity: 1,
      };

      expect(() => {
        useInventoryStore.getState().createItem(invalidItemData);
      }).toThrow('Item name is required');
    });

    test('should reject invalid quantity (zero)', () => {
      const invalidItemData = {
        name: 'Invalid Item',
        description: 'Has invalid quantity',
        categoryId: 'cat-1',
        quantity: 0,
      };

      expect(() => {
        useInventoryStore.getState().createItem(invalidItemData);
      }).toThrow('Item quantity must be at least 1');
    });

    test('should reject invalid quantity (negative)', () => {
      const invalidItemData = {
        name: 'Invalid Item',
        description: 'Has negative quantity',
        categoryId: 'cat-1',
        quantity: -5,
      };

      expect(() => {
        useInventoryStore.getState().createItem(invalidItemData);
      }).toThrow('Item quantity must be at least 1');
    });
  });

  describe('updateItem', () => {
    test('should update existing item', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Original Sword',
        description: 'Original description',
        categoryId: 'cat-weapon',
        quantity: 1,
      });

      const originalUpdatedAt = useInventoryStore.getState().items[itemId].updatedAt;

      jest.setSystemTime(new Date('2025-01-15T12:00:01Z'));

      useInventoryStore.getState().updateItem(itemId, {
        name: 'Enchanted Sword',
        description: 'Now with magic',
      });

      const state = useInventoryStore.getState();
      expect(state.items[itemId].name).toBe('Enchanted Sword');
      expect(state.items[itemId].description).toBe('Now with magic');
      expect(state.items[itemId].updatedAt).not.toBe(originalUpdatedAt);
    });

    test('should handle non-existent item', () => {
      useInventoryStore.getState().updateItem('non-existent-id', { name: 'Updated' });
      const state = useInventoryStore.getState();
      expect(state.error).toMatchObject({
        title: 'Item Not Found',
        message: 'The specified item could not be found',
        type: 'validation',
      });
    });

    test('should reject invalid quantity updates', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Test Item',
        description: 'Test',
        categoryId: 'cat-1',
        quantity: 5,
      });

      expect(() => {
        useInventoryStore.getState().updateItem(itemId, { quantity: 0 });
      }).toThrow('Item quantity must be at least 1');
    });
  });

  describe('deleteItem', () => {
    test('should remove item from store', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'To Delete',
        description: 'Item to be deleted',
        categoryId: 'cat-1',
        quantity: 1,
      });

      useInventoryStore.getState().deleteItem(itemId);
      const state = useInventoryStore.getState();

      expect(state.items[itemId]).toBeUndefined();
    });

    test('should clear currentItemId if deleted item was current', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Current Item',
        description: 'Currently selected item',
        categoryId: 'cat-1',
        quantity: 1,
      });

      useInventoryStore.getState().setCurrentItem(itemId);
      useInventoryStore.getState().deleteItem(itemId);
      const state = useInventoryStore.getState();

      expect(state.currentItemId).toBeNull();
    });

    test('should remove item from character inventories', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Shared Item',
        description: 'Item in character inventory',
        categoryId: 'cat-1',
        quantity: 1,
      });

      useInventoryStore.getState().addItemToCharacter('char-1', itemId);
      useInventoryStore.getState().deleteItem(itemId);
      const state = useInventoryStore.getState();

      expect(state.characterInventories['char-1']).not.toContain(itemId);
    });
  });

  describe('setCurrentItem', () => {
    test('should set current item ID', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Current Item',
        description: 'Item to be selected',
        categoryId: 'cat-1',
        quantity: 1,
      });

      useInventoryStore.getState().setCurrentItem(itemId);
      const state = useInventoryStore.getState();

      expect(state.currentItemId).toBe(itemId);
    });

    test('should handle non-existent item', () => {
      useInventoryStore.getState().setCurrentItem('non-existent-id');
      const state = useInventoryStore.getState();
      expect(state.error).toMatchObject({
        title: 'Item Not Found',
        message: 'The specified item could not be found',
        type: 'validation',
      });
      expect(state.currentItemId).toBeNull();
    });
  });

  describe('quantity management', () => {
    test('should increase item quantity for stackable items', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Arrow',
        description: 'Wooden arrow',
        categoryId: 'cat-ammo',
        quantity: 10,
      });

      useInventoryStore.getState().addQuantity(itemId, 5);
      const state = useInventoryStore.getState();

      expect(state.items[itemId].quantity).toBe(15);
    });

    test('should decrease item quantity', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Arrow',
        description: 'Wooden arrow',
        categoryId: 'cat-ammo',
        quantity: 10,
      });

      useInventoryStore.getState().removeQuantity(itemId, 3);
      const state = useInventoryStore.getState();

      expect(state.items[itemId].quantity).toBe(7);
    });

    test('should delete item when quantity reaches zero', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Arrow',
        description: 'Wooden arrow',
        categoryId: 'cat-ammo',
        quantity: 5,
      });

      useInventoryStore.getState().removeQuantity(itemId, 5);
      const state = useInventoryStore.getState();

      expect(state.items[itemId]).toBeUndefined();
    });

    test('should handle removing more quantity than available', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Arrow',
        description: 'Wooden arrow',
        categoryId: 'cat-ammo',
        quantity: 5,
      });

      useInventoryStore.getState().removeQuantity(itemId, 10);
      const state = useInventoryStore.getState();

      expect(state.error).toMatchObject({
        title: 'Insufficient Quantity',
        message: 'Cannot remove more items than available',
        type: 'validation',
      });
      // Item quantity should remain unchanged
      expect(state.items[itemId].quantity).toBe(5);
    });

    test('should reject negative quantity additions', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Item',
        description: 'Test item',
        categoryId: 'cat-1',
        quantity: 5,
      });

      expect(() => {
        useInventoryStore.getState().addQuantity(itemId, -3);
      }).toThrow('Quantity to add must be positive');
    });

    test('should reject negative quantity removals', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Item',
        description: 'Test item',
        categoryId: 'cat-1',
        quantity: 5,
      });

      expect(() => {
        useInventoryStore.getState().removeQuantity(itemId, -3);
      }).toThrow('Quantity to remove must be positive');
    });
  });

  describe('character inventory management', () => {
    test('should add item to character inventory', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Sword',
        description: 'Sharp sword',
        categoryId: 'cat-weapon',
        quantity: 1,
      });

      useInventoryStore.getState().addItemToCharacter('char-1', itemId);
      const state = useInventoryStore.getState();

      expect(state.characterInventories['char-1']).toContain(itemId);
    });

    test('should remove item from character inventory', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Sword',
        description: 'Sharp sword',
        categoryId: 'cat-weapon',
        quantity: 1,
      });

      useInventoryStore.getState().addItemToCharacter('char-1', itemId);
      useInventoryStore.getState().removeItemFromCharacter('char-1', itemId);
      const state = useInventoryStore.getState();

      expect(state.characterInventories['char-1']).not.toContain(itemId);
    });

    test('should get all items for a character', () => {
      const item1Id = useInventoryStore.getState().createItem({
        name: 'Sword',
        description: 'Sharp sword',
        categoryId: 'cat-weapon',
        quantity: 1,
      });

      const item2Id = useInventoryStore.getState().createItem({
        name: 'Shield',
        description: 'Sturdy shield',
        categoryId: 'cat-armor',
        quantity: 1,
      });

      useInventoryStore.getState().addItemToCharacter('char-1', item1Id);
      useInventoryStore.getState().addItemToCharacter('char-1', item2Id);

      const items = useInventoryStore.getState().getCharacterItems('char-1');

      expect(items).toHaveLength(2);
      expect(items[0].id).toBe(item1Id);
      expect(items[1].id).toBe(item2Id);
    });

    test('should return empty array for character with no items', () => {
      const items = useInventoryStore.getState().getCharacterItems('char-nonexistent');
      expect(items).toEqual([]);
    });

    test('should handle adding non-existent item to character', () => {
      useInventoryStore.getState().addItemToCharacter('char-1', 'non-existent-item');
      const state = useInventoryStore.getState();

      expect(state.error).toMatchObject({
        title: 'Item Not Found',
        message: 'The specified item could not be found',
        type: 'validation',
      });
    });

    test('should not duplicate items in character inventory', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Sword',
        description: 'Sharp sword',
        categoryId: 'cat-weapon',
        quantity: 1,
      });

      useInventoryStore.getState().addItemToCharacter('char-1', itemId);
      useInventoryStore.getState().addItemToCharacter('char-1', itemId);
      const state = useInventoryStore.getState();

      const itemCount = state.characterInventories['char-1'].filter(id => id === itemId).length;
      expect(itemCount).toBe(1);
    });

    test('should clear all items from character inventory', () => {
      const item1Id = useInventoryStore.getState().createItem({
        name: 'Sword',
        description: 'Sharp sword',
        categoryId: 'cat-weapon',
        quantity: 1,
      });

      const item2Id = useInventoryStore.getState().createItem({
        name: 'Shield',
        description: 'Sturdy shield',
        categoryId: 'cat-armor',
        quantity: 1,
      });

      useInventoryStore.getState().addItemToCharacter('char-1', item1Id);
      useInventoryStore.getState().addItemToCharacter('char-1', item2Id);
      useInventoryStore.getState().clearCharacterInventory('char-1');
      const state = useInventoryStore.getState();

      expect(state.characterInventories['char-1']).toEqual([]);
    });
  });

  describe('error handling', () => {
    test('should set and clear errors', () => {
      useInventoryStore.getState().setError({
        title: 'Test error',
        message: 'Details',
        retryable: false,
        type: ErrorType.UNKNOWN,
      });
      expect(useInventoryStore.getState().error?.title).toBe('Test error');

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
      const itemId = useInventoryStore.getState().createItem({
        name: 'Test Item',
        description: 'Item for reset test',
        categoryId: 'cat-1',
        quantity: 5,
      });
      useInventoryStore.getState().addItemToCharacter('char-1', itemId);
      useInventoryStore.getState().setError({
        title: 'Some error',
        message: 'Details',
        retryable: false,
        type: ErrorType.UNKNOWN,
      });
      useInventoryStore.getState().setLoading(true);

      // Reset
      useInventoryStore.getState().reset();
      const state = useInventoryStore.getState();

      expect(state.items).toEqual({});
      expect(state.entities).toEqual({});
      expect(state.characterInventories).toEqual({});
      expect(state.currentItemId).toBeNull();
      expect(state.currentEntityId).toBeNull();
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });

  describe('edge cases and data consistency', () => {
    test('should maintain consistent state when operations fail', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Test Item',
        description: 'Test',
        categoryId: 'cat-1',
        quantity: 5,
      });

      const stateBefore = JSON.parse(JSON.stringify(useInventoryStore.getState().items));

      // Try to remove more than available
      useInventoryStore.getState().removeQuantity(itemId, 10);

      const stateAfter = useInventoryStore.getState().items;

      // Verify item quantity unchanged
      expect(stateAfter[itemId].quantity).toBe(stateBefore[itemId].quantity);
    });

    test('should handle multiple items in character inventory correctly', () => {
      const items = [];
      for (let i = 0; i < 5; i++) {
        const itemId = useInventoryStore.getState().createItem({
          name: `Item ${i}`,
          description: `Description ${i}`,
          categoryId: 'cat-1',
          quantity: 1,
        });
        items.push(itemId);
        useInventoryStore.getState().addItemToCharacter('char-1', itemId);
      }

      const characterItems = useInventoryStore.getState().getCharacterItems('char-1');
      expect(characterItems).toHaveLength(5);

      // Remove middle item
      useInventoryStore.getState().removeItemFromCharacter('char-1', items[2]);
      const updatedItems = useInventoryStore.getState().getCharacterItems('char-1');
      expect(updatedItems).toHaveLength(4);
      expect(updatedItems.find(item => item.id === items[2])).toBeUndefined();
    });

    test('should handle item quantity operations on non-existent items', () => {
      useInventoryStore.getState().addQuantity('non-existent-id', 5);
      const state = useInventoryStore.getState();

      expect(state.error).toMatchObject({
        title: 'Item Not Found',
        message: 'The specified item could not be found',
        type: 'validation',
      });
    });

    test('should properly clean up when character inventory is cleared', () => {
      const itemIds = [];
      for (let i = 0; i < 3; i++) {
        const itemId = useInventoryStore.getState().createItem({
          name: `Item ${i}`,
          description: `Description ${i}`,
          categoryId: 'cat-1',
          quantity: 1,
        });
        itemIds.push(itemId);
        useInventoryStore.getState().addItemToCharacter('char-1', itemId);
      }

      useInventoryStore.getState().clearCharacterInventory('char-1');
      const state = useInventoryStore.getState();

      // Items should still exist in global store
      itemIds.forEach(itemId => {
        expect(state.items[itemId]).toBeDefined();
      });

      // But character inventory should be empty
      expect(state.characterInventories['char-1']).toEqual([]);
    });
  });
});
