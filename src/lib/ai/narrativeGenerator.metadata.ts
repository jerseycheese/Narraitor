import type { AIClient } from './types';
import type { GeneratedCharacterMetadata } from '@/types/narrative.types';
import type { InventoryAcquisitionMethod } from '@/types/inventory.types';
import { safeTrim } from '@/lib/utils';

export const analyzeSegmentMetadata = async (
  content: string,
  characters: GeneratedCharacterMetadata[] | undefined,
  candidateIds: string[],
  geminiClient: AIClient
): Promise<{
  presentCharacterIds: string[];
  items: Array<{
    name: string;
    description?: string;
    quantity?: number;
    acquisitionMethod?: InventoryAcquisitionMethod;
  }>;
}> => {
  if (!content) {
    return { presentCharacterIds: candidateIds, items: [] };
  }

  if (process.env.NODE_ENV === 'test') {
    return { presentCharacterIds: candidateIds, items: [] };
  }

  const roster = new Map<string, { name: string; description?: string }>();
  characters?.forEach((character) => {
    if (character?.id && character.name) {
      roster.set(character.id, {
        name: character.name,
        description: character.description,
      });
    }
  });

  const rosterLines = candidateIds
    .map((id) => {
      const entry = roster.get(id);
      const displayName = entry?.name || id;
      const summary = entry?.description ? ` — ${entry.description}` : '';
      return `- ${id}: ${displayName}${summary}`;
    })
    .join('\n');

  const prompt = `
You are validating metadata for a narrative segment. Analyze the passage and produce two things:
1. Which of the provided NPC IDs are PHYSICALLY present in the scene with the protagonist (sharing the same location, acting together, or speaking face-to-face).
2. Any tangible items the protagonist ends the scene possessing.

Rules for presence:
- Only mark an NPC as present if the narration makes it clear they are co-located with the protagonist during this scene.
- Exclude NPCs who are merely referenced, remembered, mentioned as being elsewhere, or communicating remotely (phone, radio, etc.).
- Only use the provided candidate IDs.

Rules for items:
- Include an item only if the protagonist finishes the scene still holding or carrying it.
- Ignore objects that are merely observed, touched briefly, or immediately set aside.
- Provide concise names and optional descriptions.

Respond with STRICT JSON in this shape (no commentary):
{
  "presentCharacterIds": ["npc-id-1", "npc-id-2"],
  "items": [
    {
      "name": "Item name",
      "description": "Short description",
      "quantity": 1,
      "acquisitionMethod": "loot" | "quest" | "purchase" | "craft" | "reward" | "gift" | "manual" | "unknown"
    }
  ]
}

CANDIDATE NPCS:
${rosterLines || '- (none)'}

NARRATIVE:
"""
${content}
"""
    `.trim();

  try {
    const response = await geminiClient.generateContent(prompt);
    const raw = response.content ?? '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { presentCharacterIds: candidateIds, items: [] };
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      presentCharacterIds?: string[];
      items?: Array<{
        name?: string;
        description?: string;
        quantity?: number;
        acquisitionMethod?: InventoryAcquisitionMethod;
      }>;
    };

    const allowed = new Set(candidateIds.map((id) => id.toLowerCase()));
    const presentCharacterIds = Array.isArray(parsed.presentCharacterIds)
      ? parsed.presentCharacterIds
          .map((id) => id?.toString().trim())
          .filter((id): id is string => Boolean(id))
          .filter((id) => allowed.has(id.toLowerCase()))
      : candidateIds;

    const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
    const allowedAcquisitionMethods: InventoryAcquisitionMethod[] = [
      'loot',
      'quest',
      'purchase',
      'craft',
      'reward',
      'gift',
      'manual',
      'unknown',
    ];

    const items = rawItems
      .filter((item): item is Required<typeof item> => Boolean(item?.name))
      .map((item) => {
        const rawMethod =
          item.acquisitionMethod && typeof item.acquisitionMethod === 'string'
            ? item.acquisitionMethod.toLowerCase().trim()
            : 'unknown';
        const acquisitionMethod = allowedAcquisitionMethods.includes(
          rawMethod as InventoryAcquisitionMethod
        )
          ? (rawMethod as InventoryAcquisitionMethod)
          : 'unknown';

        return {
          name: safeTrim(item.name!),
          description: item.description
            ? safeTrim(item.description)
            : undefined,
          quantity:
            typeof item.quantity === 'number' && !Number.isNaN(item.quantity)
              ? item.quantity
              : 1,
          acquisitionMethod,
        };
      })
      .filter((item) => item.name.length > 0);

    return {
      presentCharacterIds,
      items,
    };
  } catch {
    return { presentCharacterIds: candidateIds, items: [] };
  }
};
