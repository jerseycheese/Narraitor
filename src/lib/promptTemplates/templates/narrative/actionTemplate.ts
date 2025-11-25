// Action template focused on immediate item usage beats
import { NarrativeSegment } from '@/types/narrative.types';
import { majorEventGuidelines } from './majorEventGuidelines';

export const actionTemplate = (context: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const {
    worldName,
    genre,
    tone,
    narrativeContext,
    characterSkillContext,
    enhancedCharacterContext,
    npcRoster = [],
  } = context;

  const recentSegments = narrativeContext?.recentSegments || [];
  const recentContent = recentSegments
    .map((segment: NarrativeSegment, index: number) => `[Scene ${index + 1}]: ${segment.content}`)
    .join('\n\n');

  const currentLocation = narrativeContext?.currentLocation;
  const itemEntity = narrativeContext?.importantEntities?.find(
    (entity: { type?: string }) => entity.type === 'item'
  );

  const formattedRoster = Array.isArray(npcRoster) && npcRoster.length > 0
    ? `
NPC ROSTER (Reference IDs for metadata.characterIds):
${npcRoster.map((npc: { id: string; name: string; description?: string }) => `- ${npc.name} [${npc.id}]${npc.description ? ` — ${npc.description}` : ''}`).join('\n')}
`
    : '';

  return `Continue the ${genre} narrative for "${worldName}" by writing a short action beat about the player using a specific item.

World: ${worldName}
Tone: ${tone}${characterSkillContext ? characterSkillContext : ''}${enhancedCharacterContext ? enhancedCharacterContext : ''}
Location: ${currentLocation || 'Use the last established location'}

STORY SO FAR:
${recentContent || 'No prior segments – establish context from the action itself while staying grounded.'}

PLAYER ACTION:
${narrativeContext?.currentSituation || 'The player uses an important item in the current scene.'}

CRITICAL REQUIREMENTS:
- Center the narrative on how the player literally uses the highlighted item${itemEntity?.name ? ` "${itemEntity.name}"` : ''}.
- SHOW the physical action, sensory details, and immediate outcome the item causes.
- Connect the effect to the current stakes established in earlier segments; the action should matter.
- DO NOT repeat the inventory description verbatim — reinterpret it through the moment.
- Keep the perspective in SECOND PERSON ("you") and stay in present tense.
- Avoid game mechanics, inventory jargon, or UI references.
- 2 to 4 sentences max; keep the beat tight and focused on the moment.

${formattedRoster}

NPC METADATA RULES:
- Use NPC names in prose, but list their IDs in metadata.characterIds if they appear or speak during this beat.
- Do NOT include NPCs who are only mentioned or remembered—only characters sharing the scene belong in metadata.characterIds.
- If you reference an off-screen NPC for future context, add them to metadata.characters but leave metadata.characterIds unchanged.
- If a single NPC addresses the player directly, set metadata.speakerId to that NPC's ID. Otherwise omit speakerId.
- If no NPCs are involved, set metadata.characterIds to [].
- When creating a new NPC, append them to metadata.characters with a slug-style id and concise description so future segments can reference them consistently.
- Prefer pulling speaking characters from the roster when possible; avoid inventing new NPC identities unless there is no roster member who fits.
- Do not include bracket tokens like [npc-id] in the narrative – keep IDs strictly in metadata.

${majorEventGuidelines}

Response Format:
{
  "content": "The action beat goes here...",
  "type": "action",
  "metadata": {
    "characterIds": [],
    "speakerId": "npc-id-if-applicable",
    "characters": [
      {
        "id": "npc-id-if-applicable",
        "name": "NPC Name",
        "description": "Short description",
        "role": "Role or relationship",
        "avatarPrompt": "Visual prompt for consistent portrait"
      }
    ],
    "mood": "appropriate mood",
    "location": "Current location",
    "tags": ["item-usage", "action-beat"],
    "majorEvent": "ONLY if this beat is CONSEQUENTIAL and PLOT-ADVANCING (critical decision, major revelation, significant relationship shift, major goal progress, or story-changing event) - otherwise null"
  }
}`;
};
