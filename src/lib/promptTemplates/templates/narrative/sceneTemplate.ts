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
  const recentSegments = narrativeContext?.recentSegments || [];
  const recentContent = recentSegments.map((seg, i) => 
    `[Scene ${recentSegments.length - i}]: ${seg.content}`
  ).join('\n\n');

  return `Continue the ${genre} narrative for "${worldName}" with a new ${segmentType} segment.

World: ${worldName}
Tone: ${tone}

STORY SO FAR:
${recentContent}

${narrativeContext?.currentSituation ? `PLAYER ACTION: ${narrativeContext.currentSituation}` : ''}

CRITICAL CONTINUITY RULES:
- The player is EXACTLY where the last scene ended
- Time has NOT reset or jumped backward
- Pick up IMMEDIATELY from where the story left off
- The player's action happens RIGHT NOW in the current moment

Generate a ${segmentType} that:
1. Shows the IMMEDIATE RESULT of the player's action
2. Maintains perfect continuity with the previous scene
3. Does NOT repeat or revisit events that already happened
4. Advances the story forward in time (never backward)
5. Maintains the ${tone} tone
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