import type { NarrativeGenerator } from '@/lib/ai/narrativeGenerator';
import { mergeTurnTags } from '@/lib/narrative/turnTags';
import { useCharacterStore } from '@/state/characterStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useWorldStore } from '@/state/worldStore';
import type { EntityID } from '@/types/common.types';
import type { InventoryItem } from '@/types/inventory.types';
import type { NarrativeGenerationResult } from '@/types/narrative.types';
import { safeTrim } from '@/lib/utils';

export interface ItemUsageNarrativeDetails {
  wasConsumed?: boolean;
  remainingQuantity?: number;
  previousQuantity?: number;
}

interface ItemUsageNarrativeRequest {
  item: InventoryItem;
  characterId: EntityID;
  worldId: EntityID;
  sessionId: EntityID;
  usageDetails: ItemUsageNarrativeDetails;
}

/**
 * Builds local fallback prose for an item-use turn.
 */
export function buildUsageNarrative(
  item: InventoryItem,
  usageDetails: ItemUsageNarrativeDetails,
  tone: 'detailed' | 'simple' = 'simple'
): string {
  const previousQuantity = usageDetails.previousQuantity ?? item.quantity;
  const remainingQuantity =
    usageDetails.remainingQuantity ??
    (usageDetails.wasConsumed
      ? Math.max(previousQuantity - 1, 0)
      : previousQuantity);
  const narrativeParts: string[] = [];

  if (tone === 'detailed') {
    narrativeParts.push(
      `You use ${previousQuantity === 1 ? 'the' : 'one of the'} ${item.name}${item.description ? `. ${item.description}` : '.'}`
    );
  } else {
    if (usageDetails.wasConsumed) {
      narrativeParts.push(
        remainingQuantity > 0
          ? `You use one of the ${item.name}, leaving ${remainingQuantity} remaining.`
          : `You use the last of the ${item.name}.`
      );
    } else {
      narrativeParts.push(
        `You use the ${item.name}${item.description ? `. ${item.description}` : '.'}`
      );
    }

    return narrativeParts.map((part) => safeTrim(part)).join(' ');
  }

  if (usageDetails.wasConsumed) {
    narrativeParts.push(
      remainingQuantity > 0
        ? `You still have ${remainingQuantity} ${remainingQuantity === 1 ? 'remaining' : 'remaining pieces'} to draw upon.`
        : 'That was the last of this item.'
    );
  } else {
    narrativeParts.push(
      'The item remains firmly in your grasp as the moment passes.'
    );
  }

  return narrativeParts.map((part) => safeTrim(part)).join(' ');
}

/**
 * Generates an item-specific action beat through the resolver-managed
 * generator seam. Provider failures fall back to local prose.
 */
export async function generateItemUsageNarrative(
  {
    item,
    characterId,
    worldId,
    sessionId,
    usageDetails,
  }: ItemUsageNarrativeRequest,
  generator: NarrativeGenerator
): Promise<NarrativeGenerationResult> {
  const world = useWorldStore.getState().worlds[worldId];
  const character = useCharacterStore.getState().characters[characterId];

  if (!world || !character) {
    throw new Error('World or character not found');
  }

  try {
    const previousSegments = useNarrativeStore
      .getState()
      .getSessionSegments(sessionId);
    const recentSegments = previousSegments.slice(-5);
    const lastSegment = previousSegments[previousSegments.length - 1];
    const currentTags = mergeTurnTags(lastSegment?.metadata?.tags || [], [
      'item-usage',
      `item-${item.categoryId}`,
    ]);
    const itemSituationLines = [
      `The player immediately uses the item "${item.name}".`,
      'Describe the precise motion of using it and the sensory details that follow.',
      'Show the item altering the current stakes or environment right away.',
      'Avoid simply repeating the inventory description; translate it into lived action.',
    ];

    if (
      usageDetails.wasConsumed &&
      typeof usageDetails.previousQuantity === 'number'
    ) {
      const previousQuantity = usageDetails.previousQuantity;
      const remainingQuantity =
        usageDetails.remainingQuantity ?? Math.max(previousQuantity - 1, 0);
      if (previousQuantity > 1 && remainingQuantity > 0) {
        itemSituationLines.push(
          `Only one unit is used in this moment. Make it clear the character still has ${remainingQuantity} remaining for future scenes.`
        );
      } else if (remainingQuantity === 0) {
        itemSituationLines.push(
          'This was the final unit of the item. Emphasize that the supply is now exhausted.'
        );
      }
    } else if (!usageDetails.wasConsumed) {
      itemSituationLines.push(
        'The item remains in the character’s possession after the action.'
      );
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

    return await generator.generateSegment(
      {
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
          disableItemLossProcessing: true,
        },
      },
      { resolverManaged: true }
    );
  } catch {
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
