// import { PromptTemplate } from '../../types';

export const sceneTemplate = (context: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const {
    worldName,
    genre,
    tone,
    narrativeContext,
    generationParameters,
    playerCharacterName
  } = context;

  const segmentType = generationParameters?.segmentType || 'scene';
  const recentContent = narrativeContext?.recentSegments?.[0]?.content || '';

  return `Continue the ${genre} narrative for "${worldName}" with a new ${segmentType} segment.

World: ${worldName}
Tone: ${tone}
Previous Scene: ${recentContent}
${narrativeContext?.currentLocation ? `Current Location: ${narrativeContext.currentLocation}` : ''}

Generate a ${segmentType} that:
1. Continues naturally from the previous content
2. Maintains the ${tone} tone
3. Advances the story meaningfully
4. Engages the reader with vivid descriptions
5. Is approximately 1-2 paragraphs long

CRITICAL INSTRUCTIONS:
1. Write in SECOND PERSON perspective (using "you")
2. The player IS ${playerCharacterName || 'the main character'} - NEVER use their name in narration
3. Only use "${playerCharacterName}" when OTHER characters speak TO or ABOUT the player
4. The player experiences everything through ${playerCharacterName || 'their character'}'s perspective

Examples:
✓ CORRECT: "You feel the cold wind bite at your face..."
✗ WRONG: "${playerCharacterName || 'The character'} feels the cold wind..."
✓ CORRECT (dialogue): "'${playerCharacterName || 'Friend'}, are you alright?' the guard asks."

Focus on sensory details and the character's reactions to bring the scene to life.

Response Format:
{
  "content": "The scene description goes here...",
  "type": "${segmentType}",
  "metadata": {
    "mood": "appropriate mood",
    "location": "Current location",
    "tags": ["relevant", "scene", "tags"]
  }
}`;
};