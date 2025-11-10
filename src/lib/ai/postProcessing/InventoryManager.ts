/**
 * InventoryManager
 *
 * Handles item acquisition processing without reaching into stores directly
 */

import { EntityID } from '@/types/common.types';
import { processAcquiredItems } from '@/lib/narrative/itemAcquisitionProcessor';
import type { AcquiredItemMetadata } from '@/types/narrative.types';

export class InventoryManager {
  /**
   * Process acquired items from narrative metadata
   */
  async processAcquiredItems(
    itemsAcquired: AcquiredItemMetadata[],
    characterId: EntityID,
    sessionId: EntityID
  ): Promise<void> {
    if (!itemsAcquired || itemsAcquired.length === 0) {
      return;
    }

    if (!characterId || !sessionId) {
      return;
    }

    // Process items asynchronously - don't block narrative generation
    void processAcquiredItems(itemsAcquired, characterId, sessionId);
  }
}
