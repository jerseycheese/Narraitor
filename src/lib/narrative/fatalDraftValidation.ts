// src/lib/narrative/fatalDraftValidation.ts

import type { NarrativeGenerationResult } from '@/types/narrative.types';
import { escapeRegExp } from '@/lib/utils/formatters';

const SECOND_PERSON_DEATH_PATTERNS = [
  /\b(?:you|thou)\s+(?:die|dies|died|perish|perishes|perished|bleed(?:s|ing)? out to death|succumb|succumbs|succumbed to (?:death|the wounds?))\b/i,
  /\b(?:you are|you're|thou art)\s+(?:dead|killed|slain|lifeless|deceased|fatally (?:wounded|struck|pierced|poisoned))\b/i,
  /\b(?:draws?|drew|breathes?|breathed)\s+(?:your)\s+last\s+breath\b/i,
  /\b(?:death|fatality)\s+(?:claims?|takes?|took)\s+(?:you)\b/i,
  /\b(?:killed|slain)\s+you\b/i,
  /\bthis is game over\b/i,
  /\b(?:fell|fall|drops?|dropped)\s+lifeless\b/i,
  /\b(?:fall|falls|fell|collapse|collapses|collapsed)\s+dead\b/i,
  /\bcollapse(?:s|d)? and die\b/i,
];

/**
 * Validates whether a narrative generation draft describes character death,
 * carries fatal metadata, or terminates the session.
 */
export function isLethalNarrativeDraft(
  draft: NarrativeGenerationResult,
  playerCharacterName?: string
): boolean {
  if (draft.metadata?.tags?.includes('fatal-outcome')) {
    return true;
  }
  if ((draft as { segmentType?: string }).segmentType === 'ending') {
    return true;
  }
  if (
    (draft.metadata as { endingId?: string; endingData?: unknown } | undefined)?.endingId != null ||
    (draft.metadata as { endingId?: string; endingData?: unknown } | undefined)?.endingData != null
  ) {
    return true;
  }

  const content = draft.content ?? '';
  if (!content.trim()) return false;

  for (const pattern of SECOND_PERSON_DEATH_PATTERNS) {
    if (pattern.test(content)) return true;
  }

  if (playerCharacterName && playerCharacterName.trim().length > 0) {
    const escaped = escapeRegExp(playerCharacterName.trim());
    const namePatterns = [
      new RegExp(`\\b${escaped}\\s+(?:dies|died|perishes|perished|succumbs to (?:death|the wounds?))\\b`, 'i'),
      new RegExp(`\\b${escaped}\\s+(?:is|was)\\s+(?:dead|killed|slain|lifeless|deceased|fatally (?:wounded|struck|pierced|poisoned))\\b`, 'i'),
      new RegExp(`\\b(?:killed|slain)\\s+${escaped}\\b`, 'i'),
      new RegExp(`\\b(?:death|fatality)\\s+(?:claims?|takes?|took)\\s+${escaped}\\b`, 'i'),
      new RegExp(`\\b${escaped}\\s+(?:draws?|drew|breathes?|breathed)\\s+(?:his|her|their)\\s+last\\s+breath\\b`, 'i'),
      new RegExp(`\\b${escaped}\\s+(?:fell|falls|drops?|dropped)\\s+lifeless\\b`, 'i'),
      new RegExp(`\\b${escaped}\\s+(?:fall|falls|fell|collapse|collapses|collapsed)\\s+dead\\b`, 'i'),
    ];
    for (const pattern of namePatterns) {
      if (pattern.test(content)) return true;
    }
  }

  return false;
}
