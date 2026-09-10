import type { EntityID } from '@/types/common.types';
import type { WorldCostExtractionResult, WorldCostSegmentNote } from '@/types/worldCost.types';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldThreadStore } from '@/state/worldThreadStore';

import { isSameCondition, normalizeConditionLabel } from './normalizeCondition';

export interface ApplyWorldCostParams {
  sessionId: EntityID;
  characterId: EntityID;
  result: WorldCostExtractionResult;
  decisionId?: EntityID;
}

/**
 * Writes what the world took home. A condition goes onto the character; an
 * item is attribution only, because the scene's itemsLost already took it
 * out of the inventory. Either kind is recorded on the thread that imposed
 * it when the extractor named one of this session's open threads.
 */
export function applyWorldCost({ sessionId, characterId, result, decisionId }: ApplyWorldCostParams): WorldCostSegmentNote {
  const characterStore = useCharacterStore.getState();
  const threadStore = useWorldThreadStore.getState();
  const note: WorldCostSegmentNote = { imposed: [], cleared: [] };

  // 1. Cleared conditions: process first so a cleared condition being replaced
  // by a newer development isn't removed after being added.
  for (const condition of result.cleared) {
    characterStore.removeCondition(characterId, condition);
    note.cleared.push(condition);
  }

  // Conditions currently carried by the character after clears.
  const currentConditions = [
    ...(characterStore.characters[characterId]?.status.conditions ?? []),
  ];

  for (const cost of result.imposed) {
    if (cost.kind === 'condition') {
      const trimmed = cost.detail.trim();
      const normalized = normalizeConditionLabel(trimmed);

      // A condition the character already carries, re-imposed verbatim, is not a
      // new cost: skipping it here keeps it off the note and out of every count,
      // not just out of the store (which already ignored the duplicate write).
      const verbatimDuplicate = currentConditions.some(
        (condition) => condition.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (verbatimDuplicate) continue;

      const existingIndex = currentConditions.findIndex((c) => isSameCondition(c, trimmed));
      if (existingIndex !== -1) {
        currentConditions[existingIndex] = normalized;
      } else {
        currentConditions.push(normalized);
      }

      characterStore.addCondition(characterId, cost.detail);
    }
    const thread = cost.threadId ? threadStore.recordThreadCost(sessionId, cost.threadId, cost.detail) : undefined;
    const causedByThisDecision = cost.causedByDecision && decisionId;
    note.imposed.push({
      kind: cost.kind,
      detail: cost.detail,
      ...(thread ? { thread: thread.summary } : {}),
      ...(causedByThisDecision ? { decisionId } : {}),
    });
  }

  if (result.fatal) note.fatal = true;

  return note;
}
