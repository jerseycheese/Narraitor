/**
 * Builds the character block that personalizes a narrative prompt.
 *
 * Trait inference is left to the LLM at generation time. The raw decision
 * history (including each decision's `choiceType`) already reaches the prompt
 * via `formatDecisions`, so this only has to state who the character is, what
 * they are good at, what they want, and how they tend to play.
 */

import {
  ChoiceTypePreference,
  CharacterGoal,
  PlayerDecision,
} from '@/types/personalization.types';
import { isPlayerDecisionArray, sanitizeString } from '@/lib/utils/typeGuards';
import {
  formatAttributesForNarrative,
  formatSkillsForNarrative,
} from './attributeSkillFormatter';

/** How many goals and play-style hints the prompt names before it gets noisy. */
const MAX_PROMPT_GOALS = 3;
const MAX_PLAY_STYLE_HINTS = 2;

export interface CharacterPromptInput {
  name: string;
  attributes?:
    | Record<string, number>
    | Array<{ attributeId: string; value: number }>;
  skills?:
    | Array<{ name: string; level: number; worldSkillId?: string }>
    | Array<{ skillId: string; level: number }>;
  goals: CharacterGoal[];
  decisions: PlayerDecision[];
}

/**
 * The player's most-used choice types, most frequent first.
 *
 * Returns nothing for a malformed decision list rather than guessing — a bad
 * play-style read is worse for the narrative than none at all.
 */
export function inferPreferredChoiceTypes(
  decisions: PlayerDecision[]
): ChoiceTypePreference[] {
  if (!isPlayerDecisionArray(decisions)) {
    return [];
  }

  const counts = new Map<ChoiceTypePreference, number>();
  for (const decision of decisions) {
    counts.set(decision.choiceType, (counts.get(decision.choiceType) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([choiceType]) => choiceType);
}

/**
 * Assemble the character section for a narrative prompt. Sections with nothing
 * to say are left out entirely rather than emitted empty.
 */
export function buildCharacterPromptSection(
  input: CharacterPromptInput
): string {
  const parts: string[] = [];

  const characterName = sanitizeString(input.name);
  if (characterName) {
    parts.push(`CHARACTER: ${characterName}`);
  }

  if (input.attributes) {
    const attributeString = formatAttributesForNarrative(input.attributes);
    if (attributeString) {
      parts.push(`ATTRIBUTES: ${attributeString}`);
    }
  }

  if (input.skills && input.skills.length > 0) {
    const skillString = formatSkillsForNarrative(input.skills);
    if (skillString) {
      parts.push(`SKILLS: ${skillString}`);
    }
  }

  const activeGoals = input.goals.filter((goal) => goal.isActive);
  if (activeGoals.length > 0) {
    const goalsList = activeGoals
      .slice(0, MAX_PROMPT_GOALS)
      .map((goal) => `• ${goal.description} (${goal.priority})`)
      .join('\n');
    parts.push(`ACTIVE GOALS:\n${goalsList}`);
  }

  const preferredChoiceTypes = inferPreferredChoiceTypes(input.decisions);
  if (preferredChoiceTypes.length > 0) {
    parts.push(
      `PREFERRED PLAY STYLE: ${preferredChoiceTypes.slice(0, MAX_PLAY_STYLE_HINTS).join(', ')}`
    );
  }

  return parts.join('\n\n');
}
