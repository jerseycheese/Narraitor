import { NarrativeContext } from '@/types/narrative.types';

interface PlayerChoiceTemplateContext {
  worldName: string;
  worldDescription?: string;
  genre?: string;
  narrativeContext?: NarrativeContext;
  characterIds?: string[];
}

/**
 * Prompt template for generating player choices with lawful/chaotic alignment
 * Generates a decision prompt with 1 lawful, 2 neutral, and 1 chaotic option
 */
export const alignedChoiceTemplate = (context: PlayerChoiceTemplateContext): string => {
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

=== CURRENT NARRATIVE SITUATION ===
LOCATION: ${location || 'Unknown location'}
SITUATION: ${narrativeContext?.currentSituation || 'General scenario'}

FULL CONTEXT:
${shortContext}

=== CRITICAL INSTRUCTIONS ===
You MUST create choices that directly respond to the specific situation described above. Do NOT create generic choices. Reference the specific characters, objects, and events mentioned in the context.

Based on the SPECIFIC narrative situation above, create 4 distinct action choices that follow these alignment categories:

ALIGNMENT DEFINITIONS:
- LAWFUL: Follows rules, respects authority, seeks order, honors agreements, protects others
- NEUTRAL: Balanced approach, practical solutions, adapts to situation, moderate response
- CHAOTIC: WILDLY UNEXPECTED and DISRUPTIVE actions that completely change the situation. These should be dramatic, potentially dangerous, creative solutions that ignore social norms, defy expectations, and could lead to entirely different story outcomes. Think "throw a fireball at the ceiling," "start singing loudly to distract everyone," "pretend to be possessed by a spirit," or "challenge them to a dance-off." The goal is to provide players with options that can dramatically shift the narrative in surprising ways.

REQUIREMENTS:
1. MANDATORY: Reference the SPECIFIC characters, objects, and events from the context (e.g., if there's a dragon, mention the dragon; if there's treasure, mention treasure)
2. Offer meaningfully different paths forward in the story
3. Are concise (under 15 words) and written as direct actions
4. Consider both the immediate situation AND the broader story context
5. Each choice must clearly fit its alignment category
6. DO NOT use generic terms like "guard" when the context specifies "dragon"

Write choices as direct actions without "you" (e.g., "Investigate the noise" not "You investigate the noise").

FORMAT (REQUIRED - include alignment tags):
Decision: What will you do?

Options:
1. [LAWFUL] [First choice - follows rules/authority/order]
2. [NEUTRAL] [Second choice - balanced/practical approach]
3. [NEUTRAL] [Third choice - different practical approach]
4. [CHAOTIC] [Fourth choice - WILDLY UNEXPECTED action that could completely change the situation - be creative and dramatic!]

Keep your response EXACTLY in this format. Only include the Decision and Options sections with alignment tags.`;
};

export default alignedChoiceTemplate;