// src/lib/narrative/__tests__/itemAcquisitionProcessor.test.ts

import { processAcquiredItems } from '../itemAcquisitionProcessor';
import { useInventoryStore } from '@/state/inventoryStore';
import { categorizeInventoryItemClient } from '@/lib/inventory/categorizeInventoryItemClient';
import type { AcquiredItemMetadata } from '@/types/narrative.types';

// Mock the dependencies
jest.mock('@/state/inventoryStore');
jest.mock('@/lib/inventory/categorizeInventoryItemClient');

describe('itemAcquisitionProcessor', () => {
  const mockAddItem = jest.fn();
  const mockGetState = jest.fn();
  const mockCategorize = categorizeInventoryItemClient as jest.MockedFunction<
    typeof categorizeInventoryItemClient
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetState.mockReturnValue({
      addItem: mockAddItem,
    });
    (useInventoryStore as unknown as jest.Mock).mockReturnValue({});
    (useInventoryStore as unknown as { getState: jest.Mock }).getState = mockGetState;
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
        })
        .mockResolvedValueOnce({
          categoryId: 'valuables',
          source: 'ai',
          confidence: 0.95,
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
        });

      // Second categorization succeeds but addItem fails
      mockCategorize.mockResolvedValueOnce({
        categoryId: 'equipment',
        source: 'ai',
        confidence: 0.9,
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
  });
});
