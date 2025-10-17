// Action template focused on immediate item usage beats
import { NarrativeSegment } from '@/types/narrative.types';

export const actionTemplate = (context: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const {
    worldName,
    genre,
    tone,
    playerCharacterName,
    narrativeContext,
    characterSkillContext,
    enhancedCharacterContext,
  } = context;

  const recentSegments = narrativeContext?.recentSegments || [];
  const recentContent = recentSegments
    .map((segment: NarrativeSegment, index: number) => `[Scene ${recentSegments.length - index}]: ${segment.content}`)
    .join('\n\n');

  const currentLocation = narrativeContext?.currentLocation;
  const itemEntity = narrativeContext?.importantEntities?.find(
    (entity: { type?: string }) => entity.type === 'item'
  );

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

Response Format:
{
  "content": "The action beat goes here...",
  "type": "action",
  "metadata": {
    "mood": "appropriate mood",
    "location": "Current location",
    "tags": ["item-usage", "action-beat"]
  }
}`;
};
