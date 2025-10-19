// import { PromptTemplate } from '../../types';

export const transitionTemplate = (context: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const {
    worldName,
    genre,
    tone,
    previousContent,
    previousType,
    newLocation,
    npcRoster = []
  } = context;

  const formattedRoster = Array.isArray(npcRoster) && npcRoster.length > 0
    ? `
NPC ROSTER (Reference IDs for metadata.characterIds):
${npcRoster.map((npc: { id: string; name: string; description?: string }) => `- ${npc.name} [${npc.id}]${npc.description ? ` — ${npc.description}` : ''}`).join('\n')}

NPC METADATA RULES:
- If an NPC accompanies or addresses the player during the transition, add their ID to metadata.characterIds.
- Set metadata.speakerId only when a single NPC speaks directly to the player; otherwise omit it.
- If no NPCs are present, use [] for metadata.characterIds.
- Never output bracket tokens like [npc-id] in the narrative text.
`
    : '';

  return `Create a transition in the ${genre} narrative for "${worldName}".

Previous Content: ${previousContent}
Previous Type: ${previousType}
${newLocation ? `Moving to: ${newLocation}` : 'Continuing in the same location'}
Tone: ${tone}

Generate a smooth transition that:
1. Bridges the previous scene to the next
2. Maintains narrative flow
3. ${newLocation ? 'Describes the journey or change of location' : 'Shows the passage of time'}
4. Keeps the ${tone} tone consistent
5. Is concise (1-2 sentences)

IMPORTANT: Write in SECOND PERSON perspective (using "you").
Example: "You make your way through..." NOT "The character travels..." or using character names.

${formattedRoster}

Response Format:
{
  "content": "The transition text goes here...",
  "type": "transition",
  "metadata": {
    "characterIds": [],
    "speakerId": "npc-id-if-applicable",
    "characters": [
      {
        "id": "npc-id-if-applicable",
        "name": "NPC Name",
        "description": "Short description",
        "role": "Role or relationship",
        "avatarPrompt": "Visual prompt describing their look"
      }
    ],
    "mood": "appropriate mood",
    ${newLocation ? `"location": "${newLocation}",` : ''}
    "tags": ["transition"]
  }
}`;
};
