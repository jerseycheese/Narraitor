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
        stackable: true,
      };

      const itemId = useInventoryStore.getState().createItem(itemData);
      const state = useInventoryStore.getState();

      expect(itemId).toBeDefined();
      expect(state.items[itemId]).toBeDefined();
      expect(state.items[itemId].name).toBe('Health Potion');
      expect(state.items[itemId].quantity).toBe(1);
      expect(state.items[itemId].categoryId).toBe('cat-1');
      expect(state.items[itemId].stackable).toBe(true);
      expect(state.items[itemId].createdAt).toBeDefined();
      expect(state.items[itemId].updatedAt).toBeDefined();
    });

    test('should create stackable item with quantity greater than 1', () => {
      const itemData = {
        name: 'Gold Coins',
        description: 'Currency',
        categoryId: 'cat-currency',
        quantity: 100,
        stackable: true,
      };

      const itemId = useInventoryStore.getState().createItem(itemData);
      const state = useInventoryStore.getState();

      expect(state.items[itemId].quantity).toBe(100);
      expect(state.items[itemId].stackable).toBe(true);
    });

    test('should validate required fields', () => {
      const invalidItemData = {
        name: '',
        description: '',
        categoryId: '',
        quantity: 1,
        stackable: true,
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
        stackable: true,
      };

      expect(() => {
        useInventoryStore.getState().createItem(invalidItemData);
      }).toThrow('Item quantity must be greater than zero');
    });

    test('should reject invalid quantity (negative)', () => {
      const invalidItemData = {
        name: 'Invalid Item',
        description: 'Has negative quantity',
        categoryId: 'cat-1',
        quantity: -5,
        stackable: true,
      };

      expect(() => {
        useInventoryStore.getState().createItem(invalidItemData);
      }).toThrow('Item quantity must be greater than zero');
    });

    test('should require stackable property', () => {
      const invalidItemData = {
        name: 'Invalid Item',
        description: 'Missing stackable',
        categoryId: 'cat-1',
        quantity: 1,
      };

      expect(() => {
        useInventoryStore.getState().createItem(invalidItemData as any);
      }).toThrow('Stackable property is required');
    });
  });

  describe('updateItem', () => {
    test('should update existing item', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Original Sword',
        description: 'Original description',
        categoryId: 'cat-weapon',
        quantity: 1,
        stackable: false,
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
        message: 'The specified item could not be found.',
        type: 'validation',
      });
    });

    test('should reject negative quantity updates', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Test Item',
        description: 'Test',
        categoryId: 'cat-1',
        quantity: 5,
        stackable: true,
      });

      useInventoryStore.getState().updateItem(itemId, { quantity: -1 });
      const state = useInventoryStore.getState();

      expect(state.error).toMatchObject({
        title: 'Invalid Quantity',
        message: 'Item quantity cannot be negative.',
        type: 'validation',
      });
    });
  });

  describe('deleteItem', () => {
    test('should remove item from store', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'To Delete',
        description: 'Item to be deleted',
        categoryId: 'cat-1',
        quantity: 1,
        stackable: false,
      });

      useInventoryStore.getState().deleteItem(itemId);
      const state = useInventoryStore.getState();

      expect(state.items[itemId]).toBeUndefined();
    });

    test('should clear currentEntityId if deleted item was current', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Current Item',
        description: 'Currently selected item',
        categoryId: 'cat-1',
        quantity: 1,
        stackable: false,
      });

      useInventoryStore.getState().setCurrent(itemId);
      useInventoryStore.getState().deleteItem(itemId);
      const state = useInventoryStore.getState();

      expect(state.currentEntityId).toBeNull();
    });

    test('should remove item from character inventories', () => {
      const itemId = useInventoryStore.getState().addItem('char-1', {
        name: 'Shared Item',
        description: 'Item in character inventory',
        categoryId: 'cat-1',
        quantity: 1,
        stackable: false,
      });

      useInventoryStore.getState().deleteItem(itemId);
      const state = useInventoryStore.getState();

      // Character inventory should be deleted when it becomes empty
      expect(state.characterInventories['char-1']).toBeUndefined();
    });
  });

  describe('setCurrent', () => {
    test('should set current entity ID', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Current Item',
        description: 'Item to be selected',
        categoryId: 'cat-1',
        quantity: 1,
        stackable: false,
      });

      useInventoryStore.getState().setCurrent(itemId);
      const state = useInventoryStore.getState();

      expect(state.currentEntityId).toBe(itemId);
    });

    test('should handle non-existent item', () => {
      useInventoryStore.getState().setCurrent('non-existent-id');
      const state = useInventoryStore.getState();
      expect(state.error).toMatchObject({
        title: 'Item Not Found',
        message: 'The specified item could not be found.',
        type: 'validation',
      });
      expect(state.currentEntityId).toBeNull();
    });
  });

  describe('updateItemQuantity', () => {
    test('should set absolute quantity for stackable items', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Arrow',
        description: 'Wooden arrow',
        categoryId: 'cat-ammo',
        quantity: 10,
        stackable: true,
      });

      useInventoryStore.getState().updateItemQuantity(itemId, 15);
      const state = useInventoryStore.getState();

      expect(state.items[itemId].quantity).toBe(15);
    });

    test('should decrease item quantity', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Arrow',
        description: 'Wooden arrow',
        categoryId: 'cat-ammo',
        quantity: 10,
        stackable: true,
      });

      useInventoryStore.getState().updateItemQuantity(itemId, 7);
      const state = useInventoryStore.getState();

      expect(state.items[itemId].quantity).toBe(7);
    });

    test('should reject zero quantity', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Arrow',
        description: 'Wooden arrow',
        categoryId: 'cat-ammo',
        quantity: 5,
        stackable: true,
      });

      useInventoryStore.getState().updateItemQuantity(itemId, 0);
      const state = useInventoryStore.getState();

      expect(state.error).toMatchObject({
        title: 'Invalid Quantity',
        message: 'Item quantity must be greater than zero.',
        type: 'validation',
      });
      // Item quantity should remain unchanged
      expect(state.items[itemId].quantity).toBe(5);
    });

    test('should reject negative quantity', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Item',
        description: 'Test item',
        categoryId: 'cat-1',
        quantity: 5,
        stackable: true,
      });

      useInventoryStore.getState().updateItemQuantity(itemId, -3);
      const state = useInventoryStore.getState();

      expect(state.error).toMatchObject({
        title: 'Invalid Quantity',
        message: 'Item quantity must be greater than zero.',
        type: 'validation',
      });
      expect(state.items[itemId].quantity).toBe(5);
    });

    test('should handle non-existent item', () => {
      useInventoryStore.getState().updateItemQuantity('non-existent-id', 5);
      const state = useInventoryStore.getState();

      expect(state.error).toMatchObject({
        title: 'Item Not Found',
        message: 'The specified item could not be found.',
        type: 'validation',
      });
    });

    test('should respect max stack limit', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Arrow',
        description: 'Wooden arrow',
        categoryId: 'cat-ammo',
        quantity: 10,
        stackable: true,
        maxStack: 20,
      });

      useInventoryStore.getState().updateItemQuantity(itemId, 25);
      const state = useInventoryStore.getState();

      expect(state.error).toMatchObject({
        title: 'Stack Limit Exceeded',
        message: 'Quantity cannot exceed maximum stack size of 20.',
        type: 'validation',
      });
      expect(state.items[itemId].quantity).toBe(10);
    });
  });

  describe('character inventory management - addItem', () => {
    test('should create and add item to character inventory', () => {
      const itemId = useInventoryStore.getState().addItem('char-1', {
        name: 'Sword',
        description: 'Sharp sword',
        categoryId: 'cat-weapon',
        quantity: 1,
        stackable: false,
      });

      const state = useInventoryStore.getState();

      expect(state.items[itemId]).toBeDefined();
      expect(state.characterInventories['char-1']).toContain(itemId);
    });

    test('should stack items with same name and category', () => {
      const item1Id = useInventoryStore.getState().addItem('char-1', {
        name: 'Gold Coins',
        description: 'Currency',
        categoryId: 'cat-currency',
        quantity: 10,
        stackable: true,
      });

      const item2Id = useInventoryStore.getState().addItem('char-1', {
        name: 'Gold Coins',
        description: 'Currency',
        categoryId: 'cat-currency',
        quantity: 5,
        stackable: true,
      });

      const state = useInventoryStore.getState();

      // Should return same ID and increase quantity
      expect(item1Id).toBe(item2Id);
      expect(state.items[item1Id].quantity).toBe(15);
      expect(state.characterInventories['char-1']).toHaveLength(1);
    });

    test('should respect max stack limit when adding', () => {
      const item1Id = useInventoryStore.getState().addItem('char-1', {
        name: 'Arrow',
        description: 'Wooden arrow',
        categoryId: 'cat-ammo',
        quantity: 18,
        stackable: true,
        maxStack: 20,
      });

      useInventoryStore.getState().addItem('char-1', {
        name: 'Arrow',
        description: 'Wooden arrow',
        categoryId: 'cat-ammo',
        quantity: 5,
        stackable: true,
        maxStack: 20,
      });

      const state = useInventoryStore.getState();

      expect(state.error).toMatchObject({
        title: 'Stack Limit Exceeded',
        message: 'Cannot add more items. Maximum stack size is 20.',
        type: 'validation',
      });
      // Original quantity unchanged
      expect(state.items[item1Id].quantity).toBe(18);
    });

    test('should validate item data before adding', () => {
      const itemId = useInventoryStore.getState().addItem('char-1', {
        name: '',
        description: 'Invalid',
        categoryId: 'cat-1',
        quantity: 1,
        stackable: true,
      });

      const state = useInventoryStore.getState();

      expect(itemId).toBe('');
      expect(state.error).toMatchObject({
        title: 'Validation Error',
        message: 'Item name is required',
        type: 'validation',
      });
    });
  });

  describe('character inventory management - removeItem', () => {
    test('should remove item from character inventory', () => {
      const itemId = useInventoryStore.getState().addItem('char-1', {
        name: 'Sword',
        description: 'Sharp sword',
        categoryId: 'cat-weapon',
        quantity: 1,
        stackable: false,
      });

      useInventoryStore.getState().removeItem('char-1', itemId);
      const state = useInventoryStore.getState();

      // Character inventory should be deleted when it becomes empty
      expect(state.characterInventories['char-1']).toBeUndefined();
      expect(state.items[itemId]).toBeUndefined();
    });

    test('should remove partial quantity from stackable item', () => {
      const itemId = useInventoryStore.getState().addItem('char-1', {
        name: 'Arrow',
        description: 'Wooden arrow',
        categoryId: 'cat-ammo',
        quantity: 10,
        stackable: true,
      });

      useInventoryStore.getState().removeItem('char-1', itemId, 3);
      const state = useInventoryStore.getState();

      expect(state.items[itemId].quantity).toBe(7);
      expect(state.characterInventories['char-1']).toContain(itemId);
    });

    test('should delete item when removing all quantity', () => {
      const itemId = useInventoryStore.getState().addItem('char-1', {
        name: 'Arrow',
        description: 'Wooden arrow',
        categoryId: 'cat-ammo',
        quantity: 5,
        stackable: true,
      });

      useInventoryStore.getState().removeItem('char-1', itemId, 5);
      const state = useInventoryStore.getState();

      expect(state.items[itemId]).toBeUndefined();
      // Character inventory should be deleted when it becomes empty
      expect(state.characterInventories['char-1']).toBeUndefined();
    });

    test('should handle removing more quantity than available', () => {
      const itemId = useInventoryStore.getState().addItem('char-1', {
        name: 'Arrow',
        description: 'Wooden arrow',
        categoryId: 'cat-ammo',
        quantity: 5,
        stackable: true,
      });

      useInventoryStore.getState().removeItem('char-1', itemId, 10);
      const state = useInventoryStore.getState();

      expect(state.error).toMatchObject({
        title: 'Insufficient Quantity',
        message: 'Cannot remove 10 items. Only 5 available.',
        type: 'validation',
      });
      // Item quantity should remain unchanged
      expect(state.items[itemId].quantity).toBe(5);
    });

    test('should handle non-existent item', () => {
      useInventoryStore.getState().removeItem('char-1', 'non-existent-id');
      const state = useInventoryStore.getState();

      expect(state.error).toMatchObject({
        title: 'Item Not Found',
        message: 'The specified item could not be found.',
        type: 'validation',
      });
    });

    test('should handle item not in character inventory', () => {
      const itemId = useInventoryStore.getState().createItem({
        name: 'Sword',
        description: 'Sharp sword',
        categoryId: 'cat-weapon',
        quantity: 1,
        stackable: false,
      });

      useInventoryStore.getState().removeItem('char-1', itemId);
      const state = useInventoryStore.getState();

      expect(state.error).toMatchObject({
        title: 'Item Not In Inventory',
        message: "The specified item is not in this character's inventory.",
        type: 'validation',
      });
    });
  });

  describe('character inventory management - getCharacterItems', () => {
    test('should get all items for a character', () => {
      const item1Id = useInventoryStore.getState().addItem('char-1', {
        name: 'Sword',
        description: 'Sharp sword',
        categoryId: 'cat-weapon',
        quantity: 1,
        stackable: false,
      });

      const item2Id = useInventoryStore.getState().addItem('char-1', {
        name: 'Shield',
        description: 'Sturdy shield',
        categoryId: 'cat-armor',
        quantity: 1,
        stackable: false,
      });

      const items = useInventoryStore.getState().getCharacterItems('char-1');

      expect(items).toHaveLength(2);
      expect(items[0].id).toBe(item1Id);
      expect(items[1].id).toBe(item2Id);
    });

    test('should return empty array for character with no items', () => {
      const items = useInventoryStore.getState().getCharacterItems('char-nonexistent');
      expect(items).toEqual([]);
    });
  });

  describe('character inventory management - clearCharacterInventory', () => {
    test('should clear all items from character inventory', () => {
      const item1Id = useInventoryStore.getState().addItem('char-1', {
        name: 'Sword',
        description: 'Sharp sword',
        categoryId: 'cat-weapon',
        quantity: 1,
        stackable: false,
      });

      const item2Id = useInventoryStore.getState().addItem('char-1', {
        name: 'Shield',
        description: 'Sturdy shield',
        categoryId: 'cat-armor',
        quantity: 1,
        stackable: false,
      });

      useInventoryStore.getState().clearCharacterInventory('char-1');
      const state = useInventoryStore.getState();

      expect(state.characterInventories['char-1']).toBeUndefined();
      expect(state.items[item1Id]).toBeUndefined();
      expect(state.items[item2Id]).toBeUndefined();
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
      const itemId = useInventoryStore.getState().addItem('char-1', {
        name: 'Test Item',
        description: 'Item for reset test',
        categoryId: 'cat-1',
        quantity: 5,
        stackable: true,
      });
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
      expect(state.currentEntityId).toBeNull();
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });

  describe('edge cases and data consistency', () => {
    test('should maintain consistent state when operations fail', () => {
      const itemId = useInventoryStore.getState().addItem('char-1', {
        name: 'Test Item',
        description: 'Test',
        categoryId: 'cat-1',
        quantity: 5,
        stackable: true,
      });

      const stateBefore = JSON.parse(JSON.stringify(useInventoryStore.getState().items));

      // Try to remove more than available
      useInventoryStore.getState().removeItem('char-1', itemId, 10);

      const stateAfter = useInventoryStore.getState().items;

      // Verify item quantity unchanged
      expect(stateAfter[itemId].quantity).toBe(stateBefore[itemId].quantity);
    });

    test('should handle multiple items in character inventory correctly', () => {
      const items = [];
      for (let i = 0; i < 5; i++) {
        const itemId = useInventoryStore.getState().addItem('char-1', {
          name: `Item ${i}`,
          description: `Description ${i}`,
          categoryId: 'cat-1',
          quantity: 1,
          stackable: false,
        });
        items.push(itemId);
      }

      const characterItems = useInventoryStore.getState().getCharacterItems('char-1');
      expect(characterItems).toHaveLength(5);

      // Remove middle item
      useInventoryStore.getState().removeItem('char-1', items[2]);
      const updatedItems = useInventoryStore.getState().getCharacterItems('char-1');
      expect(updatedItems).toHaveLength(4);
      expect(updatedItems.find(item => item.id === items[2])).toBeUndefined();
    });

    test('should properly clean up when character inventory is cleared', () => {
      const itemIds = [];
      for (let i = 0; i < 3; i++) {
        const itemId = useInventoryStore.getState().addItem('char-1', {
          name: `Item ${i}`,
          description: `Description ${i}`,
          categoryId: 'cat-1',
          quantity: 1,
          stackable: false,
        });
        itemIds.push(itemId);
      }

      useInventoryStore.getState().clearCharacterInventory('char-1');
      const state = useInventoryStore.getState();

      // Items should be deleted from global store
      itemIds.forEach(itemId => {
        expect(state.items[itemId]).toBeUndefined();
      });

      // And character inventory should be empty
      expect(state.characterInventories['char-1']).toBeUndefined();
    });
  });
});
