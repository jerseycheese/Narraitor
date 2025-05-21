import { NarrativeContext } from '@/types/narrative.types';

interface PlayerChoiceTemplateContext {
  worldName: string;
  worldDescription?: string;
  genre?: string;
  narrativeContext?: NarrativeContext;
  characterIds?: string[];
}

/**
 * Prompt template for generating player choices
 * Generates a decision prompt and 3-5 options based on the current narrative context
 */
export const playerChoiceTemplate = (context: PlayerChoiceTemplateContext): string => {
  const { worldName, worldDescription, genre, narrativeContext } = context;
  
  // Extract recent narrative content to provide context
  const recentContent = narrativeContext?.recentSegments
    ?.slice(-2)
    .map(segment => segment.content)
    .join('\n\n') || '';
  
  // Extract current location for context
  const location = narrativeContext?.currentLocation || '';
  
  return `You are creating meaningful player choices for an interactive narrative game set in the world of "${worldName}".
${worldDescription ? `World description: ${worldDescription}` : ''}
${genre ? `Genre: ${genre}` : ''}

CURRENT CONTEXT:
${recentContent}
${location ? `Current location: ${location}` : ''}

INSTRUCTIONS:
1. Based on the narrative context, create a decision prompt and 3-4 distinct choice options that would be meaningful for the player
2. Choices should be contextually appropriate and offer genuinely different paths forward
3. Each choice should be concise (max 15 words) and written in second person ("Investigate the noise" not "You investigate the noise")
4. Choices should represent actions the player can take, not just dialogue options

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
Decision: [A single sentence question framed as "What will you do?" or similar]

Options:
1. [First choice option]
2. [Second choice option]
3. [Third choice option]
4. [Fourth choice option - optional]

IMPORTANT: Only output the Decision and Options sections exactly as specified. Do not include any other text.`;
};

export default playerChoiceTemplate;