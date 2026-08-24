// Test inventory store item usage functionality
// Verifies that using items correctly updates inventory state
import { useInventoryStore } from '../inventoryStore';
import { useCharacterStore } from '../characterStore';
import { useWorldStore } from '../worldStore';
describe('InventoryStore - Item Usage', () => {
  let worldId: string;
  let characterId: string;
  beforeEach(() => {
    // Reset stores
    useInventoryStore.getState().reset();
    useCharacterStore.getState().reset();
    useWorldStore.getState().reset();
    // Create test world
    worldId = useWorldStore.getState().create({
      name: 'Test World',
      description: 'A world for testing',
      genre: 'fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 10,
        maxSkills: 10,
        attributePointPool: 10,
        skillPointPool: 10,
      },
    });
    // Create test character
    characterId = useCharacterStore.getState().create({
      name: 'Test Hero',
      worldId,
      description: 'A hero for testing purposes',
      level: 1,
      isPlayer: true,
      status: {
        conditions: [],
      },
      inventory: {
        characterId: '',
        items: [],
        capacity: 0,
        categories: [],
        itemOrder: [],
      },
      background: {
        history: 'A brave adventurer',
        personality: 'Courageous',
        goals: [],
        fears: [],
        relationships: [],
      },
      attributes: [],
      skills: [],
      derivedStats: [],
    });
  });
  describe('Using consumable items', () => {
    it('should reduce quantity by 1 when using a consumable item', () => {
      // Add consumable item with quantity 3
      const itemId = useInventoryStore.getState().addItem(characterId, {
        name: 'Health Potion',
        description: 'Restores health',
        stackable: true,
        quantity: 3,
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'purchase',
          acquiredAt: new Date().toISOString(),
          quantity: 3,
        },
      });
      // Use the item
      const result = useInventoryStore.getState().useItem(characterId, itemId);
      // Verify quantity reduced
      expect(result.success).toBe(true);
      expect(result.previousQuantity).toBe(3);
      const item = useInventoryStore.getState().items[itemId];
      expect(item.quantity).toBe(2);
    });
    it('should remove item completely when using the last consumable', () => {
      // Add consumable item with quantity 1
      const itemId = useInventoryStore.getState().addItem(characterId, {
        name: 'Antidote',
        stackable: true,
        quantity: 1,
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'loot',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        },
      });
      // Use the last item
      const result = useInventoryStore.getState().useItem(characterId, itemId);
      // Verify item removed
      expect(result.success).toBe(true);
      const item = useInventoryStore.getState().items[itemId];
      expect(item).toBeUndefined();
      // Verify character no longer has this item
      const characterItems = useInventoryStore
        .getState()
        .getCharacterItems(characterId);
      expect(characterItems.find((i) => i.id === itemId)).toBeUndefined();
    });
    it('should not reduce quantity for non-consumable items', () => {
      // Add non-consumable item
      const itemId = useInventoryStore.getState().addItem(characterId, {
        name: 'Magic Lantern',
        description: 'Provides light',
        stackable: false,
        categorization: {
          categoryId: 'equipment',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'quest',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        },
      });
      // Use the non-consumable item
      const result = useInventoryStore.getState().useItem(characterId, itemId);
      // Verify quantity unchanged
      expect(result.success).toBe(true);
      expect(result.previousQuantity).toBe(1);
      const item = useInventoryStore.getState().items[itemId];
      expect(item).toBeDefined();
      expect(item.quantity).toBe(1);
    });
    it('should consume stackable items even if not categorized as consumables', () => {
      // Add stackable miscellaneous item (e.g., throwing stones)
      const itemId = useInventoryStore.getState().addItem(characterId, {
        name: 'Grey Stone',
        description: 'Smooth stone with faint light',
        stackable: true,
        quantity: 5,
        categorization: {
          categoryId: 'miscellaneous',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'loot',
          acquiredAt: new Date().toISOString(),
          quantity: 5,
        },
      });
      const result = useInventoryStore.getState().useItem(characterId, itemId);
      expect(result.success).toBe(true);
      expect(result.wasConsumed).toBe(true);
      expect(result.remainingQuantity).toBe(4);
      expect(result.previousQuantity).toBe(5);
      const item = useInventoryStore.getState().items[itemId];
      expect(item).toBeDefined();
      expect(item?.quantity).toBe(4);
    });
  });
  describe('Error handling', () => {
    it('should return error when item does not exist', () => {
      const result = useInventoryStore
        .getState()
        .useItem(characterId, 'non-existent-item');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('validation');
    });
    it('should return error when character does not own the item', () => {
      // Create second character
      const character2Id = useCharacterStore.getState().create({
        name: 'Other Hero',
        worldId,
        description: 'Another hero for testing purposes',
        level: 1,
        isPlayer: false,
        status: {
          conditions: [],
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 0,
          categories: [],
          itemOrder: [],
        },
        background: {
          history: 'Another adventurer',
          personality: 'Mysterious',
          goals: [],
          fears: [],
          relationships: [],
        },
        attributes: [],
        skills: [],
        derivedStats: [],
      });
      // Add item to first character
      const itemId = useInventoryStore.getState().addItem(characterId, {
        name: 'Sword',
        stackable: false,
        categorization: {
          categoryId: 'equipment',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'loot',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        },
      });
      // Try to use with second character
      const result = useInventoryStore.getState().useItem(character2Id, itemId);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
    it('should return error when item quantity is 0', () => {
      // This shouldn't happen in normal flow, but test defensive coding
      const itemId = useInventoryStore.getState().addItem(characterId, {
        name: 'Empty Bottle',
        stackable: true,
        quantity: 1,
        categorization: {
          categoryId: 'miscellaneous',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'loot',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        },
      });
      // Manually set quantity to 0 (simulating edge case)
      useInventoryStore.getState().updateItem(itemId, { quantity: 0 });
      // Try to use item with 0 quantity
      const result = useInventoryStore.getState().useItem(characterId, itemId);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  describe('Usage result metadata', () => {
    it('should return usage metadata including item name and category', () => {
      const itemId = useInventoryStore.getState().addItem(characterId, {
        name: 'Healing Salve',
        description: 'Heals wounds',
        stackable: true,
        quantity: 2,
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'craft',
          acquiredAt: new Date().toISOString(),
          quantity: 2,
        },
      });
      const result = useInventoryStore.getState().useItem(characterId, itemId);
      expect(result.success).toBe(true);
      expect(result.itemName).toBe('Healing Salve');
      expect(result.categoryId).toBe('consumables');
      expect(result.wasConsumed).toBe(true);
      expect(result.remainingQuantity).toBe(1);
      expect(result.previousQuantity).toBe(2);
    });
  });
});
