// src/types/__tests__/inventory.types.test.ts
import { 
  Inventory, 
  InventoryItem, 
  InventoryCategory 
} from '../inventory.types';

describe('Inventory Types', () => {
  describe('Inventory interface', () => {
    test('should create a valid Inventory object', () => {
      const inventory: Inventory = {
        characterId: 'char-1',
        items: [],
        capacity: 20,
        categories: []
      };

      expect(inventory.characterId).toBe('char-1');
      expect(inventory.capacity).toBe(20);
    });
  });

  describe('InventoryItem interface', () => {
    test('should create an item with minimal properties', () => {
      const item: InventoryItem = {
        id: 'item-1',
        name: 'Healing Potion',
        categoryId: 'cat-consumables',
        quantity: 3
      };

      expect(item.name).toBe('Healing Potion');
      expect(item.quantity).toBe(3);
    });

    test('should create an item with description', () => {
      const item: InventoryItem = {
        id: 'item-2',
        name: 'Rope',
        description: '50 feet of sturdy hemp rope',
        categoryId: 'cat-tools',
        quantity: 1
      };

      expect(item.description).toBe('50 feet of sturdy hemp rope');
    });
  });

  describe('InventoryCategory interface', () => {
    test('should create a category with hierarchy', () => {
      const category: InventoryCategory = {
        id: 'cat-weapons',
        name: 'Weapons',
        icon: 'sword',
        sortOrder: 1,
        parentCategoryId: 'cat-equipment'
      };

      expect(category.parentCategoryId).toBe('cat-equipment');
      expect(category.sortOrder).toBe(1);
    });
  });
});
