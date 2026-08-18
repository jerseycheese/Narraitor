import { majorEventGuidelines } from './majorEventGuidelines';
import type { NarrativeTemplateContext } from './context';

export const initialSceneTemplate = (context: NarrativeTemplateContext) => {
  const {
    worldName,
    worldDescription,
    genre,
    tone,
    attributes,
    characterIds,
    playerCharacterName,
    playerCharacterBackground,
    enhancedCharacterContext,
    npcRoster = []
  } = context;

  return `You are creating the opening scene for a ${genre} story world called "${worldName}".

World Description: ${worldDescription}
Tone: ${tone}
World Attributes: ${JSON.stringify(attributes)}
${playerCharacterName ? `Player Character: ${playerCharacterName} (THE PLAYER - write from their perspective using "you")` : ''}
${playerCharacterBackground ? `Player Background: ${JSON.stringify(playerCharacterBackground)}` : ''}
${enhancedCharacterContext ? enhancedCharacterContext : ''}
${characterIds && characterIds.length > 1 ? `Other Characters: ${characterIds.slice(1).join(', ')}` : ''}

${Array.isArray(npcRoster) && npcRoster.length > 0 ? `NPC ROSTER (Reference IDs for metadata.characterIds):
${npcRoster.map((npc: { id: string; name: string; description?: string }) => `- ${npc.name} [${npc.id}]${npc.description ? ` — ${npc.description}` : ''}`).join('\n')}

NPC METADATA RULES:
- Use NPC names naturally in the narrative.
- For any NPC who appears or speaks in this opening scene, include their ID (from the roster above) in metadata.characterIds.
- Do NOT include NPCs who are only spoken about or foreshadowed; keep metadata.characterIds limited to characters physically sharing the scene.
- If you reference someone off-screen for later use, add them to metadata.characters but leave metadata.characterIds untouched.
- If a single NPC addresses the player directly, set metadata.speakerId to that NPC's ID. Otherwise omit speakerId.
- If no NPCs appear yet, set metadata.characterIds to [].
- When you introduce a new NPC, add them to metadata.characters with a slug-style id (lowercase-hyphenated) and reuse that same id in later segments.
- Do not surface bracketed IDs (e.g., [npc-id]) in the prose—keep identifiers in metadata only.
` : ''}

Create an engaging opening scene that:
1. Introduces the world and its atmosphere
2. Sets the ${tone} tone immediately
3. Follows ${genre} genre conventions
4. Hooks the reader with intrigue or action
5. Establishes the initial setting and situation
6. Is engaging and substantial - exactly 1 paragraph of 3-5 sentences that vividly establishes the scene

${(worldName && (worldName.toLowerCase().includes('1990') || worldName.toLowerCase().includes('1980') || worldName.toLowerCase().includes('1970'))) || (genre && (genre.toLowerCase().includes('modern') || genre.toLowerCase().includes('contemporary') || genre.toLowerCase().includes('realistic'))) ? `

CRITICAL REALISM CONSTRAINTS:
- This is a completely realistic, mundane setting with NO supernatural elements
- NO magical, mystical, fantasy, psychic, or otherworldly phenomena whatsoever
- NO special powers, reality-shifting, destiny, or metaphysical concepts
- Focus on real human drama, realistic challenges, and authentic period details
- Use only technology, situations, and social dynamics that actually existed in the time period
- Any tension should come from realistic human conflict, not supernatural forces
- All sounds and effects must have normal, realistic explanations
` : ''}

CRITICAL INSTRUCTIONS:
1. Write the narrative in SECOND PERSON perspective (using "you" instead of character names or "they")
2. The player IS ${playerCharacterName || 'the main character'} - NEVER refer to them by name in narration
3. Only use the player's name when OTHER characters speak TO or ABOUT them
4. The player experiences the story through ${playerCharacterName || 'their character'}'s eyes
5. Write only the scene itself - no HTML tags, and no closing note about what the narrative will do next

Examples:
✓ CORRECT: "You adjust your pack and look at the trail ahead..."
✗ WRONG: "${playerCharacterName || 'The character'} adjusts their pack..."
✓ CORRECT (dialogue): "'Hey ${playerCharacterName || 'there'}!' someone calls out to you."
✗ WRONG: "You see ${playerCharacterName || 'yourself'} in the mirror..."

The opening should immerse the reader in the world while leaving room for the story to develop.

SENSORY WRITING GUIDELINES:
- Focus on visual, auditory, and tactile descriptions primarily
- Avoid repetitive olfactory descriptions (smells/scents/odors) unless essential to the scene
- Use fresh, varied sensory language to avoid clichéd phrases

${majorEventGuidelines}

SEGMENT TYPE SELECTION:
Choose the most appropriate segment type for your opening narrative:
- "dialogue": Use if the opening is primarily conversation
- "action": Use if starting with physical action or combat
- "transition": Use if describing arrival or location change
- "scene": Use for descriptive opening (most common for initial scenes)

Response Format (CRITICAL - must be valid JSON):
{
  "content": "WRITE THE FULL NARRATIVE CONTENT HERE - this must be 3-5 complete sentences that tell an engaging story, NOT just metadata or short phrases",
  "type": "dialogue" | "action" | "transition" | "scene",
  "metadata": {
    "characterIds": [],
    "speakerId": "npc-id-if-someone-speaks",
    "characters": [
      {
        "id": "npc-id-if-someone-speaks",
        "name": "NPC Name",
        "description": "Short evocative description",
        "role": "Role or relationship",
        "avatarPrompt": "Visual prompt describing their look"
      }
    ],
    "mood": "mysterious",
    "location": "Starting location",
    "tags": ["opening", "introduction"],
    "itemsLost": [],
    "majorEvent": "Review the content field above. If it contains a CONSEQUENTIAL story beat (critical decision, major revelation, relationship shift, goal progress, or story-changing event), summarize THAT SPECIFIC MOMENT in one short clause (max 18 words). Otherwise null. This must describe what ACTUALLY HAPPENED in your narrative, not a generic description."
  }
}

IMPORTANT: The "content" field must contain the actual story narrative, not just type information or location names.`;
};
