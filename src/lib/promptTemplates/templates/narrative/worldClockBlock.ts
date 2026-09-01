import type { WorldClockPromptContext } from '@/types/worldThread.types';
import { FIRED_THREAD_MAX_STRIKES } from '@/lib/narrative/worldClock';

type PromptThread = WorldClockPromptContext['threads'][number];

export const KIND_LABEL: Record<PromptThread['kind'], string> = {
  consequence: 'consequence owed',
  actor: 'off-screen actor',
  deadline: 'deadline',
};

const pluralTurns = (count: number): string => (count === 1 ? '1 turn' : `${count} turns`);

const pluralTimes = (count: number): string => (count === 1 ? 'once' : `${count} times`);

const ledgerMark = (thread: PromptThread): string => {
  if (thread.fired) {
    // The summary on the line is the thread's own; nothing model-written
    // from a later turn is repeated here (round 9 fed a mis-parse back
    // into the scene prompt for 22 turns through the last move).
    return ` [IN THE SCENE since turn ${thread.firedAtTurn}${thread.dueNow ? ', DUE NOW' : ''}]`;
  }
  if (thread.dueNow) return ' [DUE NOW]';
  if (thread.overdue) return ` [overdue by ${pluralTurns(thread.overdueByTurns)} - bring it toward landing]`;
  return '';
};

/**
 * Once every open thread has landed there is nothing left off-stage to
 * arrive, and a story with only in-the-room threads sits in one beat asking
 * the same question again; the empty-ledger ask applies.
 */
const OFFSTAGE_MOVE_ASK = `pick someone from the NPC roster who is not in the scene and have them act, arrive, send word, or change their position, unbidden. That move becomes a thread the story now owes, so make it one thing with somewhere to go, not another unexplained noise on top of the last one.`;

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
 * The fuse. A thread that has landed and then stands in the scene doing
 * nothing is what both round-9 judges named; once its fuse runs out the ask
 * is the act, the cost or the outcome, never the arrival again, and there is
 * no forward cut because it is already here. The act is asked for in the
 * world's own register: round 10's "strikes, seizes, the blow" pulled a
 * no-violence civic drama into a poisoned package.
 */
const firedDueNowSection = (thread: PromptThread, register?: string): string => {
  if (thread.strikes >= FIRED_THREAD_MAX_STRIKES) return firedConcludeSection(thread);
  return `
IN THE SCENE AND DUE NOW: ${thread.summary}. It has been in the scene since turn ${thread.firedAtTurn} and it has not yet acted.
- In THIS segment it acts on the character, now, and the act costs them: something recordable they did not choose to give up, an item they hold (name it in itemsLost with lossReason "stolen" or "destroyed") or a lasting state they now carry, stated plainly in the prose. Or the matter is settled one way or the other, and the segment shows the outcome.
- What the act looks like is this world's to decide, in its own register${register ? `: "${register}"` : ' (the Tone above)'}. A blow in one world is a vote lost, a name struck from a list, a debt called in; in another it is a blade. Do not borrow a harder genre's violence to make it land.
- It does not wait, threaten again, announce itself, or take one more step closer. It is already here; no time cut is needed and none is granted. A thread that has arrived and takes nothing has not acted.`;
};

/**
 * The fuse's exit. Round 11's fused pick struck every three turns for twenty
 * because the only ways off the fuse were resolution or a kill; the prose
 * delivered neither and the player sat in one physical state for 35 turns.
 * Past the strike cap the ask is no longer another act - it is the matter
 * closing, and a forward cut is granted because a scene that will not change
 * on its own may need one to end.
 */
const firedConcludeSection = (thread: PromptThread): string => `
IN THE SCENE AND DUE NOW: ${thread.summary}. It has been in the scene since turn ${thread.firedAtTurn} and it has acted ${pluralTimes(thread.strikes)} without the matter closing. It does not act again.
- In THIS segment the matter CONCLUDES, one way or the other: it is settled (won, lost, paid, escaped, finished), or the actor is gone or permanently changed, or the character is somewhere else and out of its reach. Show the outcome happening, not a promise of it.
- If the scene as it stands cannot reach that ending, this segment is a "transition": let the story time pass and open at the moment the matter has closed or the character is clear of it. For this one segment that overrides "pick up immediately"; time may jump FORWARD. Never backward.
- Another blow, another wound, another escalation that leaves everything standing where it stood does not count. The scene ends, the state changes, or the character moves on.`;

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

  const { currentTurn, turnsSinceWorldMoved, threads, register } = worldClock;
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

  const allFired = threads.length > 0 && threads.every((thread) => thread.fired);
  const spendRule =
    threads.length === 0
      ? `- The ledger is empty, so this segment MUST show the world moving on its own: ${OFFSTAGE_MOVE_ASK}`
      : dueNow
        ? `- This segment MUST advance, bring due, or resolve at least ONE thread above, in the prose, as something the player did not do. The DUE NOW thread ${dueNow.fired ? 'acts' : 'lands'} this segment (see below); the rest may move or wait.
- Advance means the world moves on it: the actor arrives or acts, the deadline lands or presses, the consequence comes home. Not a reminder that it exists.`
        : allFired
          ? `- Every thread above is already in the scene, so this segment MUST move at least one of them by its next move, its cost, or its outcome, AND bring one new pressure in from off-stage: ${OFFSTAGE_MOVE_ASK}`
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
- A thread marked IN THE SCENE has already arrived: never arrive it again or deliver it as news; what it owes now is its next move, its cost, or its outcome.
- Do not invent a new threat when a thread above can carry the pressure. Do not restate the ledger to the player.
- Nothing in this block reaches the passage. No "World Clock", no "thread", no "update", no turn number, no note from the storyteller, no bracketed or parenthetical line about what has landed, acted or been taken. Never copy a ledger line above into the passage as a heading, a label or a summary sentence, bold or plain; when a thread resolves, the prose shows the outcome happening and never captions it. The prose shows it as story; the record goes in metadata.${dueNow ? (dueNow.fired ? firedDueNowSection(dueNow, register) : dueNowSection(dueNow)) : ''}
`;
};
