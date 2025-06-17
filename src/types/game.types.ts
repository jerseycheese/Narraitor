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
  id?: string | null;
  status: 'initializing' | 'loading' | 'active' | 'paused' | 'ended';
  currentSceneId: string | null;
  playerChoices: PlayerChoice[];
  error: string | null;
}

/**
 * Saved session info
 */
export interface SavedSessionInfo {
  id: string;
  worldId: string;
  characterId: string;
  lastPlayed: string;
  narrativeCount: number;
}

/**
 * Auto-save status and metadata
 */
export interface AutoSaveState {
  enabled: boolean;
  lastSaveTime: string | null;
  status: 'idle' | 'saving' | 'saved' | 'error';
  errorMessage: string | null;
  totalSaves: number;
}

/**
 * Session store interface
 */
export interface SessionStore {
  // State properties
  id: string | null;
  status: GameSessionState['status'];
  currentSceneId: string | null;
  playerChoices: PlayerChoice[];
  error: string | null;
  worldId: EntityID | null;
  characterId: EntityID | null;
  savedSessions: Record<string, SavedSessionInfo>;
  autoSave: AutoSaveState;
  
  // Actions
  initializeSession: (worldId: EntityID, characterId: EntityID, onComplete?: () => void) => Promise<void>;
  endSession: () => void;
  setStatus: (status: GameSessionState['status']) => void;
  setError: (error: string | null) => void;
  setPlayerChoices: (choices: PlayerChoice[]) => void;
  selectChoice: (choiceId: string) => void;
  clearPlayerChoices: () => void;
  setCurrentScene: (sceneId: string | null) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  setSessionId: (id: string) => void;
  setCharacterId: (characterId: EntityID) => void;
  getSavedSession: (worldId: string, characterId: string) => SavedSessionInfo | undefined;
  resumeSavedSession: (sessionId: string) => boolean;
  deleteSavedSession: (sessionId: string) => void;
  updateSavedSessionNarrativeCount: (sessionId: string, narrativeCount: number) => void;
  
  // Auto-save actions
  setAutoSaveEnabled: (enabled: boolean) => void;
  updateAutoSaveStatus: (status: AutoSaveState['status'], errorMessage?: string) => void;
  recordAutoSave: (timestamp: string) => void;
}
