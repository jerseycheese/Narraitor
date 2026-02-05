import { WorldState, NPCRelationshipUpdate } from '@/types/world-state.types';
import { EntityID } from '@/types/common.types';
import { getTimestamp } from '@/lib/utils/timestamp';
import { normalizeRelationship, ensureState } from '../utils';

export const updateNPCRelationship = (
  worldId: EntityID,
  state: WorldState | undefined,
  npcId: EntityID,
  changes: NPCRelationshipUpdate,
  sessionId: EntityID,
): WorldState => {
  const currentState = ensureState(state, worldId);
  const normalized = normalizeRelationship(currentState.npcRelationships[npcId], changes, sessionId);
  const lastModified = getTimestamp();

  const nextState: WorldState = {
    ...currentState,
    version: currentState.version + 1,
    lastModified,
    npcRelationships: {
      ...currentState.npcRelationships,
      [npcId]: normalized,
    },
  };

  return nextState;
};
