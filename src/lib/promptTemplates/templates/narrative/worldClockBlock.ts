import type { WorldClockPromptContext } from '@/types/worldThread.types';

const KIND_LABEL: Record<WorldClockPromptContext['threads'][number]['kind'], string> = {
  consequence: 'consequence owed',
  actor: 'off-screen actor',
  deadline: 'deadline',
};

/**
 * The world's own turn. The ledger is the story's memory of what it owes the
 * player; the spend rule is the clock. Without the rule an empty ledger would
 * leave a quiet civic drama sitting still, so the empty case still asks for
 * an unbidden move.
 *
 * Renders nothing when the context is absent, so every other template path
 * is unchanged.
 */
export const worldClockBlock = (worldClock?: WorldClockPromptContext): string => {
  if (!worldClock) return '';

  const { currentTurn, turnsSinceWorldMoved, threads } = worldClock;

  const ledgerLines =
    threads.length > 0
      ? threads
          .map((thread) => {
            const age = thread.ageTurns === 1 ? '1 turn' : `${thread.ageTurns} turns`;
            const overdue = thread.overdue ? ' [OVERDUE - this must come due now]' : '';
            return `- (${KIND_LABEL[thread.kind]}, open ${age}) ${thread.summary}${overdue}`;
          })
          .join('\n')
      : '- (nothing on the ledger yet)';

  const spendRule =
    threads.length > 0
      ? `- This segment MUST advance, bring due, or resolve at least ONE thread above, in the prose, as something the player did not do. Prefer an OVERDUE thread, then the oldest.
- Advance means the world moves on it: the actor arrives or acts, the deadline lands or presses, the consequence comes home. Not a reminder that it exists.`
      : `- The ledger is empty, so this segment MUST show the world moving on its own: pick someone from the NPC roster who is not in the scene and have them act, arrive, send word, or change their position, unbidden.`;

  return `
WORLD CLOCK - THE WORLD MOVES WITHOUT THE PLAYER:
Turn ${currentTurn}. Turns since the world last moved on its own: ${turnsSinceWorldMoved}.
Open threads the story owes the player (overdue first, then oldest):
${ledgerLines}
${spendRule}
- Whatever moves must be observable in the prose (someone arrives, something is lost, a position changes), not foreshadowed for later.
- Do not invent a new threat when a thread above can carry the pressure. Do not restate the ledger to the player.
`;
};
