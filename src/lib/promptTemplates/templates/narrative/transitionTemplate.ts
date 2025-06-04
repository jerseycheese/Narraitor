// import { PromptTemplate } from '../../types';

export const transitionTemplate = (context: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const {
    worldName,
    genre,
    tone,
    previousContent,
    previousType,
    newLocation
  } = context;

  return `Create a transition in the ${genre} narrative for "${worldName}".

Previous Content: ${previousContent}
Previous Type: ${previousType}
${newLocation ? `Moving to: ${newLocation}` : 'Continuing in the same location'}
Tone: ${tone}

Generate a smooth transition that:
1. Bridges the previous scene to the next
2. Maintains narrative flow
3. ${newLocation ? 'Describes the journey or change of location' : 'Shows the passage of time'}
4. Keeps the ${tone} tone consistent
5. Is concise (1-2 sentences)

IMPORTANT: Write in SECOND PERSON perspective (using "you").
Example: "You make your way through..." NOT "The character travels..." or using character names.

Response Format:
{
  "content": "The transition text goes here...",
  "type": "transition",
  "metadata": {
    "mood": "appropriate mood",
    ${newLocation ? `"location": "${newLocation}",` : ''}
    "tags": ["transition"]
  }
}`;
};
