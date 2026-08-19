import type { EntityID } from '@/types/common.types';
import type { WorldCostExtractionResult, WorldCostSegmentNote } from '@/types/worldCost.types';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldThreadStore } from '@/state/worldThreadStore';

export interface ApplyWorldCostParams {
  sessionId: EntityID;
  characterId: EntityID;
  result: WorldCostExtractionResult;
}

/**
 * Writes what the world took home. A condition goes onto the character; an
 * item is attribution only, because the scene's itemsLost already took it
 * out of the inventory. Either kind is recorded on the thread that imposed
 * it when the extractor named one of this session's open threads.
 */
export function applyWorldCost({ sessionId, characterId, result }: ApplyWorldCostParams): WorldCostSegmentNote {
  const characterStore = useCharacterStore.getState();
  const threadStore = useWorldThreadStore.getState();
  const note: WorldCostSegmentNote = { imposed: [], cleared: [] };

  for (const cost of result.imposed) {
    if (cost.kind === 'condition') {
      characterStore.addCondition(characterId, cost.detail);
    }
    const thread = cost.threadId ? threadStore.recordThreadCost(sessionId, cost.threadId, cost.detail) : undefined;
    note.imposed.push({
      kind: cost.kind,
      detail: cost.detail,
      ...(thread ? { thread: thread.summary } : {}),
    });
  }

  for (const condition of result.cleared) {
    characterStore.removeCondition(characterId, condition);
    note.cleared.push(condition);
  }

  if (result.fatal) note.fatal = true;

  return note;
}
