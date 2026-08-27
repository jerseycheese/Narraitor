// src/lib/promptTemplates/templates/endingTemplates.ts

import type { PromptTemplate } from '../types';
import type { EndingType } from '../../../types/narrative.types';
import type { WorldClockPromptContext } from '@/types/worldThread.types';
import { endingOpenThreadsBlock } from './endingOpenThreadsBlock';

const endingTypeDescriptions: Record<EndingType, string> = {
  'player-choice': 'The player has chosen to end their story here',
  'story-complete': 'The main quest or narrative arc has reached its natural conclusion',
  'session-limit': 'The gaming session has reached a good stopping point',
  'character-retirement': 'The character has decided to retire from adventuring'
};

export const endingTemplate: PromptTemplate = {
  id: 'ending',
  content: `You are a master storyteller creating a satisfying ending for an interactive narrative game session.

CONTEXT:
World: {{worldName}} - {{worldDescription}}
Character: {{characterName}}, {{characterClass}} (Level {{characterLevel}})
Character Background: {{characterBackground}}
Character Personality: {{characterPersonality}}
Character Goals: {{characterGoals}}

ENDING TYPE: {{endingType}}
{{endingTypeDescription}}

STORY SUMMARY:
Recent narrative events:
{{recentNarrative}}

Key moments from the journey:
{{journalEntries}}
{{openThreads}}
Additional instructions:
{{customPrompt}}

Generate a complete story ending with the following components:

1. CHOOSE AN APPROPRIATE TONE:
   Analyze the story context and recent events, then choose the most fitting emotional tone:

   - TRIUMPHANT: Use when the character achieved major victories, completed significant quests,
     overcame great challenges, or had clear positive outcomes. The journey ended in success.

   - HOPEFUL: Use when results are mixed, there's potential for future success, or the outcome
     is bittersweet but optimistic. Not complete victory, but progress was made.

   - MYSTERIOUS: Use when enigmatic events color the outcome, even though the character's
     immediate situation still resolves. The plot concludes — what happened is clear — but
     deeper questions about meaning, truth, or consequence linger unanswered. Only the larger
     "why" may stay open; the character's immediate fate must not.

   - TRAGIC: Use when the character DIED, was INCAPACITATED, or suffered catastrophic failure.
     The character's story has ENDED—they cannot continue. Use past tense. Focus on their
     final moments, immediate legacy, and permanent impact. DO NOT suggest future possibilities,
     ongoing journeys, or continued adventures. The character is GONE. The story is OVER.

   IMPORTANT: Don't default to "hopeful" - carefully evaluate the actual story events and choose
   the tone that honestly reflects what happened in the narrative.

2. EPILOGUE (2-3 paragraphs):
   - Describe how the story concludes for {{characterName}}
   - Reference specific events from their journey
   - Match the chosen tone throughout
   - Provide narrative closure while respecting the ending type
   - REQUIRED FOR EVERY TONE: the immediate story arc must resolve by the end of the epilogue —
     this session's central conflict or situation is answered. A cliffhanger that leaves the
     character's present circumstances unresolved is not acceptable for any tone, including
     MYSTERIOUS — ambiguity belongs to meaning or theme, never to what just happened.

   For TRAGIC endings where the character died:
   * Describe their final moments with weight and dignity
   * Focus on what they accomplished BEFORE their end
   * Acknowledge the permanent nature of their loss
   * Avoid any language suggesting they will return or continue
   * Example: "The fall proved fatal. {{characterName}} drew their last breath..."
   * NOT: "As {{characterName}} continues their journey..." ← WRONG for death

3. CHARACTER LEGACY (1 paragraph):
   - How will {{characterName}} be remembered?
   - What impact did they have on others?
   - Keep it concise and meaningful

4. WORLD IMPACT (1 short paragraph):
   - How has {{worldName}} changed because of {{characterName}}'s actions?
   - What lasting effects remain from their journey?
   - Keep it brief and focused

5. ACHIEVEMENTS (3-5 specific accomplishments):
   - List concrete achievements based on the narrative
   - Make them feel earned and specific to this story
   - Avoid generic achievements

FORMAT YOUR RESPONSE AS JSON:
{
  "epilogue": "Your epilogue text here...",
  "characterLegacy": "Your character legacy text here...",
  "worldImpact": "Your world impact text here...",
  "tone": "triumphant",
  "achievements": ["Achievement 1", "Achievement 2", "Achievement 3"]
}

IMPORTANT: The "tone" field must be exactly one of these values: triumphant, mysterious, tragic, hopeful

Remember to:
- Choose the tone that best fits the story's context and events
- Make the ending feel earned and satisfying
- Reference specific story events, not generic fantasy tropes
- Match your chosen tone throughout all sections
- Resolve the immediate story arc fully — closure is required, not optional, regardless of tone
- Keep the language evocative and engaging

DO NOT (especially for tragic/fatal endings):
- Use phrases like "continues their journey", "bright future", "what lies ahead"
- Suggest the character will recover or return
- Frame death as a "temporary setback"
- Use hopeful language about future possibilities when the character is dead
- Leave open the possibility of continuation

For tragic endings, be clear: the story has ended. The character is gone. Honor their sacrifice.`
};

// Helper function to prepare ending template variables
export function prepareEndingTemplateVariables(
  world: { name: string; description?: string },
  character: { name: string; class?: string; level?: number; background?: string; personality?: string; goals?: string },
  endingType: EndingType,
  recentNarrative: string[],
  journalEntries?: string[],
  customPrompt?: string,
  desiredTone?: 'triumphant' | 'mysterious' | 'tragic' | 'hopeful',
  worldClock?: WorldClockPromptContext
): Record<string, string | number> {
  let finalCustomPrompt = customPrompt || 'No additional instructions.';

  // CRITICAL: Inject explicit fatal context for tragic endings
  if (desiredTone === 'tragic') {
    const fatalContext = `

⚠️ CRITICAL INSTRUCTION - FATAL OUTCOME ⚠️
This is a FATAL ending. The character has DIED or is INCAPACITATED.
- The character CANNOT continue their journey - they are GONE
- Use ONLY past tense ("was", "had been", "drew their last breath")
- Focus on their FINAL moments and immediate death
- DO NOT use future tense or suggest continuation ("will be", "continues", "journey ahead")
- DO NOT frame this as hopeful - the character is DEAD
- Tone must be TRAGIC, acknowledging permanent loss

The story is OVER. Honor the character's death with dignity and finality.`;

    finalCustomPrompt = finalCustomPrompt === 'No additional instructions.'
      ? fatalContext
      : `${finalCustomPrompt}\n${fatalContext}`;
  }

  return {
    worldName: world.name,
    worldDescription: world.description || 'A mysterious realm',
    characterName: character.name,
    characterClass: character.class || 'Adventurer',
    characterLevel: character.level || 1,
    characterBackground: character.background || 'A mysterious traveler',
    characterPersonality: character.personality || 'Determined and brave',
    characterGoals: character.goals || 'Seek adventure and glory',
    endingType,
    endingTypeDescription: endingTypeDescriptions[endingType],
    recentNarrative: recentNarrative.join('\n'),
    journalEntries: journalEntries?.length ? journalEntries.join('\n') : 'No significant events recorded in journal.',
    openThreads: endingOpenThreadsBlock(worldClock),
    customPrompt: finalCustomPrompt
  };
}
