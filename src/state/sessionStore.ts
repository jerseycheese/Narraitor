import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SessionStore } from '../types/game.types';
import Logger from '@/lib/utils/logger';
import { createIndexedDBStorage } from './persistence';

/**
 * Create logger instance for this store
 */
const logger = new Logger('SessionStore');

/**
 * Initial state for the session store
 */
const initialState = {
  id: null,
  status: 'initializing' as const,
  currentSceneId: null,
  playerChoices: [],
  error: null,
  worldId: null,
  characterId: null,
  // Add saved sessions map
  savedSessions: {} as Record<string, {
    id: string;
    worldId: string;
    characterId: string;
    lastPlayed: string;
    narrativeCount: number;
  }>,
};

/**
 * Session store for managing game session state with persistence
 */
export const sessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
  ...initialState,

  // Initialize a new game session
  initializeSession: async (worldId, characterId, onComplete) => {
    logger.debug('Initializing session for worldId:', worldId, 'characterId:', characterId);
    set(state => {
      logger.debug('Setting loading state from:', state);
      return { status: 'loading', worldId, characterId, error: null };
    });
    
    try {
      // Simulate loading time for development
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logger.debug('Session loaded, setting active state');
      set(state => {
        logger.debug('Current state before setting active:', state);
        return { 
          status: 'active',
          currentSceneId: 'initial-scene',
          playerChoices: [], // Empty player choices - will be populated by AI choice generator
          error: null,
        };
      });
      
      logger.debug('State updated to active:', get());
      
      if (onComplete) {
        logger.debug('Calling onComplete callback');
        onComplete();
      }
    } catch (error) {
      logger.error('Error initializing session:', error);
      set({ 
        status: 'initializing',
        error: error instanceof Error ? error.message : 'Failed to initialize session',
      });
    }
  },

  // End the current session (save it instead of destroying)
  endSession: () => {
    const state = get();
    if (state.id && state.worldId && state.characterId) {
      logger.debug('Saving session before ending:', state.id);
      
      // Save session info without narrative count for now
      // We'll update it separately to avoid circular dependency
      const sessionId = state.id!;
      set(prevState => {
        const newSavedSessions = {
          ...prevState.savedSessions,
          [sessionId]: {
            id: sessionId,
            worldId: state.worldId!,
            characterId: state.characterId!,
            lastPlayed: new Date().toISOString(),
            narrativeCount: 0, // Will be updated by narrative store
          }
        };
        
        logger.debug('Saving session:', sessionId, 'Total saved sessions:', Object.keys(newSavedSessions).length);
        
        return {
          ...initialState,
          savedSessions: newSavedSessions
        };
      });
    } else {
      // Keep savedSessions when resetting
      set(prevState => ({
        ...initialState,
        savedSessions: prevState.savedSessions
      }));
    }
  },

  // Set session status
  setStatus: (status) => {
    logger.debug('Setting status to:', status);
    set({ status });
  },

  // Set error message
  setError: (error) => {
    logger.debug('Setting error:', error);
    set({ error });
  },

  // Set player choices
  setPlayerChoices: (choices) => {
    logger.debug('Setting player choices:', choices);
    set({ playerChoices: choices });
  },

  // Select a player choice
  selectChoice: (choiceId) => {
    logger.debug('Selecting choice:', choiceId);
    const { playerChoices } = get();
    const updatedChoices = playerChoices.map(choice => ({
      ...choice,
      isSelected: choice.id === choiceId,
    }));
    
    set({ playerChoices: updatedChoices });
  },

  // Clear player choices
  clearPlayerChoices: () => {
    logger.debug('Clearing player choices');
    set({ playerChoices: [] });
  },

  // Set current scene
  setCurrentScene: (sceneId) => {
    logger.debug('Setting current scene:', sceneId);
    set({ currentSceneId: sceneId });
  },

  // Pause the session
  pauseSession: () => {
    logger.debug('Pausing session');
    set({ status: 'paused' });
  },

  // Resume the session from paused state
  resumeSession: () => {
    logger.debug('Resuming session from paused state');
    set({ status: 'active' });
  },
  
  // Set session ID
  setSessionId: (id) => {
    logger.debug('Setting session ID:', id);
    set({ id });
  },
  
  // Set character ID
  setCharacterId: (characterId: string) => {
    logger.debug('Setting character ID:', characterId);
    set({ characterId });
  },
  
  // Get saved session for a world/character combination
  getSavedSession: (worldId: string, characterId: string) => {
    const { savedSessions } = get();
    logger.debug('Looking for saved session:', { worldId, characterId, savedSessions });
    const found = Object.values(savedSessions).find(
      session => session.worldId === worldId && session.characterId === characterId
    );
    logger.debug('Found saved session:', found);
    return found;
  },
  
  // Resume a saved session
  resumeSavedSession: (sessionId: string) => {
    const { savedSessions } = get();
    const savedSession = savedSessions[sessionId];
    
    if (savedSession) {
      logger.debug('Resuming session:', sessionId);
      set({
        id: savedSession.id,
        worldId: savedSession.worldId,
        characterId: savedSession.characterId,
        status: 'active',
        currentSceneId: 'resumed-scene',
        playerChoices: [],
        error: null,
      });
      return true;
    }
    return false;
  },
  
  // Delete a saved session
  deleteSavedSession: (sessionId: string) => {
    logger.debug('Deleting saved session:', sessionId);
    set(state => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [sessionId]: _, ...remainingSessions } = state.savedSessions;
      return { savedSessions: remainingSessions };
    });
  },
  
  // Update narrative count for a saved session
  updateSavedSessionNarrativeCount: (sessionId: string, narrativeCount: number) => {
    logger.debug('Updating narrative count for session:', sessionId, narrativeCount);
    set(state => {
      if (state.savedSessions[sessionId]) {
        return {
          savedSessions: {
            ...state.savedSessions,
            [sessionId]: {
              ...state.savedSessions[sessionId],
              narrativeCount
            }
          }
        };
      }
      return state;
    });
  },
}),
{
  name: 'narraitor-session-store',
  storage: createIndexedDBStorage(),
  version: 1,
  // Only persist saved sessions, not active session state
  partialize: (state) => ({ savedSessions: state.savedSessions }),
}
));
