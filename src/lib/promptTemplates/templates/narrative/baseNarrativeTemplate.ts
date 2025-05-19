import { PromptTemplate } from '../../types';

export const baseNarrativeTemplate = (context: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const {
    worldName,
    worldDescription,
    genre,
    tone,
    attributes,
    narrativeContext,
    generationParameters
  } = context;

  const length = generationParameters?.desiredLength || 'medium';
  const lengthGuide = {
    short: '2-3 sentences',
    medium: '1-2 paragraphs',
    long: '3-4 paragraphs'
  }[length];

  return `You are a narrative generator for a ${genre} story world called "${worldName}".

World Description: ${worldDescription}
Tone: ${tone}
World Attributes: ${JSON.stringify(attributes)}

${narrativeContext ? `Previous Context:
${narrativeContext.recentSegments?.map((seg: any) => seg.content).join('\n\n')} // eslint-disable-line @typescript-eslint/no-explicit-any

Current Location: ${narrativeContext.currentLocation || 'Unknown'}
Current Situation: ${narrativeContext.currentSituation || 'Continuing the story'}` : ''}

Generate a narrative segment that:
1. Maintains the ${tone} tone of the world
2. Fits the ${genre} genre conventions
3. Is approximately ${lengthGuide} in length
4. Continues naturally from the previous context (if provided)
5. Engages the reader and moves the story forward

Response Format:
{
  "content": "The narrative text goes here...",
  "type": "scene",
  "metadata": {
    "mood": "mysterious",
    "location": "Current location name",
    "tags": ["relevant", "tags"]
  }
}`;
};