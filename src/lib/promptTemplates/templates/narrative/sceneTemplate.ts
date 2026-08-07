import { getExamplesForPrompt, shouldIncludeExamples } from '../../examples';
import { majorEventGuidelines } from './majorEventGuidelines';
import { describeNarrativeLength } from './narrativeLength';
import type { NarrativeTemplateContext } from './context';

/**
 * Number of consecutive uneventful segments before the prompt starts pushing
 * the model to break the calm. Below this, a quiet stretch just reads as
 * normal pacing; at or above it, cautious play stops being a free pass.
 */
const STALE_PACING_THRESHOLD = 3;

export const sceneTemplate = (context: NarrativeTemplateContext) => {
  const {
    worldName,
    genre,
    tone,
    narrativeContext,
    generationParameters,
    playerCharacterName,
    characterSkillContext,
    enhancedCharacterContext,
    npcRoster = []
  } = context;

  const segmentType = generationParameters?.segmentType || 'scene';
  const lengthDescription = describeNarrativeLength(generationParameters);
  const recentSegments = narrativeContext?.recentSegments || [];
  const recentContent = recentSegments.map((seg, i: number) =>
    `[Scene ${recentSegments.length - i}]: ${seg.content}`
  ).join('\n\n');
  const currentTags = narrativeContext?.currentTags || [];
  const hasCriticalFailure = currentTags.some((tag: string) =>
    tag.startsWith('skill-critical-failure:')
  );
  const hasFailure = currentTags.some((tag: string) =>
    tag.startsWith('skill-failure:')
  );
  const hasSuccess = currentTags.some((tag: string) =>
    tag.startsWith('skill-success:')
  );
  const skillResult = hasCriticalFailure
    ? 'critical-failure'
    : hasFailure
      ? 'failure'
      : hasSuccess
        ? 'success'
        : null;
  const turnsSinceComplication = narrativeContext?.turnsSinceComplication ?? 0;
  const isStale = turnsSinceComplication >= STALE_PACING_THRESHOLD;

  const formattedRoster = Array.isArray(npcRoster) && npcRoster.length > 0
    ? `
NPC ROSTER (Reference IDs for metadata.characterIds):
${npcRoster.map((npc: { id: string; name: string; description?: string }) => `- ${npc.name} [${npc.id}]${npc.description ? ` — ${npc.description}` : ''}`).join('\n')}
`
    : '';

  const baseContent = `Continue the ${genre} narrative for "${worldName}" with a new ${segmentType} segment.

World: ${worldName}
Tone: ${tone}${characterSkillContext ? characterSkillContext : ''}${enhancedCharacterContext ? enhancedCharacterContext : ''}

STORY SO FAR:
${recentContent}

${narrativeContext?.currentSituation ? `PLAYER ACTION: ${narrativeContext.currentSituation}` : ''}

${skillResult ? `
SKILL CHECK RESULT GUIDANCE:
${skillResult === 'success' ? '- The player SUCCEEDED at their action - show the positive outcome naturally' : ''}
${skillResult === 'failure' || skillResult === 'critical-failure' ? '- The player FAILED at their action - show realistic consequences and setbacks' : ''}
${skillResult === 'critical-failure' ? '- CRITICAL FAILURE: consequences may be severe, irreversible, or lethal if the stakes justify it' : ''}
- DO NOT explicitly mention skill names, skill levels, or game mechanics
- Show the outcome through what actually happens in the story
- Success = things work out, failure = things go wrong or backfire
` : ''}

${isStale ? `
PACING GUIDANCE — RISING TENSION:
- It has been ${turnsSinceComplication} turns in a row with no real complication for the player.
- This segment MUST introduce a complication: an interruption, a new threat, an unexpected cost, or a setback tied to the current situation.
- The complication does not need a skill check behind it — it can simply happen (an NPC arrives, a resource runs out, the trail leads somewhere worse than expected, time runs short).
- Do not extend the current chain with another same-shape discovery (another clue, another trace) with nothing else changing.
- Whatever complication you introduce here counts as a major event: record it in metadata.majorEvent (see the rules below) so this guidance doesn't fire again next turn for a problem you already resolved.
` : ''}

${generationParameters?.decisionWeight === 'critical' && narrativeContext?.currentTags?.some((tag: string) => tag.startsWith('skill-failure:') || tag.startsWith('skill-critical-failure:')) ? `
FATAL/INCAPACITATING OUTCOME:
- This was a pivotal, life-or-death decision and it FAILED${narrativeContext?.currentTags?.some((tag: string) => tag.startsWith('skill-critical-failure:')) ? ' critically' : ''}.
- The player character should be dead, unconscious, or otherwise unable to continue.
- Describe the fatal consequence explicitly and dramatically - this is game over.
- Keep it grounded in established world rules (no sudden miracles or lucky escapes).
- The narrative tone should be tragic and final.
` : generationParameters?.decisionWeight === 'critical' ? `
PIVOTAL DECISION (LIFE OR DEATH):
- This is a critical decision with extreme stakes.
- Success should feel earned and impactful.
- Failure will end the game, so make successes meaningful.
` : ''}

CRITICAL CONTINUITY RULES:
- The player is EXACTLY where the last scene ended
- Time has NOT reset or jumped backward
- Pick up IMMEDIATELY from where the story left off
- The player's action happens RIGHT NOW in the current moment

${formattedRoster}

NPC METADATA RULES:
- Use NPC names in the prose, but capture their IDs (from the roster above) in metadata.characterIds ONLY for characters who appear or speak in this segment.
- Do NOT include characters who are merely mentioned, remembered, or located elsewhere—only on-screen participants belong in metadata.characterIds.
- If you foreshadow or reference an off-screen NPC, you may add them to metadata.characters for future use, but keep them out of metadata.characterIds.
- If a single NPC is the primary speaker addressing the player, set metadata.speakerId to that NPC's ID. Otherwise omit speakerId.
- If no NPCs appear, set metadata.characterIds to [].
- Never invent new IDs—only use the ones provided in the roster or already established in prior metadata.
- When you introduce a new NPC, add them to metadata.characters with a slug-style id (lowercase-hyphenated) and reuse that same id in later segments.
- Prefer selecting supporting characters from this roster when the story needs additional voices; only invent new NPCs if absolutely necessary for the scene.
- Do not insert character IDs or bracket tokens (e.g., [npc-id]) in the narrative text—only expose the natural name.

Generate a ${segmentType} that:
1. Shows the IMMEDIATE RESULT of the player's action
2. Maintains perfect continuity with the previous scene
3. Does NOT repeat or revisit events that already happened
4. Advances the story forward in time (never backward)
5. Maintains the ${tone} tone
6. Is approximately ${lengthDescription} in length

${(worldName && (worldName.toLowerCase().includes('1990') || worldName.toLowerCase().includes('1980') || worldName.toLowerCase().includes('1970'))) || (genre && (genre.toLowerCase().includes('modern') || genre.toLowerCase().includes('contemporary') || genre.toLowerCase().includes('realistic'))) ? `

CRITICAL REALISM CONSTRAINTS:
- This is a completely realistic, mundane setting with NO supernatural elements
- NO magical, mystical, fantasy, psychic, or otherworldly phenomena whatsoever
- NO special powers, reality-shifting, destiny, or metaphysical concepts
- Focus on real human drama, realistic challenges, and authentic period details
- Use only technology, situations, and social dynamics that actually existed in the time period
- Any tension should come from realistic human conflict, not supernatural forces
- All sounds and effects must have normal, realistic explanations
` : ''}

CRITICAL INSTRUCTIONS:
1. Write in SECOND PERSON perspective (using "you")
2. The player IS ${playerCharacterName || 'the main character'} - NEVER use their name in narration
3. Only use "${playerCharacterName}" when OTHER characters speak TO or ABOUT the player
4. The player experiences everything through ${playerCharacterName || 'their character'}'s perspective

Focus on varied sensory details and the character's reactions to bring the scene to life.
- Use visual, auditory, and tactile descriptions primarily
- Avoid repetitive olfactory descriptions (smells/scents/odors) unless essential to the scene
- Vary your sensory language to avoid overused phrases`;

  // Get examples for perspective and formatting if token budget allows
  const tokenBudget = generationParameters?.exampleTokenBudget ?? 120;
  const contextLength = recentContent.length;
  let examplesSection = '';
  if (shouldIncludeExamples(tokenBudget, contextLength)) {
    examplesSection = getExamplesForPrompt('scene', tokenBudget, {
      tags: ['perspective', 'second-person', 'sensory'],
      minPriority: 'high',
    });
  }

  return `${baseContent}${examplesSection}

${majorEventGuidelines}

SEGMENT TYPE SELECTION:
Choose the most appropriate segment type based on your narrative content:
- "dialogue": Use when the narrative is primarily conversation between characters (with quotation marks)
- "action": Use when describing physical action, combat, or skill usage
- "transition": Use when describing time passage or location changes
- "scene": Use for descriptive narrative, setting details, or mixed content

Response Format:
{
  "content": "The scene description goes here...",
  "type": "dialogue" | "action" | "transition" | "scene",
  "metadata": {
    "characterIds": ["npc-id-1", "npc-id-2"],
    "speakerId": "npc-id-1",
    "characters": [
      {
        "id": "npc-id-1",
        "name": "NPC Name",
        "description": "Short vivid description",
        "role": "Harbormaster",
        "avatarPrompt": "Describe appearance for portrait consistency"
      }
    ],
    "mood": "appropriate mood",
    "location": "Current location",
    "tags": ["relevant", "scene", "tags"],
    "itemsLost": [],
    "majorEvent": "Review the content field above. If it contains a transformation/world change/turning point, extract and summarize THAT SPECIFIC MOMENT in one short clause (max 18 words). Otherwise null. Must describe what ACTUALLY HAPPENED in your narrative."
  }
}`;
};
