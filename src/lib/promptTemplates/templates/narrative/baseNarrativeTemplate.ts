import {
  PERSPECTIVE_AND_EMPHASIS_EXAMPLES,
  shouldIncludeExamples,
} from '../../examples';
import { majorEventGuidelines } from './majorEventGuidelines';
import { describeNarrativeLength } from './narrativeLength';
import { estimateTokenCount } from '@/lib/promptContext/tokenUtils';
import type { NarrativeTemplateContext } from './context';

export const baseNarrativeTemplate = (context: NarrativeTemplateContext) => {
  const {
    worldName,
    worldDescription,
    genre,
    tone,
    attributes,
    narrativeContext,
    generationParameters,
    toneSettings,
    npcRoster = []
  } = context;
  
  // Tone settings are handled by the AI system prompt enhancement
  void toneSettings;

  const lengthDescription = describeNarrativeLength(generationParameters);

  const formattedRoster = Array.isArray(npcRoster) && npcRoster.length > 0
    ? `
NPC ROSTER (Reference IDs for metadata.characterIds):
${npcRoster.map((npc: { id: string; name: string; description?: string }) => `- ${npc.name} [${npc.id}]${npc.description ? ` — ${npc.description}` : ''}`).join('\n')}

NPC METADATA RULES:
- Mention NPCs by name in the prose, but capture their IDs from this roster in metadata.characterIds when they appear or speak.
- Do NOT add NPCs who are merely mentioned or remembered—only characters physically sharing the scene belong in metadata.characterIds.
- If you reference an off-screen character for future continuity, add them to metadata.characters but leave metadata.characterIds unchanged.
- If a single NPC directly addresses the player, set metadata.speakerId to that NPC's ID. Otherwise omit speakerId.
- If no NPCs are present, set metadata.characterIds to [].
- Never invent new IDs—only use the ones supplied here or previously established in metadata.
`
    : '';

  // Build the base template content
  const baseContent = `You are a narrative generator for a ${genre} story world called "${worldName}".

World Description: ${worldDescription}
Tone: ${tone}
World Attributes: ${JSON.stringify(attributes)}

${narrativeContext ? `Previous Context:
${narrativeContext.recentSegments?.map((seg) => seg.content).join('\n\n')}

Current Location: ${narrativeContext.currentLocation || 'Unknown'}
Current Situation: ${narrativeContext.currentSituation || 'Continuing the story'}` : ''}

Generate a narrative segment that:
1. Maintains the ${tone} tone of the world
2. Fits the ${genre} genre conventions
3. Is approximately ${lengthDescription} in length
4. Continues naturally from the previous context (if provided)
5. Engages the reader and moves the story forward
6. Uses varied sensory descriptions (primarily visual, auditory, tactile)
7. Avoids repetitive olfactory descriptions unless essential to the scene
8. Adds emphasis for dramatic effect using markdown formatting:
   - Use *single asterisks* around important phrases, atmospheric details, or notable objects
   - Use **double asterisks** around critical moments, intense emotions, or dramatic revelations
   - Apply emphasis sparingly (2-4 times per paragraph) to maintain impact`;

  const contextLength = estimateTokenCount(narrativeContext?.recentSegments?.map((seg) => seg.content).join('\n\n') || '');

  const examplesSection = shouldIncludeExamples(contextLength)
    ? PERSPECTIVE_AND_EMPHASIS_EXAMPLES
    : '';

  return `${baseContent}${examplesSection}

${formattedRoster}

NPC METADATA RULES:
- Mention NPCs by name in the prose, but capture their IDs from this roster in metadata.characterIds when they appear or speak.
- If a single NPC directly addresses the player, set metadata.speakerId to that NPC's ID. Otherwise omit speakerId.
- If no NPCs are present, set metadata.characterIds to [].
- When inventing a new NPC, add them to metadata.characters with a slug-style id (lowercase with hyphens), a short description, and an avatar prompt so future segments can reuse the same identity.
- Do not print character IDs or bracketed tokens (e.g., [npc-id]) in the narrative text.

${majorEventGuidelines}

Response Format:
{
  "content": "The narrative text goes here...",
  "type": "scene",
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
    "mood": "mysterious",
    "location": "Current location name",
    "tags": ["relevant", "tags"],
    "itemsLost": [],
    "majorEvent": "ONLY if this beat is CONSEQUENTIAL and PLOT-ADVANCING (critical decision, major revelation, significant relationship shift, major goal progress, or story-changing event) - otherwise null"
  }
}`;
};
