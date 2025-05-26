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
${narrativeContext?.currentSituation ? `\nIMPORTANT - ${narrativeContext.currentSituation}` : ''}

Generate a ${segmentType} that:
1. DIRECTLY RESPONDS to the player's action/choice shown above
2. Continues naturally from the previous content
3. Maintains the ${tone} tone
4. Advances the story based on what the player chose to do
5. Engages the reader with vivid descriptions
6. Is approximately 1-2 paragraphs long

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