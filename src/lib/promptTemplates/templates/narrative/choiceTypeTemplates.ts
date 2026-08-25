import { NarrativeContext } from '@/types/narrative.types';
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
  /**
   * Decisions already made this session, uncapped - see getTurnIndex in
   * choiceGenerator.prompt.ts. NOT narrativeContext.previousSegments.length:
   * every production caller populates previousSegments from a 5-segment
   * slice, so that count freezes once a session passes turn 5.
   */
  turnIndex?: number;
}

/** Definition text for each alignment tag, kept separate from the glossary's listing order (see ALIGNMENT_GLOSSARY_ORDERS) so the order can rotate without touching the wording. */
const ALIGNMENT_DEFINITIONS: Record<'NEUTRAL' | 'CHAOTIC' | 'LAWFUL', string> = {
  NEUTRAL: 'Balanced approach, practical solutions, adapts to situation, moderate response',
  CHAOTIC:
    'WILDLY UNEXPECTED and DISRUPTIVE actions that completely change the situation. Dramatic, potentially dangerous, creative solutions that ignore social norms, defy expectations, and could lead to entirely different story outcomes. VARY THE KIND of chaos and do NOT default to making noise (yelling, shouting, singing). Draw from a wide range, fitted to the scene: sudden physical risk ("leap from the balcony onto the chandelier," "kick over the lantern to set the drapes alight"), trickery or deception ("impersonate the captain and bark orders," "bluff an outrageous lie with total confidence"), sabotage or destruction ("cut the rope bridge behind you," "smash the control panel," "throw open the cells and free the prisoners"), turning the tables ("start a brawl to scatter the room," "switch sides mid-negotiation"), or abandoning the obvious goal for something no one expects. The goal is options that dramatically shift the narrative in surprising ways.',
  LAWFUL: 'Follows rules, respects authority, seeks order, honors agreements, protects others',
};

/**
 * The glossary orders in rotation. Excludes LAWFUL/NEUTRAL/CHAOTIC (the
 * canonical running order removed from the numbered slots) and any
 * order ending in CHAOTIC (the slot-3 tell round 5 found still holding at
 * 83% even with the order shuffled) - the two shapes the alignment-spread
 * tests forbid.
 */
const ALIGNMENT_GLOSSARY_ORDERS: Array<Array<'NEUTRAL' | 'CHAOTIC' | 'LAWFUL'>> = [
  ['NEUTRAL', 'CHAOTIC', 'LAWFUL'],
  ['CHAOTIC', 'LAWFUL', 'NEUTRAL'],
  ['CHAOTIC', 'NEUTRAL', 'LAWFUL'],
  ['LAWFUL', 'CHAOTIC', 'NEUTRAL'],
];

/**
 * Prompt template for generating alignment-tagged player choices.
 *
 * The mix of alignments is chosen per scene rather than mandated. Removing the
 * quota was not enough on its own: the model kept returning lawful, neutral,
 * chaotic in that order because the prompt itself taught the pattern. Moving
 * the mix decision earlier and taking the glossary out of slot order wasn't
 * enough either - a FIXED reordering is still a pattern - round 5 measured 70% one
 * dominant order and 83-87% slot-predicts-tag against a single static
 * glossary. So the glossary's own listing order now rotates per turn (see
 * ALIGNMENT_GLOSSARY_ORDERS below) instead of landing on one order and
 * staying there for the rest of the session.
 */
