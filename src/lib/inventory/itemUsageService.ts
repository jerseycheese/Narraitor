// Item usage service - handles item usage logic, narrative generation, and journal integration

import type { InventoryItem, ItemUsageResult, StandardInventoryCategory } from '@/types/inventory.types';
import type { EntityID } from '@/types/common.types';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { createItemUsageJournalEntry } from './itemUsageJournalIntegration';

/**
 * Determines if an item's usage is narratively significant enough to warrant
 * AI-generated effects and journal entries.
 *
 * Significant items: quest items, equipment, documents, valuables
 * Insignificant items: common consumables, miscellaneous items
 */
export function isNarrativelySignificant(item: InventoryItem): boolean {
  const significantCategories: StandardInventoryCategory[] = [
    'quest-items',
    'equipment',
    'documents',
    'valuables',
  ];

  return significantCategories.includes(item.categoryId);
}

/**
 * Generates narrative text describing the effects of using an item.
 * Uses AI to create contextual, world-appropriate descriptions.
 */
export async function generateItemUsageNarrative(
  item: InventoryItem,
  characterId: EntityID,
  worldId: EntityID
): Promise<string> {
  try {
    // Get world and character context
    const world = useWorldStore.getState().worlds[worldId];
    const character = useCharacterStore.getState().characters[characterId];

    if (!world || !character) {
      throw new Error('World or character not found');
    }

    // Build prompt for AI
    const prompt = `You are a narrative game master for "${world.name}", a ${world.genre} world.

The character "${character.name}" is using the item "${item.name}".
Item description: ${item.description || 'No description provided'}
Item category: ${item.categoryId}

Generate a brief (1-3 sentences) narrative description of what happens when the character uses this item. The description should:
- Be appropriate for the ${world.genre} genre
- Match the tone and style of ${world.name}
- Describe immediate effects or sensations
- Be written in second person ("You feel..." or "The item...")
- NOT include game mechanics or numbers

Response should be plain text only, no JSON or formatting.`;

    const geminiClient = createDefaultGeminiClient();
    const response = await geminiClient.generateContent(prompt);

    return response.content || `You use the ${item.name}.`;
  } catch {
    // Fallback narrative if AI generation fails
    return `You use the ${item.name}${item.description ? `. ${item.description}` : '.'}`;
  }
}

/**
 * Uses an item with full effects: inventory changes, narrative generation,
 * and journal entries for significant items.
 */
export async function useItemWithEffects(
  characterId: EntityID,
  itemId: EntityID,
  sessionId?: EntityID
): Promise<ItemUsageResult> {
  // Import dynamically to avoid circular dependencies
  const { useInventoryStore } = await import('@/state/inventoryStore');
  const { useJournalStore } = await import('@/state/journalStore');
  const { useSessionStore } = await import('@/state/sessionStore');

  const inventoryStore = useInventoryStore.getState();
  const item = inventoryStore.items[itemId];

  if (!item) {
    return {
      success: false,
      error: {
        type: 'VALIDATION',
        title: 'Item Not Found',
        message: 'The specified item could not be found.',
      },
    };
  }

  // Check if character owns this item
  const characterItems = inventoryStore.characterInventories[characterId] || [];
  if (!characterItems.includes(itemId)) {
    return {
      success: false,
      error: {
        type: 'VALIDATION',
        title: 'Item Not Available',
        message: 'This item is not in your inventory.',
      },
    };
  }

  // Use the item via inventory store
  const usageResult = inventoryStore.useItem(characterId, itemId);

  if (!usageResult.success) {
    return usageResult;
  }

  // Generate narrative for significant items
  let narrative: string | undefined;
  if (isNarrativelySignificant(item)) {
    const sessionStore = useSessionStore.getState();
    const worldId = sessionStore.worldId;

    if (worldId) {
      narrative = await generateItemUsageNarrative(item, characterId, worldId);

      // Create journal entry for significant usage
      if (sessionId) {
        const journalEntry = createItemUsageJournalEntry(
          item,
          narrative,
          sessionId,
          worldId,
          characterId
        );

        const journalStore = useJournalStore.getState();
        journalStore.addEntry(sessionId, journalEntry);
      }
    }
  }

  return {
    ...usageResult,
    narrative,
  };
}
