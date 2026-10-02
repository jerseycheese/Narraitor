// src/lib/narrative/fatalDraftValidation.ts

import type { NarrativeGenerationResult } from '@/types/narrative.types';
import { escapeRegExp } from '@/lib/utils/formatters';

function maskHypotheticals(text: string, playerName?: string): string {
  const playerRef =
    playerName && playerName.trim().length > 0
      ? `(?:you|thou|${escapeRegExp(playerName.trim())})`
      : `(?:you|thou)`;

  const conditionalPattern = new RegExp(
    `\\b(?:if|unless|lest|whether|before|until|in\\s+case|should)\\s+${playerRef}\\s+[^.!?\\n,;:]*?(?:die|dies|died|perish|perishes|perished|bleed\\s+out|succumb|stop\\s+breathing)[^.!?\\n,;:]*`,
    'gi'
  );

  const warningPattern = new RegExp(
    `\\b(?:warns?|warned|warning|fears?|feared|afraid|worried|threatens?|threatened)\\s+(?:that\\s+)?(?:to\\s+)?${playerRef}\\s+(?:could|might|would|will|may)\\s+(?:die|perish|succumb|fall)[^.!?\\n,;:]*`,
    'gi'
  );

  return text
    .replace(conditionalPattern, '[hypothetical-clause]')
    .replace(warningPattern, '[hypothetical-clause]');
}

function buildPlayerDeathPatterns(playerName?: string): RegExp[] {
  const hasName = Boolean(playerName && playerName.trim().length > 0);
  const escaped = hasName ? escapeRegExp(playerName!.trim()) : '';

  const subject = hasName ? `(?:you|thou|${escaped})` : `(?:you|thou)`;

  const possessive = hasName
    ? `(?:your|thy|${escaped}'s)`
    : `(?:your|thy)`;

  const beVerb = hasName
    ? `(?:you\\s+are|you're|thou\\s+art|${escaped}\\s+(?:is|was|are|were))`
    : `(?:you\\s+are|you're|thou\\s+art)`;

  return [
    // Direct death / bleeding out / succumbing
    new RegExp(
      `\\b${subject}\\s+(?:have\\s+|has\\s+|had\\s+)?(?:die|dies|died|perish|perishes|perished|bleed(?:s|ing)?\\s+out(?:\\s+to\\s+death)?|succumb(?:s|ed)?(?:\\s+to\\s+(?:death|the\\s+wounds?|fatal|mortal|your\\s+injuries|their\\s+injuries))?)\\b`,
      'i'
    ),

    // State of death or fatal trauma
    new RegExp(
      `\\b${beVerb}\\s+(?:dead|killed|slain|lifeless|deceased|fatally\\s+(?:wounded|struck|pierced|poisoned|injured))\\b`,
      'i'
    ),

    // Death / killing as transitive action on the player
    new RegExp(`\\b(?:killed|slain|murdered)\\s+${subject}\\b`, 'i'),
    new RegExp(
      `\\b(?:death|fatality)\\s+(?:claims?|claimed|takes?|took)\\s+${subject}\\b`,
      'i'
    ),

    // Collapsing or falling dead
    new RegExp(
      `\\b${subject}\\s+(?:fall|falls|fell|collapse|collapses|collapsed|drop|drops|dropped)\\s+(?:dead|lifeless)\\b`,
      'i'
    ),
    new RegExp(
      `\\b${subject}\\s+(?:collapse|collapses|collapsed)\\s+and\\s+die\\b`,
      'i'
    ),

    // Cardiac and respiratory vital cessation
    new RegExp(
      `\\b${possessive}\\s+heart\\s+(?:stops?|stopped|ceases?\\s+to\\s+beat|ceased\\s+to\\s+beat)\\b`,
      'i'
    ),
    new RegExp(
      `\\b${subject}\\s+(?:stop|stops|stopped|cease|ceases|ceased)\\s+breathing\\b`,
      'i'
    ),
    new RegExp(
      `\\b(?:draws?|drew|breathes?|breathed)\\s+${possessive}\\s+last\\s+breath\\b`,
      'i'
    ),
    new RegExp(
      `\\b${subject}\\s+(?:draws?|drew|breathes?|breathed)\\s+(?:his|her|their|your|thy)\\s+last\\s+breath\\b`,
      'i'
    ),
    new RegExp(`\\b${possessive}\\s+(?:final|last)\\s+breath\\b`, 'i'),

    // Corpse / lifeless body
    new RegExp(
      `\\b${possessive}\\s+(?:lifeless\\s+body|corpse|remains)\\b`,
      'i'
    ),
    new RegExp(`\\b(?:leaves?|left)\\s+${possessive}\\s+corpse\\b`, 'i'),

    // Terminal session-ending incapacitation / non-awakening
    new RegExp(
      `\\b${subject}\\s+(?:never\\s+wake\\s+again|will\\s+never\\s+wake|never\\s+open\\s+${possessive}\\s+eyes\\s+again|never\\s+open\\s+(?:his|her|their)\\s+eyes\\s+again)\\b`,
      'i'
    ),
    new RegExp(
      `\\b${beVerb}\\s+paralyzed\\s+and\\s+cannot\\s+continue\\b`,
      'i'
    ),
    new RegExp(
      `\\b${subject}\\s+(?:slip|slips|slipped|fall|falls|fell|sink|sinks|sank)\\s+into\\s+(?:eternal\\s+(?:darkness|slumber|sleep)|a\\s+permanent\\s+coma|death)\\b`,
      'i'
    ),

    // Explicit game over assertion
    /\bthis\s+is\s+game\s+over\b/i,
  ];
}

/**
 * Validates whether a narrative generation draft describes character death,
 * carries fatal metadata, or terminates the session.
 */
export function isLethalNarrativeDraft(
  draft: NarrativeGenerationResult | { content?: string; metadata?: unknown; segmentType?: string },
  playerCharacterName?: string
): boolean {
  const metadata = (draft as NarrativeGenerationResult).metadata;
  if (metadata?.tags?.includes('fatal-outcome')) {
    return true;
  }
  if ((draft as { segmentType?: string }).segmentType === 'ending') {
    return true;
  }
  if (
    (metadata as { endingId?: string; endingData?: unknown } | undefined)?.endingId != null ||
    (metadata as { endingId?: string; endingData?: unknown } | undefined)?.endingData != null
  ) {
    return true;
  }

  const content = draft.content ?? '';
  if (!content.trim()) return false;

  const maskedContent = maskHypotheticals(content, playerCharacterName);
  const patterns = buildPlayerDeathPatterns(playerCharacterName);

  for (const pattern of patterns) {
    if (pattern.test(maskedContent)) return true;
  }

  return false;
}
