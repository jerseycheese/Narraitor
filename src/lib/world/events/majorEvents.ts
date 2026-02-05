import { WorldState, WorldStateMajorEvent } from '@/types/world-state.types';
import { EntityID } from '@/types/common.types';
import { getTimestamp } from '@/lib/utils/timestamp';
import { ensureState, mergeEvents } from '../utils';

export const recordMajorEvent = (
  worldId: EntityID,
  state: WorldState | undefined,
  event: Omit<WorldStateMajorEvent, 'sessionId'>,
  sessionId: EntityID,
): WorldState => {
  const currentState = ensureState(state, worldId);
  const timestamp = event.timestamp ?? getTimestamp();
  const nextEvent: WorldStateMajorEvent = { ...event, timestamp, sessionId };
  const lastModified = getTimestamp();

  const nextState: WorldState = {
    ...currentState,
    version: currentState.version + 1,
    lastModified,
    majorEvents: mergeEvents(currentState.majorEvents, [nextEvent]),
  };

  return nextState;
};
