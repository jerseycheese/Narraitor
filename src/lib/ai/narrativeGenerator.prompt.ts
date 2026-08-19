import { useCharacterStore } from '@/state/characterStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useAiContextStore } from '@/state/aiContextStore';
import type { EntityID } from '@/types/common.types';
import type { InventoryItem } from '@/types/inventory.types';
import type { NarrativeGenerationRequest } from '@/types/narrative.types';
import type { World } from '@/types/world.types';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';
import { safeTrim } from '@/lib/utils';
import { buildInventoryContext } from '@/lib/promptContext/inventoryContextBuilder';
import { worldCostBlock } from '@/lib/promptTemplates/templates/narrative/worldCostBlock';
import { isFeatureEnabled } from '@/lib/featureFlags';

import { buildNpcRoster } from './narrativeGenerator.npc';
import { getLoreContextForPrompt } from './loreContextHelper';
import { getDetailedToneInstructions } from './toneSettingsGuidance';
import { getComplexityAlert } from './narrativeGenerator.languageComplexity';

export {
  enhancePromptWithPersonalization,
  convertToPersonalizationCharacter,
} from './narrativeGenerator.prompt.personalization';

export interface NarrativeStaticContentCache {
  itemAcquisitionInstructions?: string;
  itemLossInstructions?: string;
  toneSettings?: Map<string, string>;
}

// ─── Context ────────────────────────────────────────────────────────────────

export const buildNarrativeContext = (
  world: World,
  request: NarrativeGenerationRequest
) => {
  const { characters } = useCharacterStore.getState();
  const playerCharacterId = request.characterIds?.[0];
  const playerCharacter = playerCharacterId ? characters[playerCharacterId] : null;

  const toneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;
  const npcRoster = buildNpcRoster(world.id);

  const existingImportant = request.narrativeContext?.importantEntities || [];
  const rosterEntities = npcRoster.map((npc) => ({
    id: npc.id,
    type: 'npc' as const,
    name: npc.name,
    description: npc.description,
    avatarUrl: npc.avatarUrl,
  }));

  const combinedImportant = [
    ...existingImportant,
    ...rosterEntities.filter(
      (entity) =>
        !existingImportant.some(
          (existing) =>
            existing.id === entity.id && existing.type === entity.type
        )
    ),
  ];

  const narrativeContextWithRoster = request.narrativeContext
    ? {
        ...request.narrativeContext,
        importantEntities: combinedImportant,
      }
    : undefined;

  return {
    worldName: world.name,
    worldDescription: world.description,
    genre: world.genre,
    tone: toneSettings.narrativeStyle,
    attributes: world.attributes,
    characterIds: request.characterIds,
    playerCharacterName: playerCharacter?.name,
    playerCharacterBackground: playerCharacter?.background,
    sessionId: request.sessionId,
    narrativeContext: narrativeContextWithRoster,
    generationParameters: request.generationParameters,
    toneSettings,
    npcRoster,
    characterSkillContext: '',
    worldSkills:
      world.skills?.map((skill) => ({
        id: skill.id,
        name: skill.name,
        description: skill.description,
      })) || [],
  };
};

// ─── Lore + Goals ───────────────────────────────────────────────────────────

export const enhancePromptWithLore = (
  prompt: string,
  worldId: EntityID,
  sessionId?: EntityID
): string => {
  const loreContext = getLoreContextForPrompt(worldId, sessionId, {
    recordUsage: true,
    source: 'narrative',
  });
  return prompt + loreContext;
};

export const enhancePromptWithGoalContext = async (
  prompt: string,
  sessionId?: string
): Promise<string> => {
  if (!sessionId) return prompt;

  try {
    const aiContext = await useAiContextStore
      .getState()
      .buildContextForSession(sessionId);

    if (aiContext.goalContext && safeTrim(aiContext.goalContext)) {
      const goalSection = `\n\nCURRENT NARRATIVE GOALS:\n${aiContext.goalContext}\n\nPlease consider these goals when generating the narrative content.`;

      return `${prompt}${goalSection}`;
    }

    return prompt;
  } catch {
    return prompt;
  }
};

// ─── Tone ───────────────────────────────────────────────────────────────────

export const enhancePromptWithToneSettings = (
  prompt: string,
  world: World,
  cache: NarrativeStaticContentCache
): string => {
  const toneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;
  const cacheKey = `${world.id}-${toneSettings.contentRating}-${toneSettings.narrativeStyle}-${toneSettings.languageComplexity}`;

  if (!cache.toneSettings) {
    cache.toneSettings = new Map();
  }

  let toneInstructions = cache.toneSettings.get(cacheKey);

  if (!toneInstructions) {
    const detailedInstructions = getDetailedToneInstructions(
      toneSettings.contentRating,
      toneSettings.narrativeStyle,
      toneSettings.languageComplexity,
      toneSettings.customInstructions
    );

    const complexityAlert = getComplexityAlert(toneSettings.languageComplexity);

    toneInstructions = detailedInstructions + complexityAlert;
    cache.toneSettings.set(cacheKey, toneInstructions);
  }

  return prompt + toneInstructions;
};

