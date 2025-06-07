// import { PromptTemplate } from '../../types';

export const initialSceneTemplate = (context: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const {
    worldName,
    worldDescription,
    genre,
    tone,
    attributes,
    characterIds,
    playerCharacterName,
    playerCharacterBackground
  } = context;

  return `You are creating the opening scene for a ${genre} story world called "${worldName}".

World Description: ${worldDescription}
Tone: ${tone}
World Attributes: ${JSON.stringify(attributes)}
${playerCharacterName ? `Player Character: ${playerCharacterName} (THE PLAYER - write from their perspective using "you")` : ''}
${playerCharacterBackground ? `Player Background: ${JSON.stringify(playerCharacterBackground)}` : ''}
${characterIds?.length > 1 ? `Other Characters: ${characterIds.slice(1).join(', ')}` : ''}

Create an engaging opening scene that:
1. Introduces the world and its atmosphere
2. Sets the ${tone} tone immediately
3. Follows ${genre} genre conventions
4. Hooks the reader with intrigue or action
5. Establishes the initial setting and situation
6. Is engaging and substantial - exactly 1 paragraph of 4-6 sentences that vividly establishes the scene

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

Response Format (CRITICAL - must be valid JSON):
{
  "content": "WRITE THE FULL NARRATIVE CONTENT HERE - this must be 4-6 complete sentences that tell an engaging story, NOT just metadata or short phrases",
  "type": "scene",
  "metadata": {
    "mood": "mysterious",
    "location": "Starting location",
    "tags": ["opening", "introduction"]
  }
}

IMPORTANT: The "content" field must contain the actual story narrative, not just type information or location names.`;
};
