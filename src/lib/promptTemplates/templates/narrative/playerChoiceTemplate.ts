import { NarrativeContext } from '@/types/narrative.types';
import { CHOICE_EXAMPLES, shouldIncludeExamples } from '../../examples';
import { protagonistGuidance } from './protagonistGuidance';

interface PlayerChoiceTemplateContext {
  worldName: string;
  worldDescription?: string;
  genre?: string;
  narrativeContext?: NarrativeContext;
  characterIds?: string[];
  optionCount?: number;
  worldSkills?: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  worldNpcs?: Array<{
    id: string;
    name: string;
  }>;
  playerCharacterName?: string;
}

/**
 * Prompt template for generating player choices
 * Generates a decision prompt and options based on the current narrative context
 */
export const playerChoiceTemplate = (context: PlayerChoiceTemplateContext): string => {
  const { worldName, genre, narrativeContext, worldSkills, worldNpcs, optionCount, playerCharacterName } = context;
  const choiceCount =
    typeof optionCount === 'number' && Number.isFinite(optionCount)
      ? Math.max(1, Math.floor(optionCount))
      : 3;
  
  // Extract recent narrative content to provide context
  const recentContent = narrativeContext?.recentSegments
    ?.slice(-1) // Use only the latest segment to reduce context size
    .map(segment => segment.content)
    .join('\n\n') || '';
  
  // Extract current location for context
  const location = narrativeContext?.currentLocation || '';
  
  // Include more of the narrative for context
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
  
  // Build skills information for the prompt
  let skillsInfo = '';
  if (worldSkills && worldSkills.length > 0) {
    skillsInfo = `
AVAILABLE SKILLS IN THIS WORLD:
${worldSkills.map(skill => `- ${skill.name}: ${skill.description}`).join('\n')}`;
  }

  const protagonistInfo = protagonistGuidance(playerCharacterName);

  // Build the known-character roster + consequence instructions. Only emitted
  // when the world has NPCs, so the parser has names to resolve against.
  const hasNpcs = !!worldNpcs && worldNpcs.length > 0;
  const npcInfo = hasNpcs
    ? `

KNOWN CHARACTERS (use these exact names):
${worldNpcs.map(npc => `- ${npc.name}`).join('\n')}`
    : '';
  const consequencesInstructions = hasNpcs
    ? `

CONSEQUENCES (REQUIRED WHEN A KNOWN CHARACTER IS AFFECTED):
- When an option would plausibly change how a known character feels about the player, add a Consequences line for that option.
- Format EXACTLY: Consequences: CharacterName trust +N  (or -N), comma-separated for multiple characters.
- Use ONLY names from the KNOWN CHARACTERS list. Omit the line entirely when no known character is affected.
- Scale N to the Decision Weight: MINOR 2-5, MAJOR 5-12, CRITICAL 10-20.`
    : '';
  const consequencesFormatLine = hasNpcs
    ? `
   Consequences: [Optional - CharacterName trust +/-N]`
    : '';

  const baseContent = `You are creating meaningful player choices for an interactive narrative game set in the world of "${worldName}".
${genre ? `Genre: ${genre}` : ''}

CURRENT CONTEXT (brief summary):
${shortContext}
${location ? `Current location: ${location}` : ''}${skillsInfo}${protagonistInfo}${npcInfo}

INSTRUCTIONS:
Based on the ENTIRE narrative context (both beginning and end if provided), create ${choiceCount} distinct action choices that:
1. Reference specific elements from the current scene (characters, objects, events, locations)
2. Offer meaningfully different paths forward in the story
3. Are concise (under 15 words) and written as direct actions
4. Consider both the immediate situation AND the broader story context
5. Include variety in character alignment approaches when possible

NEGATIVE CONSTRAINTS (CRITICAL):
- ENSURE each option represents a distinct physical or social action (e.g., Talk vs. Attack vs. Investigate). Do not just rephrase the same action with different attitudes.
- If offering an "Inspect" option, do not offer another "Look" or "Examine" option unless it targets a completely different object.
- AVOID generating synonyms. "Check the door" and "Try the handle" are the same action. Pick one.
- DIVERSIFY the verbs used (e.g., don't start 3 choices with "Ask").

ALIGNMENT VARIETY (when appropriate):
- LAWFUL: Follows rules, respects authority, seeks order, honors agreements, protects others
- NEUTRAL: Balanced approach, practical solutions, adapts to situation, moderate response  
- CHAOTIC: Unexpected, disruptive actions that change the situation dramatically. Vary the KIND of chaos and do not default to making noise (yelling, shouting, singing) - draw from physical risk, trickery/deception, sabotage/destruction, turning the tables, or abandoning the obvious goal

PERSONALITY-INFORMED CHOICES (when character personality context is provided):
- Create options that offer ways to express the character's traits
- Reference active goals when choices can advance or challenge them
- Consider fears when appropriate (avoidance or confrontation options)
- Balance personality-consistent choices with growth opportunities
- Don't force all choices to align with personality - variety matters

Write choices as direct actions without "you" (e.g., "Investigate the noise" not "You investigate the noise").

SKILL REQUIREMENTS (CRITICAL):
Name the skill an option would actually test whenever one of the "AVAILABLE SKILLS" fits the action. You are the only step that can tell what a choice leans on: an option you leave untagged is played with no check at all.
- ONLY use the exact skill names from the "AVAILABLE SKILLS" list provided above.
- NEVER invent new skills or use generic skills (like "Stealth", "Persuasion", "Athletics", etc.) unless they are explicitly listed in the "AVAILABLE SKILLS" for this world.
- If NO "AVAILABLE SKILLS" are listed for this world, do NOT include any "Requirements:" lines in your options.
- If nothing in the list is what the action tests, leave the requirement off rather than reaching for the nearest name. A wrong skill is worse than no skill.
- **IMPORTANT: Create a MIX of difficulty levels** - don't assume the character can handle everything:
  * Easy tasks: 3-4 skill level (most characters can do this)
  * Moderate tasks: 5-6 skill level (challenging but achievable)
  * Hard tasks: 7-8 skill level (requires specialization)
  * Very hard tasks: 9+ skill level (expert-level, likely to fail)
- **Generate some challenging options that push beyond average skill levels** - failure creates interesting story moments
- Include at least one high-difficulty choice when appropriate to the situation
- VARY skill requirements across choices - use different character abilities when possible
- Balance: Include both skill-required and non-skill choices for player agency
- Custom actions by players should trigger implicit skill checks when appropriate
- Format skill requirements as: Requirements: SkillName X+

CHOICE HINTS:
Add helpful hint text when choices benefit from explanation:
- Explain potential consequences or approaches
- Clarify what the choice involves
- Provide context for skill-based choices

DECISION WEIGHT ANALYSIS:
Carefully evaluate the narrative situation and determine the significance of this decision:
- MINOR: Routine choices with limited consequences (casual conversations, basic exploration, everyday interactions)
- MAJOR: Important choices that significantly impact the story direction (meeting key characters, choosing major paths, using powerful abilities, entering dangerous areas, making moral choices)
- CRITICAL: Life-changing decisions with major consequences (combat with deadly enemies, final confrontations, destiny-altering choices, choosing between life and death)

Consider the stakes, potential consequences, and story impact. MOST decisions are MINOR or MAJOR: MINOR for everyday beats, MAJOR for the interesting story moments. Reserve CRITICAL for the RARE, genuinely life-or-death turning points - deadly combat, final confrontations, or choices where failure would plausibly end the character's story. When unsure between MAJOR and CRITICAL, choose MAJOR.

FORMAT:
Decision Weight: [MINOR/MAJOR/CRITICAL]
Decision: What will you do?
Context Summary: [Brief 1-2 sentence summary of the current situation that led to this decision]

Options:
${Array.from({ length: choiceCount }, (_, i) => `${i + 1}. [ALIGNMENT] [Action choice]
   Hint: [Optional explanation]
   Requirements: [Optional - SkillName X+]${consequencesFormatLine}`).join('\n\n')}${consequencesInstructions}

ALIGNMENT INSTRUCTIONS: 
- Always include alignment tags [LAWFUL], [NEUTRAL], or [CHAOTIC] at the start of each choice
- LAWFUL choices follow rules, respect authority, protect others
- NEUTRAL choices are practical, balanced approaches
- CHAOTIC choices are unexpected, dramatic, or disruptive
- Mix alignments to provide variety - not every choice needs to be neutral!
- DO NOT include any emojis in your response - the frontend will add them automatically

LETHAL STAKES (ONLY WHEN Decision Weight IS CRITICAL):
- If the current situation justifies it, one or more options may carry lethal or incapacitating consequences on failure.
- Make the stakes explicit in the option text or hint (e.g., “risk bleeding out if this fails”).
- Keep consequences grounded in the world’s rules; no miraculous escapes if tone/genre wouldn’t allow it.

CONTEXT SUMMARY INSTRUCTIONS:
- Provide a brief 1-2 sentence summary that captures the current narrative moment
- Focus on what just happened that led to this decision point
- Reference specific story elements, locations, or character actions

IMPORTANT FORMATTING RULES:
- Each option starts with a number and period
- Hint and Requirements lines are optional but should be indented
- Use exact format "Requirements: SkillName X+" for skill checks
- Keep hints concise (under 20 words)

Keep your response EXACTLY in this format. Include the Decision Weight line, Context Summary, then Decision and Options sections with optional Hint and Requirements for each choice.

IMPORTANT: Never include emojis anywhere in your response. Use only plain text - the user interface will add visual elements automatically.`;

  const examplesSection = shouldIncludeExamples(shortContext.length)
    ? CHOICE_EXAMPLES
    : '';

  return `${baseContent}${examplesSection}`;
};

