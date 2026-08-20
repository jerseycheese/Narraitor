// src/lib/ai/worldThreadExtraction.ts

import type {
  WorldThread,
  WorldThreadExtractionInput,
  WorldThreadExtractionResult,
  WorldThreadKind,
  WorldThreadSegmentSignals,
  WorldThreadSeedContext,
} from '@/types/worldThread.types';
import { FIRED_THREAD_MAX_STRIKES, OPEN_ASK_QUIET_TURNS } from '@/lib/narrative/worldClock';

/**
 * The world clock rides along on goal extraction so the ledger costs no
 * extra AI call per turn. This module only builds the prompt fragment and
 * reads the answer back; it knows nothing about clients or stores.
 */

/** Stable heading the test mock keys off; keep it verbatim. */
const WORLD_CLOCK_LEDGER_MARKER = 'WORLD CLOCK LEDGER';
const SEEDING_HEADING = 'SEEDING';

const THREAD_KINDS: readonly WorldThreadKind[] = ['consequence', 'actor', 'deadline'];
const RESOLUTION_OUTCOMES = ['resolved', 'dropped'] as const;

/**
 * Overdue and DUE NOW are computed here from the same turn index the scene
 * block used, so the extractor sees the thread the segment was told to land
 * and can file an arrival under it instead of opening it again as new.
 */
const formatThreadLine = (thread: WorldThread, currentTurn: number, isDueNow: boolean): string => {
  const marks: string[] = [];
  if (thread.dueByTurn !== undefined) {
    marks.push(`due turn ${thread.dueByTurn}`);
    const overdueBy = currentTurn - thread.dueByTurn;
    if (overdueBy > 0 && thread.firedAtTurn === undefined) {
      marks.push(`OVERDUE by ${overdueBy} turn${overdueBy === 1 ? '' : 's'}`);
    }
  }
  if (thread.firedAtTurn !== undefined) marks.push(`IN THE SCENE since turn ${thread.firedAtTurn}`);
  if (isDueNow) {
    marks.push(
      thread.firedAtTurn === undefined
        ? 'DUE NOW: this segment was asked to land it'
        : (thread.strikeCount ?? 0) >= FIRED_THREAD_MAX_STRIKES
          ? 'DUE NOW: this segment was asked to CONCLUDE the matter (settled one way or the other, the actor gone or changed, or the character out of its reach); RESOLVE is expected - if the prose closed it in any of those ways, that is a resolution with its outcome, not an advance'
          : 'DUE NOW: this segment was asked to make it act, cost the character, or conclude; if the prose settled it, RESOLVE it with the outcome'
    );
  }
  const suffix = marks.length > 0 ? `, ${marks.join(', ')}` : '';
  return `- [${thread.id}] (${thread.kind}, opened turn ${thread.openedAtTurn}, last moved turn ${thread.lastAdvancedAtTurn}${suffix}) ${thread.summary}`;
};

const formatSignals = (signals: WorldThreadSegmentSignals): string => {
  const parts: string[] = [];
  if (signals.location) parts.push(`location: ${signals.location}`);
  if (signals.itemsAcquired?.length) parts.push(`items acquired: ${signals.itemsAcquired.join(', ')}`);
  if (signals.itemsLost?.length) parts.push(`items lost: ${signals.itemsLost.join(', ')}`);
  if (signals.decisionOutcome) parts.push(`decision outcome: ${signals.decisionOutcome}`);
  if (signals.majorEvent) parts.push(`major event: ${signals.majorEvent}`);
  return `Observable changes this turn: ${parts.length > 0 ? parts.join('; ') : 'none recorded'}`;
};

const formatSeed = (seed: WorldThreadSeedContext): string => {
  const material: string[] = [];
  if (seed.worldDescription) material.push(`World description: ${seed.worldDescription}`);
  if (seed.toneInstructions) material.push(`Tone instructions: ${seed.toneInstructions}`);
  if (seed.activeGoals.length > 0) {
    material.push(`Player's goals:\n${seed.activeGoals.map((goal) => `- ${goal}`).join('\n')}`);
  }
  return `${SEEDING_HEADING}:
This session's ledger is empty. Derive its starting pressure sources from the world description, tone instructions and the player's goals below as 'deadline' or 'actor' threads (3 to 5), each phrased as the event that will land (who arrives, what is decided, who comes to collect) and each with a rough dueByTurn on the turn scale above where the prose gives a timescale. Prefer pressures that can act without the player: a named antagonist, a vote, a storm, a debt.
${material.join('\n')}`;
};

/**
 * Prompt fragment appended after the goal-extraction rules. Everything here is
 * turn arithmetic and the model's own earlier summaries; no dates.
 */
