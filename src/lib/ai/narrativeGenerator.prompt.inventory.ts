import { useInventoryStore } from '@/state/inventoryStore';
import { useCharacterStore } from '@/state/characterStore';
import { buildInventoryContext } from '@/lib/promptContext/inventoryContextBuilder';
import type { RequestBudget } from '@/lib/promptContext/tokenBudgetManager';

export const enhancePromptWithInventory = (
  prompt: string,
  characterIds: string[],
  budget?: RequestBudget
): string => {
  try {
    if (!characterIds || characterIds.length === 0) {
      return prompt;
    }

    const characterId = characterIds[0];
    const { getCharacterItems } = useInventoryStore.getState();
    const items = getCharacterItems(characterId);

    if (!items || items.length === 0) {
      return prompt;
    }

    const equippedItemIds = getEquippedItemIds(characterIds);
    const tokenLimit =
      budget && budget.isEnabled() ? budget.getAllocation('inventory') : undefined;
    const { context: inventorySection, tokenCount } = buildInventoryContext(items, {
      equippedItemIds,
      tokenLimit:
        typeof tokenLimit === 'number' && Number.isFinite(tokenLimit)
          ? tokenLimit
          : undefined,
    });

    if (!inventorySection) {
      return prompt;
    }

    const guidance =
      'When generating narrative, naturally reference these items only if they matter to the current situation. Avoid forced mentions or repetitive callbacks.';

    if (budget && budget.isEnabled()) {
      budget.recordUsage('inventory', tokenCount);
    }

    return `${prompt}\n\n${inventorySection}\n\n${guidance}`;
  } catch {
    return prompt;
  }
};

const getEquippedItemIds = (characterIds: string[] | undefined): string[] => {
  if (!characterIds || characterIds.length === 0) {
    return [];
  }

  try {
    const { characters } = useCharacterStore.getState();
    const playerCharacter = characters[characterIds[0]];
    const inventoryItems =
      (playerCharacter?.inventory?.items as Array<{
        id: string;
        equipped?: boolean;
      }>) ?? [];

    return inventoryItems
      .filter((item) => item?.equipped)
      .map((item) => item.id);
  } catch {
    return [];
  }
};