// ─── Inventory ──────────────────────────────────────────────────────────────

export const enhancePromptWithInventory = (
  prompt: string,
  characterIds: string[]
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
    const { context: inventorySection } = buildInventoryContext(items, {
      equippedItemIds,
    });

    if (!inventorySection) {
      return prompt;
    }

    const guidance =
      'When generating narrative, naturally reference these items only if they matter to the current situation. Avoid forced mentions or repetitive callbacks.';

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
    // Read equipped state from the canonical inventory store — the same source
    // the displayed items and buildInventoryContext() draw from.
    const { getCharacterItems } = useInventoryStore.getState();
    return getCharacterItems(characterIds[0])
      .filter((item) => item.equipped)
      .map((item) => item.id);
  } catch {
    return [];
  }
};

// ─── Item Acquisition ───────────────────────────────────────────────────────

export const enhancePromptWithItemAcquisitionInstructions = (
  prompt: string,
  cache: NarrativeStaticContentCache
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
- categoryHint: The item's category, inferred from story context - one of:
  - "equipment": weapons, armor, tools, devices, gear carried and reused
  - "consumables": food, potions, medicine, fuel, single-use items
  - "quest-items": plot-critical items, keys, sigils, relics that drive the story
  - "valuables": currency, gems, treasure, trade goods
  - "documents": books, letters, maps, notes, records
  - "personal": keepsakes, mementos, clothing, accessories, character-specific effects
  - "miscellaneous": anything that fits none of the above

Examples:
- Character finds a sword: Include {name: "Ancient Sword", description: "A blade from ages past", quantity: 1, acquisitionMethod: "loot", categoryHint: "equipment"}
- Character buys 3 potions: Include {name: "Healing Potion", description: "Restores health", quantity: 3, acquisitionMethod: "purchase", categoryHint: "consumables"}
- Character receives a key as reward: Include {name: "Iron Key", description: "Opens the eastern gate", quantity: 1, acquisitionMethod: "reward", categoryHint: "quest-items"}

Important:
- Only include items the character ACTUALLY ACQUIRES AND KEEPS during this segment (not items they merely see, borrow momentarily, use as environmental tools, or were already carrying)
- Avoid duplicate entries for the same object; use the description to capture clarifications or additional detail
- CRITICAL: Do NOT list the same item name twice. If the character gains multiple of the same item, set quantity accordingly on a single entry instead of repeating the name.
- If you need to clarify an already listed item, update its description rather than adding another entry.
- Example: if "Iron Sword" is already present, do not add another "Iron Sword" later. Either refine the original description or increase the quantity when the character truly acquires additional swords.
- Be specific with item names and descriptions
- Use an appropriate acquisitionMethod for the narrative context
- Always include a categoryHint - you understand the item's role in the story better than a separate pass could
- If the narrative mentions vague supplies, still include the best concrete description you can infer

The items will be automatically added to the character's inventory with proper categorization and journal entries.`;
  }

  return prompt + cache.itemAcquisitionInstructions;
};

// ─── Item Loss ──────────────────────────────────────────────────────────────

export const enhancePromptWithItemLossInstructions = (
  basePrompt: string,
  cache: NarrativeStaticContentCache,
  characterInventory: InventoryItem[]
): string => {
  if (!cache.itemLossInstructions) {
    cache.itemLossInstructions = ITEM_LOSS_INSTRUCTIONS_TEMPLATE;
  }

  const inventoryContext = formatInventoryForPrompt(characterInventory);
  const fullInstructions = cache.itemLossInstructions.replace(
    '{{INVENTORY_CONTEXT}}',
    inventoryContext
  );

  return basePrompt + '\n\n' + fullInstructions;
};

/**
 * The cost channel's scene-side half: what the character carries, and the
 * rule that a landing world-clock thread takes something recordable. Off the
 * flag, or with no character, the prompt is returned untouched.
 */
export const enhancePromptWithWorldCost = (prompt: string, characterIds: string[]): string => {
  if (!isFeatureEnabled('WORLD_COST') || characterIds.length === 0) {
    return prompt;
  }
  const character = useCharacterStore.getState().characters[characterIds[0]];
  if (!character) {
    return prompt;
  }
  return prompt + '\n' + worldCostBlock(character.status.conditions);
};

function formatInventoryForPrompt(items: InventoryItem[]): string {
  if (!items || items.length === 0) {
    return '(Empty - character has no items)';
  }

  return items
    .map((item) => `- ${item.name} (${item.quantity}x) [${item.categoryId}]`)
    .join('\n');
}

const ITEM_LOSS_INSTRUCTIONS_TEMPLATE = `
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
