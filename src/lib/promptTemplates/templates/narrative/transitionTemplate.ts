import { PERSPECTIVE_EXAMPLES, shouldIncludeExamples } from '../../examples';
import { majorEventGuidelines } from './majorEventGuidelines';
import type { NarrativeTemplateContext } from './context';

export const transitionTemplate = (context: NarrativeTemplateContext) => {
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
- Do NOT list NPCs who are only mentioned as destinations or references; keep metadata.characterIds limited to characters physically with the player.
- If an off-screen NPC must be foreshadowed, add them to metadata.characters for later continuity but leave them out of metadata.characterIds.
- Set metadata.speakerId only when a single NPC speaks directly to the player; otherwise omit it.
- If no NPCs are present, use [] for metadata.characterIds.
- Never output bracket tokens like [npc-id] in the narrative text.
`
    : '';

  // Build the base template
  const baseContent = `Create a transition in the ${genre} narrative for "${worldName}".

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

IMPORTANT: Write in SECOND PERSON perspective (using "you").`;

  const examplesSection = shouldIncludeExamples(previousContent?.length || 0)
    ? PERSPECTIVE_EXAMPLES
    : '';

  return `${baseContent}${examplesSection}

${formattedRoster}

${majorEventGuidelines}

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
    "tags": ["transition"],
    "itemsLost": [],
    "majorEvent": "ONLY if this beat is CONSEQUENTIAL and PLOT-ADVANCING (critical decision, major revelation, significant relationship shift, major goal progress, or story-changing event) - otherwise null"
  }
}`;
};
