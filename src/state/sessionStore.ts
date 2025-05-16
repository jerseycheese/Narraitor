import { create } from 'zustand';
import { SessionStore } from '../types/game.types';

/**
 * Debug logging utility for sessionStore - only logs in development
 */
const debugLog = (message: string, data?: unknown) => {
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true') {
    console.log(`[SessionStore] ${message}`, data);
  }
};

/**
 * Initial state for the session store
 */
const initialState = {
  status: 'initializing' as const,
  currentSceneId: null,
  playerChoices: [],
  error: null,
  worldId: null,
};

/**
 * Session store for managing game session state
 */
export const sessionStore = create<SessionStore>((set, get) => ({
  ...initialState,

  // Initialize a new game session
  initializeSession: async (worldId, onComplete) => {
    debugLog('Initializing session for worldId:', worldId);
    set(state => {
      debugLog('Setting loading state from:', state);
      return { status: 'loading', worldId, error: null };
    });
    
    try {
      // Simulate loading time for development
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      debugLog('Session loaded, setting active state');
      set(state => {
        debugLog('Current state before setting active:', state);
        return { 
          status: 'active',
          currentSceneId: 'initial-scene',
          playerChoices: [
            { id: 'choice-1', text: 'Option 1', isSelected: false },
            { id: 'choice-2', text: 'Option 2', isSelected: false },
          ],
          error: null,
        };
      });
      
      debugLog('State updated to active:', get());
      
      if (onComplete) {
        debugLog('Calling onComplete callback');
        onComplete();
      }
    } catch (error) {
      console.error('[SessionStore] Error initializing session:', error);
      set({ 
        status: 'initializing',
        error: error instanceof Error ? error.message : 'Failed to initialize session',
      });
    }
  },

  // End the current session
  endSession: () => {
    debugLog('Ending session, resetting to initial state');
    set(initialState);
  },

  // Set session status
  setStatus: (status) => {
    debugLog('Setting status to:', status);
    set({ status });
  },

  // Set error message
  setError: (error) => {
    debugLog('Setting error:', error);
    set({ error });
  },

  // Set player choices
  setPlayerChoices: (choices) => {
    debugLog('Setting player choices:', choices);
    set({ playerChoices: choices });
  },

  // Select a player choice
  selectChoice: (choiceId) => {
    debugLog('Selecting choice:', choiceId);
    const { playerChoices } = get();
    const updatedChoices = playerChoices.map(choice => ({
      ...choice,
      isSelected: choice.id === choiceId,
    }));
    
    set({ playerChoices: updatedChoices });
  },

  // Clear player choices
  clearPlayerChoices: () => {
    debugLog('Clearing player choices');
    set({ playerChoices: [] });
  },

  // Set current scene
  setCurrentScene: (sceneId) => {
    debugLog('Setting current scene:', sceneId);
    set({ currentSceneId: sceneId });
  },

  // Pause the session
  pauseSession: () => {
    debugLog('Pausing session');
    set({ status: 'paused' });
  },

  // Resume the session
  resumeSession: () => {
    debugLog('Resuming session');
    set({ status: 'active' });
  },
}));
