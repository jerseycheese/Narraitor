// import { PromptTemplate } from '../../types';

export const initialSceneTemplate = (context: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const {
    worldName,
    worldDescription,
    genre,
    tone,
    attributes,
    characterIds
  } = context;

  return `You are creating the opening scene for a ${genre} story world called "${worldName}".

World Description: ${worldDescription}
Tone: ${tone}
World Attributes: ${JSON.stringify(attributes)}
${characterIds?.length > 0 ? `Characters in scene: ${characterIds.join(', ')}` : ''}

Create an engaging opening scene that:
1. Introduces the world and its atmosphere
2. Sets the ${tone} tone immediately
3. Follows ${genre} genre conventions
4. Hooks the reader with intrigue or action
5. Establishes the initial setting and situation
6. Is approximately 2-3 paragraphs long

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