/**
 * LoreUpdater
 *
 * Extracts and stores structured lore from generated narratives
 */

import { EntityID } from '@/types/common.types';
import { getLoreContextForPrompt } from '../loreContextHelper';
import { extractStructuredLore } from '../structuredLoreExtractor';

export class LoreUpdater {
  /**
   * Extract and update lore from narrative content
   */
  async updateLore(
    content: string,
    worldId: EntityID,
    sessionId?: EntityID
  ): Promise<void> {
    if (!content) {
      return;
    }

    try {
      const existingLoreContext = getLoreContextForPrompt(worldId);
      const structuredLore = await extractStructuredLore(
        content,
        existingLoreContext
      );

      // Import lore store dynamically to avoid circular dependency
      const { useLoreStore } = await import('@/state/loreStore');
      const { addStructuredLore } = useLoreStore.getState();
      addStructuredLore(structuredLore, worldId, sessionId);
    } catch {
      // Failed to extract lore - continue without it
    }
  }
}
