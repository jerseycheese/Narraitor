// import { PromptTemplate } from '../../types';

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

  const length = generationParameters?.desiredLength || 'short';
  const lengthGuide: Record<string, string> = {
    short: '4-6 sentences (1 paragraph)',
    medium: '1-2 paragraphs',
    long: '3-4 paragraphs'
  };
  const lengthDescription = lengthGuide[length] || lengthGuide.medium;

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
