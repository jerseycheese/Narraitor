import type { InventoryItem } from '@/types/inventory.types';
import type { NarrativeStaticContentCache } from './narrativeGenerator.prompt.types';

/**
 * Enhances narrative generation prompts with item loss tracking instructions.
 * Parallel to item acquisition system - teaches AI to emit itemsLost metadata.
 */
export const enhancePromptWithItemLossInstructions = (
  basePrompt: string,
  cache: NarrativeStaticContentCache,
  characterInventory: InventoryItem[]
): string => {
  if (!cache.itemLossInstructions) {
    cache.itemLossInstructions = buildItemLossInstructions();
  }

  const inventoryContext = formatInventoryForPrompt(characterInventory);
  const fullInstructions = cache.itemLossInstructions.replace(
    '{{INVENTORY_CONTEXT}}',
    inventoryContext
  );

  return basePrompt + '\n\n' + fullInstructions;
};

function buildItemLossInstructions(): string {
  return `
## ITEM USAGE & LOSS TRACKING

When your narrative describes the character using, losing, or giving away items, emit structured metadata to track inventory changes.

**Current Character Inventory**:
{{INVENTORY_CONTEXT}}

**When to emit itemsLost metadata**:
- Consumables used (drinking potions, eating food, firing arrows)
- Items delivered to NPCs (quest completion)
- Items stolen by enemies/NPCs
- Items dropped or abandoned
- Items destroyed or broken
- Items sold to merchants
- Items given as gifts
- Items sacrificed or consumed in rituals

**Metadata Structure (inside the "metadata" object)**:
\`\`\`json
{
  "metadata": {
    "itemsLost": [
      {
        "name": "Health Potion",
        "quantity": 1,
        "lossReason": "consumed",
        "lossContext": "Drank to recover from wounds"
      }
    ]
  }
}
\`\`\`

**Loss Reason Values**:
- consumed: Used up (potions, food, ammunition)
- delivered: Given to NPC for quest
- stolen: Taken by enemy/thief
- dropped: Abandoned or left behind
- destroyed: Broken beyond repair
- sold: Traded to merchant
- gifted: Given as present
- sacrificed: Ritual or special use
- unknown: When reason unclear

**Critical Rules**:
1. Emit itemsLost metadata whenever the narrative describes the character losing, using, or discarding an item.
2. Use the item name from the inventory list that best matches the item in the narrative.
3. Quantity cannot exceed current inventory quantity
4. Don't emit for items merely mentioned - only actual usage/loss
5. Each item needs: name (required), quantity (optional, default 1), lossReason (optional)
6. For stackable items (like arrows), reducing quantity by 1 keeps the item with quantity-1
7. Don't duplicate - same item lost once = one metadata entry
8. Always include metadata.itemsLost in your JSON response (use [] if nothing was lost).

**Examples**:

*Inventory: - Rusty Iron Sword (1x) [equipment]*
*Narrative: "You throw your sword into the abyss."*
→ itemsLost: [{ "name": "Rusty Iron Sword", "lossReason": "dropped" }]

*Narrative: "You drink the health potion, feeling warmth spread through your body."*
→ itemsLost: [{ "name": "Health Potion", "quantity": 1, "lossReason": "consumed" }]

*Narrative: "You hand the ancient amulet to the elder, completing your quest."*
→ itemsLost: [{ "name": "Ancient Amulet", "lossReason": "delivered" }]

*Narrative: "The bandit steals your gold coins before you can react."*
→ itemsLost: [{ "name": "Gold Coins", "quantity": 50, "lossReason": "stolen" }]

*Narrative: "You fire three arrows at the target."*
→ itemsLost: [{ "name": "Arrow", "quantity": 3, "lossReason": "consumed" }]

*Narrative: "Your sword shatters against the dragon's scales."*
→ itemsLost: [{ "name": "Iron Sword", "lossReason": "destroyed" }]
`;
}

function formatInventoryForPrompt(items: InventoryItem[]): string {
  if (!items || items.length === 0) {
    return '(Empty - character has no items)';
  }

  return items
    .map(item => `- ${item.name} (${item.quantity}x) [${item.categoryId}]`)
    .join('\n');
}
