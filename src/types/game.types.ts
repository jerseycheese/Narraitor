import { EntityID } from './common.types';

/**
 * Player choice interface
 */
export interface PlayerChoice {
  id: string;
  text: string;
  consequence?: string;
  isSelected: boolean;
}

/**
 * Game session state interface
 */
export interface GameSessionState {
  status: 'initializing' | 'loading' | 'active' | 'paused' | 'ended';
  currentSceneId: string | null;
  playerChoices: PlayerChoice[];
  error: string | null;
}

/**
 * Session store interface
 */
export interface SessionStore {
  // State properties
  status: GameSessionState['status'];
  currentSceneId: string | null;
  playerChoices: PlayerChoice[];
  error: string | null;
  worldId: EntityID | null;
  
  // Actions
  initializeSession: (worldId: EntityID, onComplete?: () => void) => Promise<void>;
  endSession: () => void;
  setStatus: (status: GameSessionState['status']) => void;
  setError: (error: string | null) => void;
  setPlayerChoices: (choices: PlayerChoice[]) => void;
  selectChoice: (choiceId: string) => void;
  clearPlayerChoices: () => void;
  setCurrentScene: (sceneId: string | null) => void;
  pauseSession: () => void;
  resumeSession: () => void;
}
