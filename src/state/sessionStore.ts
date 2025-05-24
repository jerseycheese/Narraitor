import { create } from 'zustand';
import { SessionStore } from '../types/game.types';
import Logger from '@/lib/utils/logger';

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
};

/**
 * Session store for managing game session state
 */
export const sessionStore = create<SessionStore>((set, get) => ({
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

  // End the current session
  endSession: () => {
    logger.debug('Ending session, resetting to initial state');
    set(initialState);
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

  // Resume the session
  resumeSession: () => {
    logger.debug('Resuming session');
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
}));
