// src/lib/narrative/__tests__/itemAcquisitionProcessor.test.ts

import { processAcquiredItems } from '../itemAcquisitionProcessor';
import { useInventoryStore } from '@/state/inventoryStore';
import { categorizeInventoryItemClient } from '@/lib/inventory/categorizeInventoryItemClient';
import type { AcquiredItemMetadata } from '@/types/narrative.types';
import { mockZustandStore, createMockInventoryStore } from '@/lib/test-utils';
import type { InventoryItem } from '@/types/inventory.types';

// Mock the dependencies
jest.mock('@/state/inventoryStore');
jest.mock('@/lib/inventory/categorizeInventoryItemClient');
jest.mock('@/lib/services/itemImageService', () => ({
  itemImageService: {
    generateForItem: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('itemAcquisitionProcessor', () => {
  let mockAddItem: jest.Mock;
  let mockGetCharacterItems: jest.Mock;
  let mockUpdateItemQuantity: jest.Mock;
  const mockCategorize = categorizeInventoryItemClient as jest.MockedFunction<
    typeof categorizeInventoryItemClient
  >;
  let warnSpy: jest.SpyInstance;
  let characterItems: InventoryItem[];

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    characterItems = [] as InventoryItem[];

    mockAddItem = jest.fn((characterId: string, payload: Partial<InventoryItem>) => {
      const id = `item-${characterItems.length + 1}`;
      characterItems.push({
        ...payload,
        id,
        categoryId: payload.categorization?.categoryId || (payload as InventoryItem).categoryId || 'uncategorized',
        quantity: payload.quantity ?? 1,
      } as InventoryItem);
      return id;
    });

    mockGetCharacterItems = jest.fn(() => characterItems);

    mockUpdateItemQuantity = jest.fn((id: string, quantity: number) => {
      const target = characterItems.find((item) => item.id === id);
      if (target) {
        target.quantity = quantity;
      }
    });

    mockZustandStore(
      useInventoryStore as jest.MockedFunction<typeof useInventoryStore>,
      createMockInventoryStore({
        addItem: mockAddItem,
        getCharacterItems: mockGetCharacterItems,
        updateItemQuantity: mockUpdateItemQuantity,
      })
    );
  });

  afterEach(() => {
    warnSpy?.mockRestore();
  });

  describe('processAcquiredItems', () => {
    it('adds item to inventory when AI returns item metadata', async () => {
      const itemMetadata: AcquiredItemMetadata = {
        name: 'Healing Potion',
        description: 'A red vial that restores health',
        quantity: 1,
        acquisitionMethod: 'loot',
      };

      mockCategorize.mockResolvedValue({
        categoryId: 'consumables',
        source: 'ai',
        confidence: 0.95,
        rationale: 'Consumable healing item',
        classifiedAt: new Date().toISOString(),
      });

      await processAcquiredItems(
        [itemMetadata],
        'character-123',
        'session-456'
      );

      expect(mockCategorize).toHaveBeenCalledWith({
        name: 'Healing Potion',
        description: 'A red vial that restores health',
      });
      expect(mockAddItem).toHaveBeenCalledWith('character-123', {
        name: 'Healing Potion',
        description: 'A red vial that restores health',
        quantity: 1,
        stackable: true,
        categorization: {
          categoryId: 'consumables',
          source: 'ai',
          confidence: 0.95,
          rationale: 'Consumable healing item',
          classifiedAt: expect.any(String),
        },
        acquisition: {
          method: 'loot',
          quantity: 1,
          sessionId: 'session-456',
          acquiredAt: expect.any(String),
        },
      });
    });

    it('handles multiple items acquired at once', async () => {
      const items: AcquiredItemMetadata[] = [
        {
          name: 'Ancient Sword',
          description: 'A blade from ages past',
          quantity: 1,
          acquisitionMethod: 'quest',
        },
        {
          name: 'Gold Coins',
          description: 'Shiny currency',
          quantity: 50,
          acquisitionMethod: 'loot',
        },
      ];

      mockCategorize
        .mockResolvedValueOnce({
          categoryId: 'equipment',
          source: 'ai',
          confidence: 0.9,
          classifiedAt: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          categoryId: 'valuables',
          source: 'ai',
          confidence: 0.95,
          classifiedAt: new Date().toISOString(),
        });

      await processAcquiredItems(items, 'character-123', 'session-456');

      expect(mockCategorize).toHaveBeenCalledTimes(2);
      expect(mockAddItem).toHaveBeenCalledTimes(2);
      expect(mockAddItem).toHaveBeenNthCalledWith(1, 'character-123', expect.objectContaining({
        name: 'Ancient Sword',
        quantity: 1,
      }));
      expect(mockAddItem).toHaveBeenNthCalledWith(2, 'character-123', expect.objectContaining({
        name: 'Gold Coins',
        quantity: 50,
      }));
    });

    it('correctly handles quantity for stackable items', async () => {
      const itemMetadata: AcquiredItemMetadata = {
        name: 'Health Potion',
        description: 'Restores health',
        quantity: 3,
        acquisitionMethod: 'purchase',
      };

      mockCategorize.mockResolvedValue({
        categoryId: 'consumables',
        source: 'ai',
        confidence: 0.9,
        classifiedAt: new Date().toISOString(),
      });

      await processAcquiredItems(
        [itemMetadata],
        'character-123',
        'session-456'
      );

      expect(mockAddItem).toHaveBeenCalledWith(
        'character-123',
        expect.objectContaining({
          quantity: 3,
          acquisition: expect.objectContaining({
            quantity: 3,
          }),
        })
      );
    });

    it('uses fallback categorization when AI categorizer fails', async () => {
      const itemMetadata: AcquiredItemMetadata = {
        name: 'Strange Object',
        description: 'Cannot identify this item',
        quantity: 1,
        acquisitionMethod: 'loot',
      };

      mockCategorize.mockRejectedValue(new Error('Categorization failed'));

      await processAcquiredItems(
        [itemMetadata],
        'character-123',
        'session-456'
      );

      expect(mockAddItem).toHaveBeenCalledWith(
        'character-123',
        expect.objectContaining({
          categorization: expect.objectContaining({
            categoryId: 'miscellaneous',
            source: 'fallback',
          }),
        })
      );
    });

    it('handles vague descriptions by using unknown method', async () => {
      const itemMetadata: AcquiredItemMetadata = {
        name: 'Some Supplies',
        description: 'Various useful items',
        quantity: 1,
        // No acquisitionMethod specified
      };

      mockCategorize.mockResolvedValue({
        categoryId: 'miscellaneous',
        source: 'ai',
        confidence: 0.5,
        classifiedAt: new Date().toISOString(),
      });

      await processAcquiredItems(
        [itemMetadata],
        'character-123',
        'session-456'
      );

      expect(mockAddItem).toHaveBeenCalledWith(
        'character-123',
        expect.objectContaining({
          acquisition: expect.objectContaining({
            method: 'unknown',
          }),
        })
      );
    });

    it('does nothing when no items are provided', async () => {
      await processAcquiredItems([], 'character-123', 'session-456');

      expect(mockCategorize).not.toHaveBeenCalled();
      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('continues processing remaining items if one fails', async () => {
      const items: AcquiredItemMetadata[] = [
        {
          name: 'Valid Item',
          description: 'A normal item',
          quantity: 1,
          acquisitionMethod: 'loot',
        },
        {
          name: 'Problematic Item',
          description: 'This will fail',
          quantity: 1,
          acquisitionMethod: 'loot',
        },
      ];

      mockCategorize
        .mockResolvedValueOnce({
          categoryId: 'equipment',
          source: 'ai',
          confidence: 0.9,
          classifiedAt: new Date().toISOString(),
        });

      // Second categorization succeeds but addItem fails
      mockCategorize.mockResolvedValueOnce({
        categoryId: 'equipment',
        source: 'ai',
        confidence: 0.9,
        classifiedAt: new Date().toISOString(),
      });

      mockAddItem
        .mockReturnValueOnce('item-1') // First succeeds
        .mockImplementationOnce(() => {
          throw new Error('Failed to add item');
        });

      await processAcquiredItems(items, 'character-123', 'session-456');

      // Both categorizations should have been attempted
      expect(mockCategorize).toHaveBeenCalledTimes(2);
      // Both additions should have been attempted
      expect(mockAddItem).toHaveBeenCalledTimes(2);
    });

    it('splits multi-quantity equipment into individual items', async () => {
      const itemMetadata: AcquiredItemMetadata = {
        name: 'Iron Dagger',
        description: 'A basic dagger',
        quantity: 3,
        acquisitionMethod: 'loot',
      };

      mockCategorize.mockResolvedValue({
        categoryId: 'equipment',
        source: 'ai',
        confidence: 0.9,
        classifiedAt: new Date().toISOString(),
      });

      await processAcquiredItems(
        [itemMetadata],
        'character-123',
        'session-456'
      );

      // Should be called 3 times - once for each dagger
      expect(mockAddItem).toHaveBeenCalledTimes(3);

      // Each call should be for a single item
      expect(mockAddItem).toHaveBeenNthCalledWith(1, 'character-123', expect.objectContaining({
        name: 'Iron Dagger',
        quantity: 1,
        stackable: false,
      }));
      expect(mockAddItem).toHaveBeenNthCalledWith(2, 'character-123', expect.objectContaining({
        name: 'Iron Dagger',
        quantity: 1,
        stackable: false,
      }));
      expect(mockAddItem).toHaveBeenNthCalledWith(3, 'character-123', expect.objectContaining({
        name: 'Iron Dagger',
        quantity: 1,
        stackable: false,
      }));
    });

    it('deduplicates identical stackable items in the same batch', async () => {
      const items: AcquiredItemMetadata[] = [
        { name: 'Health Potion', quantity: 2, acquisitionMethod: 'loot' },
        { name: 'Health Potion', quantity: 3, acquisitionMethod: 'loot' },
      ];

      mockCategorize.mockResolvedValue({
        categoryId: 'consumables',
        source: 'ai',
        confidence: 0.95,
        classifiedAt: new Date().toISOString(),
      });

      await processAcquiredItems(items, 'character-123', 'session-456');

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith(
        'character-123',
        expect.objectContaining({
          name: 'Health Potion',
          quantity: 5,
          acquisition: expect.objectContaining({ quantity: 5 }),
        })
      );
      expect(mockUpdateItemQuantity).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('deduplicates identical equipment in the same batch and keeps one', async () => {
      const items: AcquiredItemMetadata[] = [
        { name: 'Iron Sword', description: 'A basic sword' },
        { name: 'Iron Sword', description: 'A basic sword' },
      ];

      mockCategorize.mockResolvedValue({
        categoryId: 'equipment',
        source: 'ai',
        confidence: 0.9,
        classifiedAt: new Date().toISOString(),
      });

      await processAcquiredItems(items, 'character-123', 'session-456');

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalled();
    });

    it('merges equipment with the same name even when descriptions differ', async () => {
      const items: AcquiredItemMetadata[] = [
        { name: 'Sword', description: 'Sharp edge' },
        { name: 'Sword', description: 'Rusty blade' },
      ];

      mockCategorize.mockResolvedValue({
        categoryId: 'equipment',
        source: 'ai',
        confidence: 0.9,
        classifiedAt: new Date().toISOString(),
      });

      await processAcquiredItems(items, 'character-123', 'session-456');

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalled();
      const storedDescription = characterItems[0]?.description;
      expect(storedDescription === 'Sharp edge' || storedDescription === 'Rusty blade').toBe(true);
    });

    it('keeps stackable items separate when descriptions differ', async () => {
      const items: AcquiredItemMetadata[] = [
        { name: 'Health Potion', description: 'Small', quantity: 1 },
        { name: 'Health Potion', description: 'Large', quantity: 1 },
      ];

      mockCategorize.mockResolvedValue({
        categoryId: 'consumables',
        source: 'ai',
        confidence: 0.9,
        classifiedAt: new Date().toISOString(),
      });

      await processAcquiredItems(items, 'character-123', 'session-456');

      expect(mockAddItem).toHaveBeenCalledTimes(2);
    });

    it('prevents duplicate equipment across segments', async () => {
      const item: AcquiredItemMetadata = {
        name: 'Iron Sword',
        description: 'A sturdy blade',
      };

      mockCategorize.mockResolvedValue({
        categoryId: 'equipment',
        source: 'ai',
        confidence: 0.9,
        classifiedAt: new Date().toISOString(),
      });

      await processAcquiredItems([item], 'character-123', 'session-456');
      await processAcquiredItems([item], 'character-123', 'session-456');

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockUpdateItemQuantity).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('prevents duplicate equipment even if AI category changes across segments', async () => {
      const item: AcquiredItemMetadata = {
        name: 'Rusted Hunting Knife',
        description: 'A worn but sharp hunting knife',
      };

      mockCategorize
        .mockResolvedValueOnce({
          categoryId: 'equipment',
          source: 'ai',
          confidence: 0.9,
          classifiedAt: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          categoryId: 'miscellaneous',
          source: 'ai',
          confidence: 0.4,
          classifiedAt: new Date().toISOString(),
        });

      await processAcquiredItems([item], 'character-123', 'session-456');
      await processAcquiredItems([item], 'character-123', 'session-789');

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockUpdateItemQuantity).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
