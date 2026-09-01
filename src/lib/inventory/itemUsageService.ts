import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';
import { resolveItemUseTurn } from '@/lib/narrative/turnResolver';
import { useJournalStore } from '@/state/journalStore';
import type {
  InventoryItem,
  ItemUsageResult,
  StandardInventoryCategory,
} from '@/types/inventory.types';
import type { NarrativeGenerationResult } from '@/types/narrative.types';
import type { ItemUseTurnCommand } from '@/types/turnResolver.types';
import {
  generateItemUsageNarrative as generateResolverManagedItemNarrative,
  type ItemUsageNarrativeDetails,
} from './itemUsageNarrative';
import { createItemUsageJournalEntry } from './itemUsageJournalIntegration';

export { buildUsageNarrative } from './itemUsageNarrative';

/**
 * Determines whether item usage warrants a journal entry.
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
 * Generates item-use prose with the default provider client.
 * TurnResolver injects its existing generator through the lower-level helper.
 */
export function generateItemUsageNarrative(
  item: InventoryItem,
  characterId: ItemUseTurnCommand['characterId'],
  worldId: ItemUseTurnCommand['worldId'],
  sessionId: ItemUseTurnCommand['sessionId'],
  usageDetails: ItemUsageNarrativeDetails
): Promise<NarrativeGenerationResult> {
  return generateResolverManagedItemNarrative(
    { item, characterId, worldId, sessionId, usageDetails },
    new NarrativeGenerator(createDefaultGeminiClient())
  );
}

/**
 * Uses an item through the session's authoritative TurnResolver pipeline.
 */
export async function processItemUsage(
  command: ItemUseTurnCommand
): Promise<ItemUsageResult> {
  const generator = new NarrativeGenerator(createDefaultGeminiClient());
  const outcome = await resolveItemUseTurn(command, generator);

  if (!outcome.success) {
    return outcome;
  }

  if (isNarrativelySignificant(outcome.item)) {
    const journalEntry = createItemUsageJournalEntry(
      outcome.item,
      outcome.turn.segment.content,
      command.worldId,
      command.characterId
    );
    useJournalStore.getState().addEntry(command.sessionId, journalEntry);
  }

  return {
    ...outcome.usage,
    narrative: outcome.turn.segment.content,
    segmentId: outcome.turn.segment.id,
  };
}
