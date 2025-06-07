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
  const { worldName, genre, narrativeContext } = context;
  
  // Extract recent narrative content to provide context
  const recentContent = narrativeContext?.recentSegments
    ?.slice(-1) // Use only the latest segment to reduce context size
    .map(segment => segment.content)
    .join('\n\n') || '';
  
  // Extract current location for context
  const location = narrativeContext?.currentLocation || '';
  
  // Create a more comprehensive context by including more of the narrative
  // but still managing token usage intelligently
  let shortContext = '';
  if (recentContent.length <= 1000) {
    // If content is reasonably short, use it all
    shortContext = recentContent;
  } else {
    // For longer content, use first 400 chars + last 400 chars + middle indicator
    const firstPart = recentContent.slice(0, 400);
    const lastPart = recentContent.slice(-400);
    shortContext = `${firstPart}\n\n[...narrative continues...]\n\n${lastPart}`;
  }
  
  return `You are creating meaningful player choices for an interactive narrative game set in the world of "${worldName}".
${genre ? `Genre: ${genre}` : ''}

CURRENT CONTEXT (brief summary):
${shortContext}
${location ? `Current location: ${location}` : ''}

INSTRUCTIONS:
Based on the ENTIRE narrative context (both beginning and end if provided), create 3 distinct action choices that:
1. Reference specific elements from the current scene (characters, objects, events, locations)
2. Offer meaningfully different paths forward in the story
3. Are concise (under 15 words) and written as direct actions
4. Consider both the immediate situation AND the broader story context

Write choices as direct actions without "you" (e.g., "Investigate the noise" not "You investigate the noise").

DECISION WEIGHT ANALYSIS:
Carefully evaluate the narrative situation and determine the significance of this decision:
- MINOR: Routine choices with limited consequences (casual conversations, basic exploration, everyday interactions)
- MAJOR: Important choices that significantly impact the story direction (meeting key characters, choosing major paths, using powerful abilities, entering dangerous areas, making moral choices)
- CRITICAL: Life-changing decisions with major consequences (combat with deadly enemies, final confrontations, destiny-altering choices, choosing between life and death)

Consider the stakes, potential consequences, and story impact. Don't default to MINOR - use MAJOR for interesting story moments and CRITICAL for climactic situations.

FORMAT:
Decision Weight: [MINOR/MAJOR/CRITICAL]
Decision: What will you do?

Options:
1. [First choice - action referencing specific story elements]
2. [Second choice - different approach to the situation]
3. [Third choice - alternative path considering story context]

Keep your response EXACTLY in this format. Include the Decision Weight line, then Decision and Options sections.`;
};

export default playerChoiceTemplate;
