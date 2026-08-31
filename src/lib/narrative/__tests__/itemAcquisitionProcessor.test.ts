// src/lib/narrative/__tests__/itemAcquisitionProcessor.test.ts

import { processAcquiredItems } from '../itemAcquisitionProcessor';
import { useInventoryStore } from '@/state/inventoryStore';
import { categorizeInventoryItemsClient } from '@/lib/inventory/categorizeInventoryItemClient';
import { checkItemSimilarityClient } from '@/lib/inventory/checkItemSimilarityClient';
import type { AcquiredItemMetadata } from '@/types/narrative.types';
import { mockZustandStore, createMockInventoryStore } from '@/lib/test-utils';
import type { InventoryItem } from '@/types/inventory.types';
import type { InventoryCategorizationResponse } from '@/lib/inventory/categorizeInventoryItemClient';
import { logger } from '@/lib/utils/logger';

// Mock the dependencies
jest.mock('@/lib/utils/logger');
jest.mock('@/state/inventoryStore');
jest.mock('@/lib/inventory/categorizeInventoryItemClient');
jest.mock('@/lib/inventory/checkItemSimilarityClient');
jest.mock('@/lib/services/itemImageService', () => ({
  itemImageService: {
    generateForItem: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('itemAcquisitionProcessor', () => {
  let mockAddItem: jest.Mock;
  let mockGetCharacterItems: jest.Mock;
  let mockUpdateItemQuantity: jest.Mock;
  const mockCategorizeBatch = categorizeInventoryItemsClient as jest.MockedFunction<
    typeof categorizeInventoryItemsClient
  >;
  // Tests configure per-item categorization through mockCategorize; the batch
  // client mock below fans each batched item out to it so existing single-item
  // expectations (call args, counts, order, rejection) keep working unchanged.
  const mockCategorize = jest.fn<
    Promise<InventoryCategorizationResponse>,
    [{ name: string; description?: string }]
  >();
  const mockCheckSimilarity = checkItemSimilarityClient as jest.MockedFunction<
    typeof checkItemSimilarityClient
  >;
  let characterItems: InventoryItem[];

  beforeEach(() => {
    jest.clearAllMocks();
    characterItems = [] as InventoryItem[];

    // Fan a batched categorization request out to the per-item mockCategorize,
    // preserving order so mockResolvedValueOnce chains line up with inputs. If
    // mockCategorize rejects, the whole batch rejects (matching the real client
    // throwing on a failed request, which the processor then falls back from).
    mockCategorizeBatch.mockImplementation(async (items) => {
      const results: InventoryCategorizationResponse[] = [];
      for (const item of items) {
        results.push(
          await mockCategorize({ name: item.name, description: item.description })
        );
      }
      return results;
    });

    // Mock AI similarity checker with smart matching logic
    mockCheckSimilarity.mockImplementation(async ({ name1, name2 }) => {
      const n1 = name1.toLowerCase();
      const n2 = name2.toLowerCase();

      // Exact match
      if (n1 === n2) return { similar: true, confidence: 1.0, rationale: 'Exact match' };

      // Substring matching (e.g., "Potion" in "Health Potion")
      if (n1.includes(n2) || n2.includes(n1)) {
        return { similar: true, confidence: 0.9, rationale: 'Substring match' };
      }

      // Singular/plural (e.g., "Coin" vs "Coins")
      const s1 = n1.endsWith('s') ? n1.slice(0, -1) : n1;
      const s2 = n2.endsWith('s') ? n2.slice(0, -1) : n2;
      if (s1 === s2 || s1.includes(s2) || s2.includes(s1)) {
        return { similar: true, confidence: 0.85, rationale: 'Singular/plural match' };
      }

      // Not similar
      return { similar: false, confidence: 0.1, rationale: 'Different items' };
    });

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

    it('uses a valid category hint without calling the categorization client', async () => {
      const itemMetadata: AcquiredItemMetadata = {
        name: 'Rusty Key',
        description: 'Opens the ancient door',
        quantity: 1,
        acquisitionMethod: 'loot',
        categoryHint: 'quest-items',
      };

      await processAcquiredItems([itemMetadata], 'character-123', 'session-456');

      expect(mockCategorizeBatch).not.toHaveBeenCalled();
      expect(mockCategorize).not.toHaveBeenCalled();
      expect(mockAddItem).toHaveBeenCalledWith(
        'character-123',
        expect.objectContaining({
          name: 'Rusty Key',
          categorization: expect.objectContaining({
            categoryId: 'quest-items',
            source: 'narrative-context',
          }),
        })
      );
    });

    it('falls back to AI categorization when the hint is invalid', async () => {
      const itemMetadata = {
        name: 'Mystery Box',
        description: 'Unmarked crate',
        quantity: 1,
        acquisitionMethod: 'loot',
        categoryHint: 'not-a-real-category',
      } as unknown as AcquiredItemMetadata;

      mockCategorize.mockResolvedValue({
        categoryId: 'miscellaneous',
        source: 'ai',
        confidence: 0.6,
        classifiedAt: new Date().toISOString(),
      });

      await processAcquiredItems([itemMetadata], 'character-123', 'session-456');

      expect(mockCategorize).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith(
        'character-123',
        expect.objectContaining({
          categorization: expect.objectContaining({ source: 'ai' }),
        })
      );
    });

    it('only sends hint-less items to the batch categorization client', async () => {
      const items: AcquiredItemMetadata[] = [
        {
          name: 'Iron Sword',
          description: 'A sturdy blade',
          quantity: 1,
          acquisitionMethod: 'loot',
          categoryHint: 'equipment',
        },
        {
          name: 'Strange Trinket',
          description: 'Hard to place',
          quantity: 1,
          acquisitionMethod: 'loot',
        },
      ];

      mockCategorize.mockResolvedValue({
        categoryId: 'miscellaneous',
        source: 'ai',
        confidence: 0.5,
        classifiedAt: new Date().toISOString(),
      });

      await processAcquiredItems(items, 'character-123', 'session-456');

      // Batched once, carrying only the hint-less item.
      expect(mockCategorizeBatch).toHaveBeenCalledTimes(1);
      expect(mockCategorizeBatch).toHaveBeenCalledWith([
        { name: 'Strange Trinket', description: 'Hard to place' },
      ]);
      expect(mockAddItem).toHaveBeenCalledTimes(2);
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
      const onError = jest.fn();

      await processAcquiredItems(
        items,
        'character-123',
        'session-456',
        onError
      );

      // Both categorizations should have been attempted
      expect(mockCategorize).toHaveBeenCalledTimes(2);
      // Both additions should have been attempted
      expect(mockAddItem).toHaveBeenCalledTimes(2);
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
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
      expect(logger.warn).not.toHaveBeenCalled();
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
      expect(logger.warn).toHaveBeenCalled();
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
      expect(logger.warn).toHaveBeenCalled();
      const storedDescription = characterItems[0]?.description;
      expect(storedDescription === 'Sharp edge' || storedDescription === 'Rusty blade').toBe(true);
    });

    it('merges stackable items with semantically similar names in the same batch', async () => {
      const items: AcquiredItemMetadata[] = [
        { name: 'Health Potion', description: 'Restores health', quantity: 1 },
        { name: 'Potion', description: 'A healing elixir', quantity: 1 },
      ];

      mockCategorize.mockResolvedValue({
        categoryId: 'consumables',
        source: 'ai',
        confidence: 0.9,
        classifiedAt: new Date().toISOString(),
      });

      await processAcquiredItems(items, 'character-123', 'session-456');

      // Should merge in batch because "Potion" is substring of "Health Potion"
      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith('character-123', expect.objectContaining({
        quantity: 2, // Merged quantity
      }));
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
      expect(logger.warn).toHaveBeenCalled();
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
      expect(logger.warn).toHaveBeenCalled();
    });

    it('deduplicates equipment with semantically similar names (e.g., "Lantern" vs "Rusty Kerosene Lantern")', async () => {
      mockCategorize.mockResolvedValue({
        categoryId: 'equipment',
        source: 'ai',
        confidence: 0.9,
        classifiedAt: new Date().toISOString(),
      });

      // Add "Rusty Kerosene Lantern" first
      await processAcquiredItems(
        [{ name: 'Rusty Kerosene Lantern', description: 'Heavy, glass grimy, and partially filled' }],
        'character-123',
        'session-456'
      );

      // Try to add just "Lantern" - should be detected as duplicate
      await processAcquiredItems(
        [{ name: 'Lantern', description: 'Filled with kerosene' }],
        'character-123',
        'session-456'
      );

      // Should only add once (first item)
      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Item "Lantern" already exists')
      );
    });

    it('deduplicates valuables with semantically similar names (e.g., "Locket" vs "Tarnished Silver Locket")', async () => {
      mockCategorize.mockResolvedValue({
        categoryId: 'valuables',
        source: 'ai',
        confidence: 0.9,
        classifiedAt: new Date().toISOString(),
      });

      // Add "Tarnished Silver Locket" first
      await processAcquiredItems(
        [{ name: 'Tarnished Silver Locket', description: 'Delicate locket on a chain', quantity: 1 }],
        'character-123',
        'session-456'
      );

      // Try to add just "Locket" - should be detected as duplicate and stack
      await processAcquiredItems(
        [{ name: 'Locket', description: 'A simple locket', quantity: 1 }],
        'character-123',
        'session-456'
      );

      // Valuables are stackable, so should merge via semantic matching
      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockUpdateItemQuantity).toHaveBeenCalledWith('item-1', 2);
    });

    it('deduplicates consumables with semantically similar names (e.g., "Potion" vs "Health Potion")', async () => {
      mockCategorize.mockResolvedValue({
        categoryId: 'consumables',
        source: 'ai',
        confidence: 0.9,
        classifiedAt: new Date().toISOString(),
      });

      // Add "Health Potion" first
      await processAcquiredItems(
        [{ name: 'Health Potion', description: 'Restores health', quantity: 2 }],
        'character-123',
        'session-456'
      );

      // Try to add just "Potion" - should be detected as duplicate and stack
      await processAcquiredItems(
        [{ name: 'Potion', description: 'A healing potion', quantity: 1 }],
        'character-123',
        'session-456'
      );

      // Should only add once but update quantity
      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockUpdateItemQuantity).toHaveBeenCalledWith('item-1', 3);
    });

    it('deduplicates singular/plural variations (e.g., "Gold Coin" vs "Gold Coins")', async () => {
      mockCategorize.mockResolvedValue({
        categoryId: 'valuables',
        source: 'ai',
        confidence: 0.9,
        classifiedAt: new Date().toISOString(),
      });

      // Add "Gold Coins" (plural) first
      await processAcquiredItems(
        [{ name: 'Gold Coins', description: 'Shiny currency', quantity: 3 }],
        'character-123',
        'session-456'
      );

      // Try to add "Gold Coin" (singular) - should be detected as duplicate and stack
      await processAcquiredItems(
        [{ name: 'Gold Coin', description: 'A gold coin', quantity: 1 }],
        'character-123',
        'session-456'
      );

      // Should merge via singular/plural matching
      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockUpdateItemQuantity).toHaveBeenCalledWith('item-1', 4);
    });

    it('correctly merges three semantically similar stackable items (triple-merge test)', async () => {
      // Test for the bug where three similar items would only merge to qty2 instead of qty3
      // because the second merge would use the stale base quantity
      const items: AcquiredItemMetadata[] = [
        { name: 'Potion', description: 'Healing elixir', quantity: 1 },
        { name: 'Health Potion', description: 'Restores health', quantity: 1 },
        { name: 'Healing Potion', description: 'Heals wounds', quantity: 1 },
      ];

      mockCategorize.mockResolvedValue({
        categoryId: 'consumables',
        source: 'ai',
        confidence: 0.9,
        classifiedAt: new Date().toISOString(),
      });

      await processAcquiredItems(items, 'character-123', 'session-456');

      // Should merge all three into a single item with qty 3
      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith('character-123', expect.objectContaining({
        quantity: 3, // All three merged correctly
      }));
    });
  });
});
