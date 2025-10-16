// Journal integration for item usage
// Creates journal entries for significant item usage events

import type { InventoryItem } from '@/types/inventory.types';
import type { JournalEntry } from '@/types/journal.types';
import type { EntityID } from '@/types/common.types';
import { getTimestamp } from '@/lib/utils';

/**
 * Creates a journal entry for item usage
 * Similar pattern to createAcquisitionJournalEntry from journalIntegration.ts
 */
export function createItemUsageJournalEntry(
  item: InventoryItem,
  narrative: string,
  worldId: EntityID,
  characterId: EntityID
): Omit<JournalEntry, 'id' | 'sessionId' | 'createdAt'> {
  return {
    worldId,
    characterId,
    type: 'item-usage',
    title: `Used ${item.name}`,
    content: narrative,
    significance: 'minor',
    isRead: false,
    updatedAt: getTimestamp(),
    relatedEntities: [
      {
        type: 'item',
        id: item.id,
        name: item.name,
      },
    ],
    metadata: {
      tags: ['item-usage', item.categoryId],
      automaticEntry: true,
    },
  };
}
