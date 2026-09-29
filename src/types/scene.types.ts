import type { EntityID } from './common.types';

export interface CompletedSceneBeat {
  id: EntityID;
  text: string;
  turnIndex: number;
}

/** Facts established for one session's current scene. */
export interface SceneState {
  location: string | null;
  presentNpcIds: readonly EntityID[];
  completedBeats: readonly Readonly<CompletedSceneBeat>[];
}
