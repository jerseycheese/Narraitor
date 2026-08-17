// Item usage service - handles item usage logic, narrative generation, and journal integration

import type { InventoryItem, ItemUsageResult, StandardInventoryCategory } from '@/types/inventory.types';
import type { EntityID } from '@/types/common.types';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { createItemUsageJournalEntry } from './itemUsageJournalIntegration';
import { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';
import type { NarrativeGenerationResult } from '@/types/narrative.types';
import { isSessionEndingSegment } from '@/lib/narrative/isSessionEndingSegment';
import { mergeTurnTags } from '@/lib/narrative/turnTags';
import { safeTrim } from '@/lib/utils';

import Logger from '@/lib/utils/logger';
const logger = new Logger('ItemUsageService');

interface ItemUsageNarrativeDetails {
  wasConsumed?: boolean;
  remainingQuantity?: number;
  previousQuantity?: number;
}

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
 * Builds fallback narrative text for item usage.
 * Centralizes the logic for constructing narrative based on consumption state.
 *
 * @param item - The item being used
 * @param usageDetails - Details about the usage (consumption, quantities)
 * @param tone - 'detailed' for longer descriptions, 'simple' for concise ones
 * @returns Narrative text describing the item usage
 */
export function buildUsageNarrative(
  item: InventoryItem,
  usageDetails: ItemUsageNarrativeDetails,
  tone: 'detailed' | 'simple' = 'simple'
): string {
  const previousQuantity = usageDetails.previousQuantity ?? item.quantity;
  const remainingQuantity =
    usageDetails.remainingQuantity ??
    (usageDetails.wasConsumed ? Math.max(previousQuantity - 1, 0) : previousQuantity);

  const narrativeParts: string[] = [];

  // Opening line
  if (tone === 'detailed') {
    narrativeParts.push(
      `You use ${previousQuantity === 1 ? 'the' : 'one of the'} ${item.name}${item.description ? `. ${item.description}` : '.'}`
    );
  } else {
    if (usageDetails.wasConsumed) {
      if (remainingQuantity > 0) {
        narrativeParts.push(`You use one of the ${item.name}, leaving ${remainingQuantity} remaining.`);
      } else {
        narrativeParts.push(`You use the last of the ${item.name}.`);
      }
    } else {
      narrativeParts.push(`You use the ${item.name}${item.description ? `. ${item.description}` : '.'}`);
    }
    return narrativeParts.map(part => safeTrim(part)).join(' ');
  }

  // Consumption details (detailed tone only)
  if (usageDetails.wasConsumed) {
    if (remainingQuantity > 0) {
      narrativeParts.push(
        `You still have ${remainingQuantity} ${remainingQuantity === 1 ? 'remaining' : 'remaining pieces'} to draw upon.`
      );
    } else {
      narrativeParts.push('That was the last of this item.');
    }
  } else {
    narrativeParts.push('The item remains firmly in your grasp as the moment passes.');
  }

  return narrativeParts.map(part => safeTrim(part)).join(' ');
}

/**
 * Generates narrative text describing the effects of using an item.
 * Uses AI to create contextual, world-appropriate descriptions.
 */
export async function generateItemUsageNarrative(
  item: InventoryItem,
  characterId: EntityID,
  worldId: EntityID,
  sessionId: EntityID,
  usageDetails: ItemUsageNarrativeDetails
): Promise<NarrativeGenerationResult> {
  // Get world and character context up front to keep error handling consistent
  const world = useWorldStore.getState().worlds[worldId];
  const character = useCharacterStore.getState().characters[characterId];

  if (!world || !character) {
    throw new Error('World or character not found');
  }

  try {
    const { useNarrativeStore } = await import('@/state/narrativeStore');
    const narrativeStore = useNarrativeStore.getState();
    const previousSegments = narrativeStore.getSessionSegments(sessionId);
    const recentSegments = previousSegments.slice(-5);
    const lastSegment = previousSegments[previousSegments.length - 1];
    const currentTags = mergeTurnTags(lastSegment?.metadata?.tags || [], [
      'item-usage',
      `item-${item.categoryId}`,
    ]);

    const generator = new NarrativeGenerator(createDefaultGeminiClient());

    const itemSituationLines = [
      `The player immediately uses the item "${item.name}".`,
      'Describe the precise motion of using it and the sensory details that follow.',
      'Show the item altering the current stakes or environment right away.',
      'Avoid simply repeating the inventory description; translate it into lived action.'
    ];

    if (usageDetails.wasConsumed && typeof usageDetails.previousQuantity === 'number') {
      const previousQuantity = usageDetails.previousQuantity;
      const remainingQuantity = usageDetails.remainingQuantity ?? Math.max(previousQuantity - 1, 0);
      if (previousQuantity > 1 && remainingQuantity > 0) {
        itemSituationLines.push(
          `Only one unit is used in this moment. Make it clear the character still has ${remainingQuantity} remaining for future scenes.`
        );
      } else if (remainingQuantity === 0) {
        itemSituationLines.push('This was the final unit of the item. Emphasize that the supply is now exhausted.');
      }
    } else if (!usageDetails.wasConsumed) {
      itemSituationLines.push('The item remains in the character’s possession after the action.');
    }

    const situationLines = [...itemSituationLines];
    if (item.description) {
      situationLines.push(`The item is known for: ${item.description}.`);
    }
    situationLines.push(`Category context: ${item.categoryId}.`);

    const includedTopics = [
      `item:${item.name}`,
      `category:${item.categoryId}`,
      'item-usage-effect',
    ];
    if (item.description) {
      includedTopics.push(`item-detail:${item.description}`);
    }

    return await generator.generateSegment({
      worldId,
      sessionId,
      characterIds: [characterId],
      narrativeContext: {
        worldId,
        sessionId,
        currentSceneId: `item-usage-${item.id}`,
        characterIds: [characterId],
        previousSegments,
        recentSegments,
        currentTags,
        currentLocation: lastSegment?.metadata?.location,
        currentSituation: situationLines.join(' '),
        importantEntities: [
          {
            id: item.id,
            type: 'item',
            name: item.name,
          },
        ],
      },
      generationParameters: {
        segmentType: 'action',
        desiredLength: 'short',
        includedTopics,
        disableItemAcquisitionProcessing: true,
      },
    });
  } catch {
    // Fallback narrative if AI generation fails or context unavailable
    return {
      content: buildUsageNarrative(item, usageDetails, 'detailed'),
      segmentType: 'action',
      metadata: {
        characterIds: [characterId],
        tags: ['item-usage', item.categoryId],
      },
    };
  }
}

/**
 * Uses an item with full effects: inventory changes, narrative generation,
 * and journal entries for significant items.
 */
export async function processItemUsage(
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

  const sessionStore = useSessionStore.getState();
  const worldId = sessionStore.worldId;
  const resolvedSessionId = sessionId ?? sessionStore.id;

  let narrative: string | undefined;
  let segmentId: EntityID | undefined;

  if (worldId && resolvedSessionId) {
    try {
      const generation = await generateItemUsageNarrative(
        item,
        characterId,
        worldId,
        resolvedSessionId,
        {
          wasConsumed: usageResult.wasConsumed,
          remainingQuantity: usageResult.remainingQuantity,
          previousQuantity: usageResult.previousQuantity,
        }
      );

      narrative = generation.content;
      if (!narrative || !narrative.trim()) {
        narrative = `You use the ${item.name}${item.description ? `. ${item.description}` : '.'}`;
      }

      const { useNarrativeStore } = await import('@/state/narrativeStore');
      const narrativeStore = useNarrativeStore.getState();
      const now = new Date();

      const baseTags = new Set<string>(['item-usage', item.categoryId]);
      generation.metadata?.tags?.forEach((tag) => {
        if (tag) {
          baseTags.add(tag);
        }
      });

      const metadataCharacterIds =
        generation.metadata?.characterIds?.length
          ? generation.metadata.characterIds
          : [characterId];

      segmentId = narrativeStore.addSegment(resolvedSessionId, {
        content: generation.content,
        type: generation.segmentType,
        characterIds: metadataCharacterIds,
        metadata: {
          ...generation.metadata,
          tags: Array.from(baseTags),
          characterIds: metadataCharacterIds,
        },
        timestamp: now,
        updatedAt: now.toISOString(),
      });

      // Create journal entry for significant usage
      if (isNarrativelySignificant(item)) {
        const journalEntry = createItemUsageJournalEntry(
          item,
          generation.content,
          worldId,
          characterId
        );

        const journalStore = useJournalStore.getState();
        journalStore.addEntry(resolvedSessionId, journalEntry);
      }

      // After item-usage narrative, clear any stale decisions and generate fresh choices
      try {
        const recentSegments = narrativeStore.getSessionSegments(resolvedSessionId).slice(-5);
        const lastSegment = recentSegments[recentSegments.length - 1];

        // If using the item ended the session (fatal/ending segment), skip choice
        // regeneration — the choices would never be shown, and existing decisions
        // stay intact rather than being cleared.
        if (!lastSegment || !isSessionEndingSegment(lastSegment)) {
          const narrativeContext = {
            worldId,
            sessionId: resolvedSessionId,
            currentSceneId: `item-usage-${item.id}-${Date.now()}`,
            characterIds: [characterId],
            previousSegments: recentSegments,
            recentSegments,
            currentTags: lastSegment?.metadata?.tags || [],
            currentLocation: lastSegment?.metadata?.location,
          };

          // Yield so the UI can render a loading/skeleton state before new choices arrive
          await new Promise((resolve) => setTimeout(resolve, 0));

          const geminiClient = createDefaultGeminiClient();
          const generator = new NarrativeGenerator(geminiClient);
          const decision = await generator.generatePlayerChoices(
            worldId,
            narrativeContext,
            [characterId],
            resolvedSessionId
          );

          // Clear old decisions only after successful generation
          narrativeStore.clearSessionDecisions(resolvedSessionId);

          // Persist new decision in store for UI to pick up
          narrativeStore.addDecision(resolvedSessionId, {
            prompt: decision.prompt,
            options: decision.options,
            decisionWeight: decision.decisionWeight,
            contextSummary: decision.contextSummary,
          });
        }
      } catch (error) {
        // If generation fails, existing decisions remain intact (not cleared)
        logger.warn('Failed to generate choices after item usage, keeping existing decisions', error);
      }
    } catch {
      narrative = buildUsageNarrative(item, usageResult, 'simple');
    }
  } else {
    narrative = buildUsageNarrative(item, usageResult, 'simple');
  }

  return {
    ...usageResult,
    narrative,
    segmentId,
  };
}
