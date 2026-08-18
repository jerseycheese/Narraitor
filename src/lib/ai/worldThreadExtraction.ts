// src/lib/ai/worldThreadExtraction.ts

import type {
  WorldThread,
  WorldThreadExtractionInput,
  WorldThreadExtractionResult,
  WorldThreadKind,
  WorldThreadSegmentSignals,
  WorldThreadSeedContext,
} from '@/types/worldThread.types';

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

const formatThreadLine = (thread: WorldThread): string => {
  const due = thread.dueByTurn !== undefined ? `, due turn ${thread.dueByTurn}` : '';
  return `- [${thread.id}] (${thread.kind}, opened turn ${thread.openedAtTurn}, last moved turn ${thread.lastAdvancedAtTurn}${due}) ${thread.summary}`;
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
This session's ledger is empty. Derive its starting pressure sources from the world description, tone instructions and the player's goals below as 'deadline' or 'actor' threads (3 to 5), each with a rough dueByTurn on the turn scale above where the prose gives a timescale. Prefer pressures that can act without the player: a named antagonist, a vote, a storm, a debt.
${material.join('\n')}`;
};

/**
 * Prompt fragment appended after the goal-extraction rules. Everything here is
 * turn arithmetic and the model's own earlier summaries; no dates.
 */
export function buildWorldThreadPromptSection(input: WorldThreadExtractionInput): string {
  const threadList =
    input.openThreads.length > 0
      ? input.openThreads.map(formatThreadLine).join('\n')
      : '(none open)';

  const sections = [
    `${WORLD_CLOCK_LEDGER_MARKER} (current turn ${input.currentTurn})
Open threads:
${threadList}`,
  ];

  if (input.segmentSignals) sections.push(formatSignals(input.segmentSignals));

  sections.push(`A thread is something the world owes the player: a consequence the player loaded that has not paid off, an off-screen actor with somewhere to go, or a deadline.
- OPEN a thread only when THIS segment's prose loads one (max 2 per segment). Do not re-open something already listed. Do not open threads for the player's own intentions; those are goals.
- ADVANCE an open thread only when the prose changes its state as something the player did not do: someone arrived or left, something was lost or gained, a position, date or distance moved. Cite its id and give \`changed\` as one clause naming the new state. Repeating, reminding, reiterating, re-confirming or reinforcing that a thread exists is NOT an advance; leave it alone. If the observable-changes line shows nothing changed, an advance needs a strong reason.
- RESOLVE a thread with outcome 'resolved' when the prose shows the thing happening: the vote is held, the report lands, the day ends, the actor's move completes, the consequence hits. Use 'dropped' only when the story has made it impossible or irrelevant, never because it stalled or has not been mentioned.
- dueByTurn is a rough turn index on this scale: one turn is a few minutes to an hour of story time; 'later today' or 'tonight' is 2-4 turns out, 'tomorrow' about 5, 'end of the week' about 10, 'six weeks' about 30. Never earlier than two turns from now. All stamps are turn indices, never dates.`);

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
    opened.push({
      kind: kind as WorldThreadKind,
      summary,
      ...(dueByTurn !== undefined ? { dueByTurn } : {}),
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
