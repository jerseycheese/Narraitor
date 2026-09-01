// src/lib/narrative/sessionSnapshotAssembler.ts

import type { EntityID } from '@/types/common.types';
import type { SessionSnapshot } from '@/types/turnResolver.types';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useCharacterStore } from '@/state/characterStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useWorldThreadStore } from '@/state/worldThreadStore';
import { useWorldStore } from '@/state/worldStore';
import { useNPCStore } from '@/state/npcStore';
import { useSessionStore } from '@/state/sessionStore';
import { getLoreContextForPrompt } from '@/lib/ai/loreContextHelper';
import { countWorldClockTurns } from '@/lib/narrative/worldClock';

/**
 * Reads every session-relevant store once at call time and returns a frozen,
 * read-only snapshot. No subscriptions, no side effects. Modeled after the
 * existing decisionSnapshot.ts and buildContinuityContractFromStores()
 * patterns.
 *
 * Prompt projections and post-turn assertions consume this instead of
 * scattered getState() calls, which eliminates the race window where one
 * store has been updated but another hasn't.
 *
 * Pass authoritative worldId/characterId from the command so the snapshot
 * is always bound to the requested session, not whichever session happens
 * to be active in the singleton store.
 */
export function assembleSessionSnapshot(
  sessionId: EntityID,
  ids?: { worldId: EntityID; characterId: EntityID }
): SessionSnapshot {
  const narrativeState = useNarrativeStore.getState();
  const characterState = useCharacterStore.getState();
  const inventoryState = useInventoryStore.getState();
  const worldThreadState = useWorldThreadStore.getState();
  const worldState = useWorldStore.getState();
  const npcState = useNPCStore.getState();
  const sessionState = useSessionStore.getState();

  const worldId = ids?.worldId ?? sessionState?.worldId ?? '';
  const characterId = ids?.characterId ?? sessionState?.characterId ?? '';

  const allSegments =
    typeof narrativeState?.getSessionSegments === 'function'
      ? narrativeState.getSessionSegments(sessionId)
      : [];
  const turnIndex = countWorldClockTurns(allSegments);

  const character = characterState?.characters?.[characterId];
  const conditions = character?.status?.conditions ?? [];

  const inventory =
    typeof inventoryState?.getCharacterItems === 'function'
      ? inventoryState.getCharacterItems(characterId)
      : [];

  const worldThreads =
    typeof worldThreadState?.getAll === 'function'
      ? worldThreadState
          .getAll()
          .filter((thread) => thread.sessionId === sessionId)
      : [];

  const ws =
    typeof worldState?.getWorldState === 'function'
      ? worldState.getWorldState(worldId)
      : undefined;

  let loreContext = '';
  try {
    loreContext = getLoreContextForPrompt(worldId, sessionId);
  } catch {
    loreContext = '';
  }

  const npcs =
    typeof npcState?.getNPCsByWorld === 'function'
      ? npcState.getNPCsByWorld(worldId)
      : [];

  const decisions =
    typeof narrativeState?.getSessionDecisions === 'function'
      ? narrativeState.getSessionDecisions(sessionId)
      : [];

  const snapshot: SessionSnapshot = {
    sessionId,
    worldId,
    characterId,
    turnIndex,
    segments: Object.freeze([...allSegments]) as readonly (typeof allSegments)[number][],
    decisions: Object.freeze([...decisions]),
    character: character
      ? (Object.freeze({ ...character }) as Readonly<typeof character>)
      : (Object.freeze({}) as Readonly<typeof character>),
    inventory: Object.freeze([...inventory]),
    worldThreads: Object.freeze([...worldThreads]),
    worldState: ws ? Object.freeze({ ...ws }) : undefined,
    loreContext,
    npcs: Object.freeze([...npcs]),
    conditions: Object.freeze([...conditions]),
    endedSessions: Object.freeze({ ...(narrativeState?.endedSessions ?? {}) }),
  };

  return snapshot;
}
