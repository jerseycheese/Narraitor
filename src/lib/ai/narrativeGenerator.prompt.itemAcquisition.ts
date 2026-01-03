import { safeTrim } from '@/lib/utils';
import type { RequestBudget } from '@/lib/promptContext/tokenBudgetManager';
import { applyBudget } from './narrativeGenerator.budget';
import type { NarrativeStaticContentCache } from './narrativeGenerator.prompt.types';

export const enhancePromptWithItemAcquisitionInstructions = (
  prompt: string,
  cache: NarrativeStaticContentCache,
  budget?: RequestBudget
): string => {
  if (!cache.itemAcquisitionInstructions) {
    cache.itemAcquisitionInstructions = `

ITEM ACQUISITION INSTRUCTIONS:
Only include entries in metadata.itemsAcquired when the player character ends the scene with a new, portable item in their ongoing possession (something they could realistically carry to the next location). Merely noticing, interacting with, or temporarily using environmental objects or stage dressing does NOT count as acquisition. If the character sets an object back down, leaves it behind, or otherwise does not keep it, do not add it. Likewise, if the narrative merely clarifies or renames an item the character already had, update the prose, not the metadata.

Each acquired item should include:
- name: The item's name (required)
- description: Brief description of the item (optional but recommended)
- quantity: Number of items acquired (default: 1)
- acquisitionMethod: How the item was acquired - one of: "loot", "quest", "purchase", "craft", "reward", "gift", "manual", "unknown"

Examples:
- Character finds a sword: Include {name: "Ancient Sword", description: "A blade from ages past", quantity: 1, acquisitionMethod: "loot"}
- Character buys 3 potions: Include {name: "Healing Potion", description: "Restores health", quantity: 3, acquisitionMethod: "purchase"}
- Character receives a key as reward: Include {name: "Iron Key", description: "Opens the eastern gate", quantity: 1, acquisitionMethod: "reward"}

Important:
- Only include items the character ACTUALLY ACQUIRES AND KEEPS during this segment (not items they merely see, borrow momentarily, use as environmental tools, or were already carrying)
- Avoid duplicate entries for the same object; use the description to capture clarifications or additional detail
- CRITICAL: Do NOT list the same item name twice. If the character gains multiple of the same item, set quantity accordingly on a single entry instead of repeating the name.
- If you need to clarify an already listed item, update its description rather than adding another entry.
- Example: if "Iron Sword" is already present, do not add another "Iron Sword" later. Either refine the original description or increase the quantity when the character truly acquires additional swords.
- Be specific with item names and descriptions
- Use an appropriate acquisitionMethod for the narrative context
- If the narrative mentions vague supplies, still include the best concrete description you can infer

The items will be automatically added to the character's inventory with proper categorization and journal entries.`;
  }

  if (!budget || !budget.isEnabled()) {
    return prompt + cache.itemAcquisitionInstructions;
  }

  const limited = applyBudget(
    cache.itemAcquisitionInstructions,
    'item-instructions',
    budget
  );

  return safeTrim(limited) ? prompt + limited : prompt;
};
