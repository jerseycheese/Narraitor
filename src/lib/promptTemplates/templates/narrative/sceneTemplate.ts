import { PromptTemplate } from '../../types';

export const sceneTemplate: PromptTemplate = (context: any) => {
  const {
    worldName,
    worldDescription,
    genre,
    tone,
    narrativeContext,
    generationParameters
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

Focus on sensory details and character reactions to bring the scene to life.

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