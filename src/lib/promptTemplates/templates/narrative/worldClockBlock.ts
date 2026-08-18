import type { WorldClockPromptContext } from '@/types/worldThread.types';

type PromptThread = WorldClockPromptContext['threads'][number];

const KIND_LABEL: Record<PromptThread['kind'], string> = {
  consequence: 'consequence owed',
  actor: 'off-screen actor',
  deadline: 'deadline',
};

const pluralTurns = (count: number): string => (count === 1 ? '1 turn' : `${count} turns`);

const ledgerMark = (thread: PromptThread): string => {
  if (thread.dueNow) return ' [DUE NOW]';
  if (thread.overdue) return ` [overdue by ${pluralTurns(thread.overdueByTurns)} - bring it toward landing]`;
  return '';
};

/**
 * The scene template tells the model to pick up exactly where the last
 * segment ended, so a deadline like "end of next week" can never arrive in a
 * continuous scene; left to itself the model mentions it again instead. The
 * due-now section is the one place the prompt grants a forward cut, and it
 * names a single thread so the ask cannot be spread thin across four.
 */
const dueNowSection = (thread: PromptThread): string => `
DUE NOW: ${thread.summary}. It has been overdue for ${pluralTurns(thread.overdueByTurns)}.
- In THIS segment it lands: the vote is held and decided, the report arrives, the actor walks in, the thing at the door comes through, the debt is collected. Show it happening and what it costs or changes; calling for it, hearing it again, or setting off toward it does not count.
- If the scene as it stands cannot reach that moment, this segment is a "transition": let the story time pass and open at the moment it lands. For this one segment that overrides "pick up immediately"; time may jump FORWARD to reach it. Never backward.
- It has already been announced. Do not deliver it as fresh news, do not have anyone remind the player it is coming, do not foreshadow it again. It happens, and the segment shows the consequence.`;

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
  const dueNow = threads.find((thread) => thread.dueNow);

  const ledgerLines =
    threads.length > 0
      ? threads
          .map(
            (thread) =>
              `- (${KIND_LABEL[thread.kind]}, open ${pluralTurns(thread.ageTurns)}) ${thread.summary}${ledgerMark(thread)}`
          )
          .join('\n')
      : '- (nothing on the ledger yet)';

  const spendRule =
    threads.length === 0
      ? `- The ledger is empty, so this segment MUST show the world moving on its own: pick someone from the NPC roster who is not in the scene and have them act, arrive, send word, or change their position, unbidden. That move becomes a thread the story now owes, so make it one thing with somewhere to go, not another unexplained noise on top of the last one.`
      : dueNow
        ? `- This segment MUST advance, bring due, or resolve at least ONE thread above, in the prose, as something the player did not do. The DUE NOW thread lands this segment (see below); the rest may move or wait.
- Advance means the world moves on it: the actor arrives or acts, the deadline lands or presses, the consequence comes home. Not a reminder that it exists.`
        : `- This segment MUST advance, bring due, or resolve at least ONE thread above, in the prose, as something the player did not do. Prefer an OVERDUE thread, then the oldest.
- Advance means the world moves on it: the actor arrives or acts, the deadline lands or presses, the consequence comes home. Not a reminder that it exists.`;

  return `
WORLD CLOCK - THE WORLD MOVES WITHOUT THE PLAYER:
Turn ${currentTurn}. Turns since the world last moved on its own: ${turnsSinceWorldMoved}.
Open threads the story owes the player (overdue first, then oldest):
${ledgerLines}
${spendRule}
- Whatever moves must be observable in the prose (someone arrives, something is lost, a position changes), not foreshadowed for later.
- Every thread above is already known to the player: never introduce one as new (a text that already arrived, a warning already given). Move it or land it.
- Do not invent a new threat when a thread above can carry the pressure. Do not restate the ledger to the player.${dueNow ? dueNowSection(dueNow) : ''}
`;
};
