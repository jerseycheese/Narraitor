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
6. Is approximately 2-3 paragraphs long

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

Response Format:
{
  "content": "The opening narrative text goes here...",
  "type": "scene",
  "metadata": {
    "mood": "mysterious",
    "location": "Starting location",
    "tags": ["opening", "introduction"]
  }
}`;
};