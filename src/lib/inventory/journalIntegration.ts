// src/lib/inventory/journalIntegration.ts

import type { InventoryItem, InventoryAcquisitionMethod } from '@/types/inventory.types';
import type { JournalEntry } from '@/types/journal.types';
import type { EntityID } from '@/types/common.types';
import { getTimestamp } from '@/lib/utils';

/**
 * Determines if an item acquisition should be marked as significant.
 * Significant items appear as major or critical entries in the journal.
 *
 * Quest items are always significant.
 * Rewards and gifts are significant.
 * Other acquisitions are minor.
 */
function determineAcquisitionSignificance(
  item: InventoryItem
): 'minor' | 'major' | 'critical' {
  // Quest items are always major significance
  if (item.categoryId === 'quest-items') {
    return 'major';
  }

  // Check acquisition method
  const latestAcquisition = item.acquisitionHistory[item.acquisitionHistory.length - 1];
  const significantMethods: InventoryAcquisitionMethod[] = ['reward', 'gift', 'quest'];

  if (latestAcquisition && significantMethods.includes(latestAcquisition.method)) {
    return 'major';
  }

  return 'minor';
}

/**
 * Formats acquisition context for journal entry content.
 * Includes item quantity, acquisition method, and description if available.
 */
function formatAcquisitionContext(item: InventoryItem): string {
  const latestAcquisition = item.acquisitionHistory[item.acquisitionHistory.length - 1];

  if (!latestAcquisition) {
    return `Acquired ${item.name}`;
  }

  const parts: string[] = [];

  // Add quantity if more than 1
  if (item.quantity > 1) {
    parts.push(`Acquired ${item.quantity}x ${item.name}`);
  } else {
    parts.push(`Acquired ${item.name}`);
  }

  // Add category
  parts.push(`Category: ${item.categoryId}`);

  // Add acquisition method
  parts.push(`Method: ${latestAcquisition.method}`);

  // Add description if available
  if (latestAcquisition.description) {
    parts.push(latestAcquisition.description);
  }

  return parts.join(' • ');
}

/**
 * Creates a journal entry for an item acquisition.
 *
 * Generates a journal entry that includes:
 * - Item name and category
 * - Acquisition method and context
 * - Link back to the acquired item
 * - Appropriate significance level
 *
 * @param item - The acquired inventory item
 * @param sessionId - Current game session ID
 * @param worldId - Current world ID
 * @param characterId - Character who acquired the item
 * @returns Journal entry data (without id, sessionId, createdAt)
 */
export function createAcquisitionJournalEntry(
  item: InventoryItem,
  sessionId: EntityID,
  worldId: EntityID,
  characterId: EntityID
): Omit<JournalEntry, 'id' | 'sessionId' | 'createdAt'> {
  const significance = determineAcquisitionSignificance(item);
  const content = formatAcquisitionContext(item);

  return {
    worldId,
    characterId,
    type: 'item_acquisition',
    title: `Acquired: ${item.name}`,
    content,
    significance,
    isRead: false,
    relatedEntities: [
      {
        type: 'item',
        id: item.id,
        name: item.name,
      },
    ],
    metadata: {
      tags: [item.categoryId],
      automaticEntry: true,
    },
    updatedAt: getTimestamp(),
  };
}
