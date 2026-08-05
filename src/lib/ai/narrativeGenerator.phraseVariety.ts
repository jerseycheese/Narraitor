/**
 * Repeated-phrasing guardrail for narrative generation (#1681).
 *
 * Long sessions drift toward the same handful of nouns and adjectives
 * ("cold metal", "dense woods") because each turn's prompt only shows the
 * model the recent story, never flags which words it has already leaned on.
 * This pulls distinctive words that reappear across the last few segments
 * and tells the model to find another way to say them — a short, concrete
 * list rather than a vague "vary your word choice" instruction, which tends
 * to get ignored once the context fills up.
 */

import type { NarrativeSegment } from '@/types/narrative.types';
import type { RequestBudget } from '@/lib/promptContext/tokenBudgetManager';
import { applyBudget } from './narrativeGenerator.budget';

/** How many of the most-repeated words to surface — enough to be useful, small enough to stay cheap. */
const MAX_FLAGGED_WORDS = 8;

/** A word must reappear at least this many times across recent segments to count as "reused". */
const MIN_REPEAT_COUNT = 2;

/** Below this length, common short words (verbs, prepositions) swamp the signal. */
const MIN_WORD_LENGTH = 4;

/**
 * Common words long enough to clear MIN_WORD_LENGTH but not distinctive —
 * excluded so the flagged list stays focused on the setting/sensory words
 * that actually make repetition noticeable (nouns, adjectives), not glue
 * words that legitimately recur in every scene.
 */
const COMMON_WORDS = new Set([
  'that', 'this', 'with', 'from', 'have', 'were', 'they', 'them', 'then',
  'than', 'into', 'onto', 'upon', 'when', 'what', 'where', 'which', 'while',
  'before', 'after', 'around', 'still', 'just', 'like', 'here', 'there',
  'toward', 'towards', 'through', 'against', 'began', 'begin', 'could',
  'would', 'should', 'might', 'about', 'again', 'back', 'down', 'over',
  'under', 'each', 'even', 'much', 'more', 'most', 'some', 'every', 'other',
  'same', 'such', 'only', 'very', 'also', 'your', 'yours', 'their', 'these',
  'those', 'been', 'being', 'does', 'doing', 'know', 'knew', 'feel', 'felt',
  'seem', 'seems', 'seemed', 'look', 'looks', 'looked', 'make', 'makes',
  'made', 'take', 'takes', 'took',
]);

const tokenize = (content: string): string[] =>
  (content.match(/[a-zA-Z']+/g) || []).map((word) => word.toLowerCase());

/**
 * Pure extraction: counts word frequency across the given segments and
 * returns the words that reappear (not just the ones that occur once),
 * sorted by frequency then alphabetically for a deterministic list.
 */
export const extractRepeatedPhrases = (
  segments: NarrativeSegment[] | undefined
): string[] => {
  if (!segments || segments.length === 0) {
    return [];
  }

  const counts = new Map<string, number>();
  for (const seg of segments) {
    if (!seg?.content) continue;
    for (const word of tokenize(seg.content)) {
      if (word.length < MIN_WORD_LENGTH || COMMON_WORDS.has(word)) continue;
      counts.set(word, (counts.get(word) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count >= MIN_REPEAT_COUNT)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_FLAGGED_WORDS)
    .map(([word]) => word);
};

/**
 * Prevention layer: appends a short "already used, find another angle" list
 * to the prompt when recent segments show word reuse. No-ops (returns the
 * prompt unchanged) when there's nothing to flag, so it never pads the
 * prompt on a fresh session or a session with genuinely varied prose.
 */
export const enhancePromptWithPhraseVariety = (
  prompt: string,
  recentSegments: NarrativeSegment[] | undefined,
  budget?: RequestBudget
): string => {
  const repeated = extractRepeatedPhrases(recentSegments);
  if (repeated.length === 0) {
    return prompt;
  }

  const guidance = `\n\nRECENTLY OVERUSED WORDS (used more than once in the last few segments — find a different way to describe these instead of repeating them):\n${repeated.join(', ')}`;

  return prompt + applyBudget(guidance, 'phrase-variety', budget);
};
