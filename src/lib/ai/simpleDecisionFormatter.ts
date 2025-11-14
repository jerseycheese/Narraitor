/**
 * Simple Decision Formatter - Straightforward Decision Formatting
 *
 * Replaces the 206-line adaptive formatter with a simple approach:
 * all decisions get the same detailed format. Since we're only including
 * 10-15 recent decisions, we don't need token optimization or adaptive detail levels.
 */

import type { PlayerDecision } from '@/types/personalization.types';
import { safeTrim } from '@/lib/utils';

/**
 * Formats player decisions into AI context strings
 *
 * @param decisions - Player decisions to format (pre-filtered and limited)
 * @returns Formatted decision history string
 */
export function formatDecisions(decisions: PlayerDecision[]): string {
  if (decisions.length === 0) {
    return '';
  }

  const formattedDecisions = decisions.map(decision => {
    const location = safeTrim(decision.context?.location) || 'Unknown location';
    const action = decision.choiceText.toLowerCase().replace(/^(you |i )/i, '');
    const type = decision.choiceType;
    const situation = safeTrim(decision.context?.situation);
    const characters = decision.context?.charactersPresent || [];

    let formatted = `- At ${location}`;

    if (situation) {
      formatted += ` (${situation})`;
    }

    if (characters.length > 0) {
      formatted += ` with ${characters.join(', ')}`;
    }

    formatted += `, you ${action} (${type})`;

    return formatted;
  });

  return `\n\nRECENT PLAYER DECISIONS:\n${formattedDecisions.join('\n')}`;
}
