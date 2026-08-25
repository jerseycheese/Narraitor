// src/lib/ai/worldCostExtraction.ts

import type {
  WorldCostEntry,
  WorldCostExtractionInput,
  WorldCostExtractionResult,
  WorldCostKind,
} from '@/types/worldCost.types';
import { isRecord, asTrimmedString, asArray } from '@/lib/utils/typeGuards';

/**
 * The cost channel rides along on goal extraction, like the world clock, so
 * recording what the world took costs no extra AI call. This module builds
 * the prompt fragment and reads the answer back; it knows nothing about
 * clients or stores.
 */

/** Stable heading the test mock keys off; keep it verbatim. */
const WORLD_COST_MARKER = 'WORLD COST';

const COST_KINDS: readonly WorldCostKind[] = ['condition', 'item'];

const formatList = (items: string[]): string =>
  items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '(none)';

/**
 * Prompt fragment appended after the goal-extraction rules. The character's
 * own conditions and this turn's recorded item losses; no ids beyond the
 * thread ids the ledger section already shows.
 */
export function buildWorldCostPromptSection(input: WorldCostExtractionInput): string {
  return `${WORLD_COST_MARKER} (what the world took from the character this turn)
Conditions the character already carries:
${formatList(input.conditions)}
Items the scene recorded as lost this turn:
${formatList(input.itemsLost)}

A cost is something the character lost or now carries that they did not choose to spend: a lasting state (kind "condition"), or an item taken, broken or destroyed by someone or something else (kind "item"). The player using, spending, bracing with or giving away an item is not a cost. A failed action whose prose leaves a lasting mark on the character (discredited before the room, a bleeding hand) is a cost.
- A condition is a lasting state the character will still have next scene, named as what is wrong with them ("gashed left forearm", "discredited before the council", "no longer welcome at the Hendersons'"). It is never a feeling, a sensation, a sound they made, a pressure they are under, or an event that happened to them. "cold dread", "urgency", "a desperate sound tearing at the throat" are not conditions.
- IMPOSE at most ONE new condition per turn: the single most lasting thing the prose states. A blow to the arm that also dizzies and nauseates them is one condition, the arm. Items are not capped.
- Do not impose a condition already on the list above, under the same or new wording. If a listed condition got worse, CLEAR its text and IMPOSE the new one, once.
- Death, dying, unconsciousness and their kin are never conditions. If the prose killed the character or left them unable to act, set "fatal" to true and impose nothing for it.
- "detail" is a short noun phrase in the character's terms, not a sentence. If an open thread from the WORLD CLOCK LEDGER imposed it, set "threadId" to that thread's id; otherwise null.
- CLEAR a condition from the list above only when this segment's prose plainly ends it (the wound is bound, the room warms to the character again). Copy its text exactly.
- "fatal" is true only when this segment's prose plainly killed the character or left them unable to act in the story: dead, dying past saving, unconscious with no way back in this scene. Wounded, cornered, captured, or awake and able to act is false.
- Do not invent a cost the prose does not state. Most turns impose nothing and are not fatal; an empty list and false are the right answer then.
Return it under the "worldCost" key of the JSON below.`;
}

/**
 * Reads the model's `worldCost` block. Returns undefined when the block is
 * absent so the caller can tell "the model said nothing" from "the world took
 * nothing"; invalid entries are dropped one at a time. One new condition per
 * turn is the contract, and the parser holds it: round 10 fanned one package
 * into eight symptoms, so the first condition stays and the rest are dropped
 * (items are not capped). `fatal` reads false unless the model said true.
 */
export function parseWorldCostExtraction(value: unknown): WorldCostExtractionResult | undefined {
  if (!isRecord(value)) return undefined;

  const imposed: WorldCostEntry[] = [];
  let conditionKept = false;
  for (const entry of asArray(value.imposed)) {
    if (!isRecord(entry)) continue;
    const kind = entry.kind;
    const detail = asTrimmedString(entry.detail);
    if (!COST_KINDS.includes(kind as WorldCostKind) || !detail) continue;
    if (kind === 'condition') {
      if (conditionKept) continue;
      conditionKept = true;
    }
    const threadId = asTrimmedString(entry.threadId);
    imposed.push({ kind: kind as WorldCostKind, detail, ...(threadId ? { threadId } : {}) });
  }

  const cleared = asArray(value.cleared)
    .map(asTrimmedString)
    .filter((condition): condition is string => Boolean(condition));

  return { imposed, cleared, fatal: value.fatal === true };
}
