// import { PromptTemplate } from '../../types';

export const baseNarrativeTemplate = (context: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
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

  const length = generationParameters?.desiredLength || 'short';
  const lengthGuide: Record<string, string> = {
    short: '4-6 sentences (1 paragraph)',
    medium: '1-2 paragraphs',
    long: '3-4 paragraphs'
  };
  const lengthDescription = lengthGuide[length] || lengthGuide.medium;

  const formattedRoster = Array.isArray(npcRoster) && npcRoster.length > 0
    ? `
NPC ROSTER (Reference IDs for metadata.characterIds):
${npcRoster.map((npc: { id: string; name: string; description?: string }) => `- ${npc.name} [${npc.id}]${npc.description ? ` — ${npc.description}` : ''}`).join('\n')}

NPC METADATA RULES:
- Mention NPCs by name in the prose, but capture their IDs from this roster in metadata.characterIds when they appear or speak.
- If a single NPC directly addresses the player, set metadata.speakerId to that NPC's ID. Otherwise omit speakerId.
- If no NPCs are present, set metadata.characterIds to [].
- Never invent new IDs—only use the ones supplied here or previously established in metadata.
`
    : '';

  return `You are a narrative generator for a ${genre} story world called "${worldName}".

World Description: ${worldDescription}
Tone: ${tone}
World Attributes: ${JSON.stringify(attributes)}

${narrativeContext ? `Previous Context:
${// eslint-disable-next-line @typescript-eslint/no-explicit-any
narrativeContext.recentSegments?.map((seg: any) => seg.content).join('\n\n')}

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
   - Apply emphasis sparingly (2-4 times per paragraph) to maintain impact
   - Example: "The *Arasaka building* looms ahead, its security pulsing like a **digital heartbeat**"

${formattedRoster}

Response Format:
{
  "content": "The narrative text goes here...",
  "type": "scene",
  "metadata": {
    "characterIds": [],
    "speakerId": "npc-id-if-applicable",
    "mood": "mysterious",
    "location": "Current location name",
    "tags": ["relevant", "tags"]
  }
}`;
};
