// src/lib/narrative/__tests__/itemLossProcessor.test.ts

import { processLostItems } from '../itemLossProcessor';
import { useInventoryStore } from '@/state/inventoryStore';
import { checkItemSimilarityClient } from '@/lib/inventory/checkItemSimilarityClient';
import type { LostItemMetadata } from '@/types/narrative.types';
import { mockZustandStore, createMockInventoryStore } from '@/lib/test-utils';
import type { InventoryItem } from '@/types/inventory.types';
import { createLossJournalEntry } from '@/lib/inventory/journalIntegration';
import { logger } from '@/lib/utils/logger';

// Mock the dependencies
jest.mock('@/state/inventoryStore');
jest.mock('@/lib/inventory/checkItemSimilarityClient');
jest.mock('@/lib/utils/logger', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockLogger),
    logger: mockLogger,
  };
});
jest.mock('@/state/journalStore', () => ({
  useJournalStore: {
    getState: jest.fn(() => ({
      addEntry: jest.fn(),
    })),
  },
}));
jest.mock('@/state/sessionStore', () => ({
  useSessionStore: {
    getState: jest.fn(() => ({
      worldId: 'world-123',
    })),
  },
}));
jest.mock('@/lib/inventory/journalIntegration', () => ({
  createLossJournalEntry: jest.fn(() => ({
    title: 'Lost Item',
    content: 'Context',
    significance: 'minor',
  })),
}));

describe('itemLossProcessor', () => {
  let mockRemoveItem: jest.Mock;
  let mockGetCharacterItems: jest.Mock;
  const mockCheckSimilarity = checkItemSimilarityClient as jest.MockedFunction<
    typeof checkItemSimilarityClient
  >;
  let characterItems: InventoryItem[];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Initial inventory
    characterItems = [
      {
        id: 'item-1',
        name: 'Health Potion',
        quantity: 3,
        categoryId: 'consumables',
        stackable: true,
      },
      {
        id: 'item-2',
        name: 'Steel Sword',
        quantity: 1,
        categoryId: 'equipment',
        stackable: false,
      },
      {
        id: 'item-3',
        name: 'Ancient Amulet',
        quantity: 1,
        categoryId: 'quest-items',
        stackable: false,
      },
    ] as InventoryItem[];

    // Mock AI similarity checker
    mockCheckSimilarity.mockImplementation(async ({ name1, name2 }) => {
      const n1 = name1.toLowerCase();
      const n2 = name2.toLowerCase();
      if (n1 === n2 || n1.includes(n2) || n2.includes(n1)) {
        return { similar: true, confidence: 0.9, rationale: 'Match' };
      }
      return { similar: false, confidence: 0.1, rationale: 'No match' };
    });

    mockRemoveItem = jest.fn((_characterId: string, itemId: string, quantity?: number) => {
      const target = characterItems.find((item) => item.id === itemId);
      if (target) {
        const removeQty = quantity ?? target.quantity;
        target.quantity -= removeQty;
        if (target.quantity <= 0) {
          characterItems = characterItems.filter((item) => item.id !== itemId);
        }
      }
    });

    mockGetCharacterItems = jest.fn(() => characterItems);

    mockZustandStore(
      useInventoryStore as jest.MockedFunction<typeof useInventoryStore>,
      createMockInventoryStore({
        removeItem: mockRemoveItem,
        getCharacterItems: mockGetCharacterItems,
      })
    );
  });

  describe('processLostItems', () => {
    it('removes item from inventory when AI returns item loss metadata', async () => {
      const lossMetadata: LostItemMetadata = {
        name: 'Health Potion',
        quantity: 1,
        lossReason: 'consumed',
      };

      await processLostItems(
        [lossMetadata],
        'character-123',
        'session-456'
      );

      expect(mockRemoveItem).toHaveBeenCalledWith('character-123', 'item-1', 1);
      expect(createLossJournalEntry).toHaveBeenCalled();
    });

    it('handles multiple items lost at once', async () => {
      const items: LostItemMetadata[] = [
        { name: 'Health Potion', quantity: 2 },
        { name: 'Steel Sword' },
      ];

      await processLostItems(items, 'character-123', 'session-456');

      expect(mockRemoveItem).toHaveBeenCalledTimes(2);
      expect(mockRemoveItem).toHaveBeenCalledWith('character-123', 'item-1', 2);
      expect(mockRemoveItem).toHaveBeenCalledWith('character-123', 'item-2', 1);
    });

    it('removes entire item when quantity matches', async () => {
      const lossMetadata: LostItemMetadata = {
        name: 'Steel Sword',
        quantity: 1,
      };

      await processLostItems([lossMetadata], 'character-123', 'session-456');

      expect(mockRemoveItem).toHaveBeenCalledWith('character-123', 'item-2', 1);
    });

    it('handles non-existent items by logging a warning and continuing', async () => {
      const items: LostItemMetadata[] = [
        { name: 'Non-existent Item' },
        { name: 'Health Potion', quantity: 1 },
      ];

      await processLostItems(items, 'character-123', 'session-456');

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Could not find item "Non-existent Item"'),
        expect.any(Object)
      );
      expect(mockRemoveItem).toHaveBeenCalledTimes(1);
      expect(mockRemoveItem).toHaveBeenCalledWith('character-123', 'item-1', 1);
    });

    it('handles insufficient quantity by removing what is available and logging a warning', async () => {
      const lossMetadata: LostItemMetadata = {
        name: 'Health Potion',
        quantity: 10, // Only 3 available
      };

      await processLostItems([lossMetadata], 'character-123', 'session-456');

      expect(mockRemoveItem).toHaveBeenCalledWith('character-123', 'item-1', 3);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Insufficient quantity for "Health Potion"')
      );
    });

    it('uses semantic matching to find items', async () => {
      const lossMetadata: LostItemMetadata = {
        name: 'potion', // Should match "Health Potion"
      };

      await processLostItems([lossMetadata], 'character-123', 'session-456');

      expect(mockRemoveItem).toHaveBeenCalledWith('character-123', 'item-1', 1);
    });

    it('uses exact itemId if provided', async () => {
      const lossMetadata: LostItemMetadata = {
        name: 'Wrong Name',
        itemId: 'item-3', // Should match "Ancient Amulet"
      };

      await processLostItems([lossMetadata], 'character-123', 'session-456');

      expect(mockRemoveItem).toHaveBeenCalledWith('character-123', 'item-3', 1);
    });

    it('does nothing when no items are provided', async () => {
      await processLostItems([], 'character-123', 'session-456');

      expect(mockRemoveItem).not.toHaveBeenCalled();
    });

    it('handles zero quantity as no-op', async () => {
      const lossMetadata: LostItemMetadata = {
        name: 'Health Potion',
        quantity: 0,
      };

      await processLostItems([lossMetadata], 'character-123', 'session-456');

      // Zero quantity should result in no removal action
      expect(mockRemoveItem).not.toHaveBeenCalled();
    });

    it("isolates errors so one failure doesn't block others", async () => {
      const items: LostItemMetadata[] = [
        { name: 'Health Potion' },
        { name: 'Steel Sword' },
      ];

      mockRemoveItem
        .mockImplementationOnce(() => {
          throw new Error('Store failure');
        })
        .mockImplementationOnce((_characterId, _itemId, _qty) => {
          // Success for the second item
        });
      const onError = jest.fn();

      await processLostItems(
        items,
        'character-123',
        'session-456',
        onError
      );

      expect(mockRemoveItem).toHaveBeenCalledTimes(2);
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