export function buildWorldThreadPromptSection(input: WorldThreadExtractionInput): string {
  const threadList =
    input.openThreads.length > 0
      ? input.openThreads
          .map((thread) => formatThreadLine(thread, input.currentTurn, thread.id === input.dueNowThreadId))
          .join('\n')
      : '(none open)';

  const sections = [
    `${WORLD_CLOCK_LEDGER_MARKER} (current turn ${input.currentTurn})
Open threads:
${threadList}`,
  ];

  if (input.segmentSignals) sections.push(formatSignals(input.segmentSignals));

  sections.push(`A thread is something the world owes the player: a consequence the player loaded that has not paid off, an off-screen actor with somewhere to go, or a deadline.
- OPEN a thread when THIS segment's prose loads one (max 2 per segment). An offstage threat the prose introduces (a sound from somewhere else, an arrival, a message, a move by someone not in the scene) is a thread; so is a major event the player did not cause that no open thread already covers. Phrase every summary as the event that will land, not a standing state: "Thorne comes to collect the favor owed for the seat", not "the player owes a favor"; "whatever is hitting the shed wall comes through", not "there is a noise at the shed". Do not open threads for the player's own intentions; those are goals.
- Before you OPEN, check the open threads above, the DUE NOW thread first: if the arrival, message, sound or move is one of them landing or moving (the actor it named walks in, the debt it named is called, the thing it named comes through), it is that thread, not a new one. Give the entry \`covers\` with that thread's id and it is filed as the thread's next state, with your summary as its new, more specific wording and your dueByTurn as its new due; \`covers\` null when nothing open covers it. Never re-open something already listed under a new name. An actor or event marked IN THE SCENE is already in the room: an actor already in the scene is not a new thread; their next move is an ADVANCE of that thread and their outcome a RESOLVE.
- ADVANCE an open thread only when the prose changes its state as something the player did not do: someone arrived or left, something was lost or gained, a position, date or distance moved. Cite its id and give \`changed\` as one clause naming the new state. Repeating, reminding, reiterating, re-confirming or reinforcing that a thread exists is NOT an advance; leave it alone. If the observable-changes line shows nothing changed, an advance needs a strong reason.
- RESOLVE a thread with outcome 'resolved' only when the prose shows the thing happening and \`resolution\` names the outcome: who won the vote and what it decided, what came through the door, what the caller collected, what was lost. Calling the vote, setting off toward the sound, the sound changing, the actor announcing they will act: each is an ADVANCE, not a resolution. Use 'dropped' only when the story has made it impossible or irrelevant, never because it stalled or has not been mentioned.
- dueByTurn is a rough turn index on this scale: one turn is a few minutes to an hour of story time; 'later today' or 'tonight' is 2-4 turns out, 'tomorrow' about 5, 'end of the week' about 10, 'six weeks' about 30. Never earlier than two turns from now. All stamps are turn indices, never dates.`);

  // Round 8 and round 11 both measured the extractor opening nothing for a
  // whole session once the seeds resolved, leaving the story with no incoming
  // pressure; when the ledger has gone quiet the ask is explicit, and it is
  // one thread, because "file everything" (round 7) is the opposite failure.
  if (input.openAsk) {
    sections.push(`THE LEDGER HAS GONE QUIET: nothing has opened in ${OPEN_ASK_QUIET_TURNS} or more turns and no open thread has an arrival coming. OPEN exactly one new off-stage pressure this turn: who arrives, what is decided, who comes to collect. Take it from this segment's prose if it loaded one; otherwise derive it from the world's own pressure sources (an actor, a debt, a deadline the story has established but not yet cashed). One thread, phrased as the event that will land, with a rough dueByTurn on the turn scale above. Not a repeat of anything resolved, and not a second copy of anything open.`);
  }

  if (input.seed) sections.push(formatSeed(input.seed));

  // The response shape lives in the goal prompt's JSON skeleton, which grows
  // a "worldThreads" member whenever this section is present; one line here
  // points at it without repeating it.
  sections.push('Return the ledger changes under the "worldThreads" key of the JSON below.');

  return sections.join('\n\n');
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const asTurnIndex = (value: unknown): number | undefined => {
  const numeric = typeof value === 'string' ? Number(value) : value;
  return typeof numeric === 'number' && Number.isFinite(numeric) ? Math.round(numeric) : undefined;
};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/** The model writes "none" or "null" as often as a JSON null; all of them mean nothing open covers it. */
const asCoversId = (value: unknown): string | undefined => {
  const id = asTrimmedString(value);
  if (!id || id.toLowerCase() === 'none' || id.toLowerCase() === 'null') return undefined;
  return id;
};

/**
 * Reads the model's `worldThreads` block. Returns undefined when the block is
 * absent so the caller can tell "the model said nothing" from "the model said
 * nothing changed"; the former must not mark a session as seeded.
 */
export function parseWorldThreadExtraction(value: unknown): WorldThreadExtractionResult | undefined {
  if (!isRecord(value)) return undefined;

  const opened: WorldThreadExtractionResult['opened'] = [];
  for (const entry of asArray(value.opened)) {
    if (!isRecord(entry)) continue;
    const kind = entry.kind;
    const summary = asTrimmedString(entry.summary);
    if (!THREAD_KINDS.includes(kind as WorldThreadKind) || !summary) continue;
    const dueByTurn = asTurnIndex(entry.dueByTurn);
    const covers = asCoversId(entry.covers);
    opened.push({
      kind: kind as WorldThreadKind,
      summary,
      ...(dueByTurn !== undefined ? { dueByTurn } : {}),
      ...(covers !== undefined ? { covers } : {}),
    });
  }

  // An advance with nothing it can name as changed is a restatement, and a
  // restatement recorded as movement is what let round 5's overdue threads
  // sit for 25 turns; the ledger only moves on a named state change.
  const advanced: WorldThreadExtractionResult['advanced'] = [];
  for (const entry of asArray(value.advanced)) {
    if (!isRecord(entry)) continue;
    const id = asTrimmedString(entry.id);
    const changed = asTrimmedString(entry.changed);
    if (!id || !changed) continue;
    advanced.push({ id, changed });
  }

  const resolved: WorldThreadExtractionResult['resolved'] = [];
  for (const entry of asArray(value.resolved)) {
    if (!isRecord(entry)) continue;
    const id = asTrimmedString(entry.id);
    const resolution = asTrimmedString(entry.resolution);
    const outcome = entry.outcome;
    if (!id || !resolution) continue;
    if (!RESOLUTION_OUTCOMES.includes(outcome as (typeof RESOLUTION_OUTCOMES)[number])) continue;
    resolved.push({ id, resolution, outcome: outcome as 'resolved' | 'dropped' });
  }

  return { opened, advanced, resolved };
}