export const alignedChoiceTemplate = (context: PlayerChoiceTemplateContext): string => {
  const { worldName, genre, narrativeContext, worldSkills, worldNpcs, optionCount, playerCharacterName, turnIndex } = context;
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

  let skillsInfo = '';
  if (worldSkills && worldSkills.length > 0) {
    skillsInfo = `
AVAILABLE SKILLS IN THIS WORLD:
${worldSkills.map(skill => `- ${skill.name}: ${skill.description}`).join('\n')}`;
  }

  const protagonistInfo = protagonistGuidance(playerCharacterName);

  // Round 5 measured slot-predicts-tag at 87%/70%/83% even after the
  // glossary stopped running in slot order: a FIXED glossary order is still a
  // pattern to learn against, just one call removed from the numbered slots.
  // Rotate which of the four permitted orders (no LAWFUL-NEUTRAL-CHAOTIC, none
  // ending in CHAOTIC - the two orders the alignment-spread tests forbid) is
  // shown, keyed off turnIndex so it's deterministic and testable rather than
  // reaching for Math.random in a prompt builder.
  const glossaryOrder = ALIGNMENT_GLOSSARY_ORDERS[(turnIndex ?? 0) % ALIGNMENT_GLOSSARY_ORDERS.length];
  const glossaryText = glossaryOrder
    .map((tag) => `- ${tag}: ${ALIGNMENT_DEFINITIONS[tag]}`)
    .join('\n');

  // Known-character roster + consequence contract; only emitted when the
  // world has NPCs so the parser has names to resolve against.
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

  return `You are creating meaningful player choices for an interactive narrative game set in the world of "${worldName}".
${genre ? `Genre: ${genre}` : ''}

=== CURRENT NARRATIVE SITUATION ===
LOCATION: ${location || 'Unknown location'}
SITUATION: ${narrativeContext?.currentSituation || 'General scenario'}

FULL CONTEXT:
${shortContext}${skillsInfo}${protagonistInfo}${npcInfo}

=== CRITICAL INSTRUCTIONS ===
You MUST create choices that directly respond to the specific situation described above. Do NOT create generic choices. Reference the specific characters, objects, and events mentioned in the context.

Based on the SPECIFIC narrative situation above, create ${choiceCount} distinct action choices, each tagged with the alignment it expresses:

ALIGNMENT DEFINITIONS (a glossary, not a running order - see CHOOSING THE MIX below):
${glossaryText}

CHOOSING THE MIX (IMPORTANT):
- Always tag every choice [LAWFUL], [NEUTRAL], or [CHAOTIC].
- Decide the mix from this scene BEFORE writing a single option, and report it on the Alignment Mix line. Pick what the scene actually supports. There is no quota: a tense standoff might offer two chaotic openings, a quiet interrogation none at all.
- Two options may share a tag, and so may all of them. A mix of one tag per option is one possibility among many, not the default.
- The order the tags are listed above is not a running order, and neither is any order you used last turn. Do NOT assign tags to slots by position out of habit, and do NOT repeat the same mix turn after turn. A player who can predict which slot holds the reckless option has stopped reading the choices.
- Never park the most disruptive option in the last slot by default. When a chaotic option belongs in a scene it can just as easily be the first thing offered.
- Only offer a chaotic option when a genuinely disruptive action fits the moment.
- A chaotic option must be something a bold player would actually consider, with a real payoff if it works. An obvious mistake, a pointless stunt, or self-sabotage nobody would pick is wasted space: drop the chaotic tag and offer a different mix instead.

PERSONALITY-INFORMED CHOICES (when character personality context is provided):
- Create options that offer ways to express the character's traits
- Reference active goals when choices can advance or challenge them
- Consider fears when appropriate (avoidance or confrontation options)
- Balance personality-consistent choices with growth opportunities
- Personality context guides HOW an alignment is expressed, not which alignments appear

REQUIREMENTS:
1. MANDATORY: Reference the SPECIFIC characters, objects, and events from the context (e.g., if there's a dragon, mention the dragon; if there's treasure, mention treasure)
2. Offer meaningfully different paths forward in the story
3. Are concise (under 15 words) and written as direct actions
4. Consider both the immediate situation AND the broader story context
5. Each choice must clearly express the tag it carries - two choices sharing a tag should express it in visibly different ways
6. DO NOT use generic terms like "guard" when the context specifies "dragon"

Write choices as direct actions without "you" (e.g., "Investigate the noise" not "You investigate the noise").

SKILL REQUIREMENTS (CRITICAL):
Name the skill an option would actually test whenever one of the "AVAILABLE SKILLS" fits the action. You are the only step that can tell what a choice leans on: an option you leave untagged is played with no check at all.
- ONLY use the exact skill names from the "AVAILABLE SKILLS" list provided above.
- NEVER invent new skills or use generic skills (like "Stealth", "Persuasion", "Athletics", etc.) unless they are explicitly listed in the "AVAILABLE SKILLS" for this world.
- If NO "AVAILABLE SKILLS" are listed for this world, do NOT include any "Requirements:" lines in your options.
- If nothing in the list is what the action tests, leave the requirement off rather than reaching for the nearest name. A wrong skill is worse than no skill.
- Vary skill requirements across choices - use different character abilities when possible
- Format skill requirements as: Requirements: SkillName X+

DECISION WEIGHT ANALYSIS:
Carefully evaluate the narrative situation and determine the significance of this decision:
- MINOR: Routine choices with limited consequences (casual conversations, basic exploration, everyday interactions)
- MAJOR: Important choices that significantly impact the story direction (meeting key characters, choosing major paths, using powerful abilities, entering dangerous areas, making moral choices)
- CRITICAL: Life-changing decisions with major consequences (combat with deadly enemies, final confrontations, destiny-altering choices, choosing between life and death)

Consider the stakes, potential consequences, and story impact. MOST decisions are MINOR or MAJOR: MINOR for everyday beats, MAJOR for the interesting story moments. Reserve CRITICAL for the RARE, genuinely life-or-death turning points - deadly combat, final confrontations, or choices where failure would plausibly end the character's story. When unsure between MAJOR and CRITICAL, choose MAJOR.

FORMAT (REQUIRED - include the alignment mix, alignment tags, decision weight, and context summary):
Alignment Mix: [the tag for each option in the order you will write them, then a short clause naming what in THIS scene makes that mix right. Examples: "CHAOTIC, LAWFUL, CHAOTIC - the room is already burning, so restraint is the odd choice here" or "NEUTRAL, NEUTRAL, LAWFUL - a quiet archive with nothing to disrupt"]
Decision Weight: [MINOR/MAJOR/CRITICAL]
Context Summary: [Write a brief 1-sentence summary that captures WHY this decision matters - focus on the stakes, immediate tension, or key relationships at play. Do NOT retell the story. Examples: "Tension builds as you must choose how to respond to the merchant's accusation." "A critical moment where your response could determine if the alliance forms." "The stranger's offer seems too good to be true."]
Decision: What will you do?

Options:
${Array.from({ length: choiceCount }, (_, i) => `${i + 1}. [ALIGNMENT] [Action choice]
   Requirements: [Optional - SkillName X+]${consequencesFormatLine}`).join('\n')}${consequencesInstructions}

Keep your response EXACTLY in this format. Include the Alignment Mix line, Decision Weight line, Context Summary line, then Decision and Options sections with alignment tags.`;
};

