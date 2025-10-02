import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SessionStore, TemplateHistoryEntry } from '../types/game.types';
import Logger from '@/lib/utils/logger';
import { createIndexedDBStorage } from './persistence';
import { formatSessionDuration, calculateNextSessionNumber } from '@/lib/utils/sessionUtils';
import { getTimestamp } from '@/lib/utils';

/**
 * Create logger instance for this store
 */
const logger = new Logger('SessionStore');

/**
 * Cached store modules to avoid repeated dynamic imports
 */
let journalStoreModule: typeof import('./journalStore') | null = null;
let worldStoreModule: typeof import('./worldStore') | null = null;
let characterStoreModule: typeof import('./characterStore') | null = null;
let narrativeStoreModule: typeof import('./narrativeStore') | null = null;

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
  templateHistory: [] as TemplateHistoryEntry[],
  // Auto-save state
  autoSave: {
    enabled: true,
    lastSaveTime: null,
    status: 'idle' as const,
    errorMessage: null,
    totalSaves: 0,
  },
  // UI state
  narrativeHeight: 600, // Default height for narrative container
  // Onboarding state
  onboardingCompleted: false,
};

/**
 * Session store for managing game session state with persistence
 */
export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
  ...initialState,

  // Initialize a new game session
  initializeSession: async (worldId, characterId, onComplete, force = false) => {
    const currentState = get();

    logger.debug('TARGET: initializeSession called:', {
      worldId,
      characterId,
      force,
      currentState: {
        id: currentState.id,
        status: currentState.status,
        worldId: currentState.worldId,
        characterId: currentState.characterId
      }
    });

    // Don't initialize if we already have an active session for the same world/character
    // unless force is true (for fresh sessions)
    if (!force && currentState.status === 'active' &&
        currentState.worldId === worldId &&
        currentState.characterId === characterId) {
      logger.debug('Session already active for this world/character, skipping initialization');
      if (onComplete) onComplete();
      return;
    }
    
    logger.debug('Initializing session for worldId:', worldId, 'characterId:', characterId);
    
    // Generate a new session ID for fresh sessions or when changing characters
    const isNewCharacterSession = currentState.characterId !== characterId;
    const sessionId = (isNewCharacterSession || !currentState.id) 
      ? `session-${worldId}-${characterId}-${Date.now()}` 
      : currentState.id;
    logger.debug('🆔 Using session ID:', sessionId, { isNewCharacterSession, previousCharacterId: currentState.characterId });
    
    // Clear narrative data only for the new session to prevent inheritance
    // IMPORTANT: We preserve old session data when changing characters to avoid data loss
    if (sessionId && (isNewCharacterSession || !currentState.id)) {
      try {
        const { useNarrativeStore } = await import('./narrativeStore');
        const narrativeStore = useNarrativeStore.getState();

        // CHANGED: We no longer clear old session data when changing characters
        // The old session data is preserved so users can return to it later
        if (isNewCharacterSession && currentState.id) {
          // Save the current session before switching (but don't clear its data)
          logger.debug('💾 Preserving old session data for potential return:', currentState.id);
          // The old session data remains intact in the narrative store
        }

        // Only clear data for the new session if it exists (to start fresh)
        const existingSegments = narrativeStore.getSessionSegments(sessionId);
        if (existingSegments.length > 0) {
          narrativeStore.clearSessionSegments(sessionId);
          narrativeStore.clearSessionDecisions(sessionId);
          logger.debug('🧹 Cleared existing data for session:', sessionId);
        }

        // Always clear any global ending state
        narrativeStore.clearEnding();
        logger.debug('🧹 Cleared global ending state for new session:', sessionId);
      } catch (error) {
        logger.warn('Failed to clear narrative data:', error);
      }
    }
    
    set(state => {
      logger.debug('Setting loading state from:', state);
      return { 
        id: sessionId,
        status: 'loading', 
        worldId, 
        characterId, 
        error: null 
      };
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
      
      // Create session start journal entry (Issue #176)
      try {
        // Cache imported store modules to avoid repeated dynamic imports
        if (!journalStoreModule) {
          journalStoreModule = await import('./journalStore');
        }
        if (!worldStoreModule) {
          worldStoreModule = await import('./worldStore');
        }
        if (!characterStoreModule) {
          characterStoreModule = await import('./characterStore');
        }
        
        const { useJournalStore } = journalStoreModule;
        const { useWorldStore } = worldStoreModule;
        const { useCharacterStore } = characterStoreModule;
        
        const journalStore = useJournalStore.getState();
        const worldStore = useWorldStore.getState();
        const characterStore = useCharacterStore.getState();
        
        const world = worldStore.worlds[worldId];
        const character = characterStore.characters[characterId];
        
        const sessionStartTime = getTimestamp();
        
        // Get all journal entries to calculate session number
        const allEntries = Object.values(journalStore.entries).flat();
        const sessionNumber = calculateNextSessionNumber(allEntries);
        
        journalStore.addEntry(sessionId, {
          type: 'session_start',
          worldId,
          characterId,
          title: 'Adventure Begins',
          content: `A new journey starts${world ? ` in ${world.name}` : ''}`,
          significance: 'minor' as const,
          isRead: false,
          relatedEntities: [],
          metadata: {
            tags: ['system', 'session'],
            automaticEntry: true,
            sessionStartTime,
            sessionContext: {
              worldName: world?.name || 'Unknown World',
              characterName: character?.name || 'Unknown Character',
              sessionNumber
            }
          },
          updatedAt: sessionStartTime
        });
        
        logger.debug('📓 Session start journal entry created');
      } catch (error) {
        logger.warn('Failed to create session start journal entry:', error);
      }
      
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
  endSession: async () => {
    const state = get();
    
    // Add stack trace to debug unexpected calls
    const stack = new Error().stack;
    logger.debug('🔚 endSession called:', {
      currentId: state.id,
      status: state.status,
      worldId: state.worldId,
      characterId: state.characterId,
      stack: stack?.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
    });
    
    if (state.id && state.worldId && state.characterId) {
      logger.debug('Saving session before ending:', state.id);
      
      // Create session end journal entry (Issue #176)
      try {
        const sessionEndTime = getTimestamp();
        const sessionId = state.id;
        
        // Calculate session duration by looking for session start entry
        let sessionDuration = 0;
        try {
          // Use cached imports to improve performance
          if (!journalStoreModule) {
            journalStoreModule = await import('./journalStore');
          }
          if (!worldStoreModule) {
            worldStoreModule = await import('./worldStore');
          }
          if (!characterStoreModule) {
            characterStoreModule = await import('./characterStore');
          }
          if (!narrativeStoreModule) {
            narrativeStoreModule = await import('./narrativeStore');
          }
          
          const { useJournalStore } = journalStoreModule;
          const { useWorldStore } = worldStoreModule;
          const { useCharacterStore } = characterStoreModule;
          const { useNarrativeStore } = narrativeStoreModule;
          
          const journalStore = useJournalStore.getState();
          const sessionEntries = journalStore.getSessionEntries(sessionId);
          
          const sessionStartEntry = sessionEntries.find(entry => entry.type === 'session_start');
          if (sessionStartEntry?.metadata.sessionStartTime) {
            const startTime = new Date(sessionStartEntry.metadata.sessionStartTime);
            const endTime = new Date(sessionEndTime);
            sessionDuration = endTime.getTime() - startTime.getTime();
          }
          
          const worldStore = useWorldStore.getState();
          const characterStore = useCharacterStore.getState();
          const narrativeStore = useNarrativeStore.getState();
          
          const world = worldStore.worlds[state.worldId];
          const character = characterStore.characters[state.characterId];
          const narrativeSegments = narrativeStore.getSessionSegments(sessionId);
          
          const durationText = sessionDuration > 0 ? formatSessionDuration(sessionDuration) : 'unknown duration';
          const segmentCount = narrativeSegments.length;
          
          journalStore.addEntry(sessionId, {
            type: 'session_end',
            worldId: state.worldId,
            characterId: state.characterId,
            title: 'Adventure Concluded',
            content: `Session completed after ${durationText}${segmentCount > 0 ? ` with ${segmentCount} story segment${segmentCount !== 1 ? 's' : ''}` : ''}`,
            significance: 'minor' as const,
            isRead: false,
            relatedEntities: [],
            metadata: {
              tags: ['system', 'session'],
              automaticEntry: true,
              sessionDuration,
              sessionContext: {
                worldName: world?.name || 'Unknown World',
                characterName: character?.name || 'Unknown Character',
                sessionNumber: sessionStartEntry?.metadata.sessionContext?.sessionNumber ?? calculateNextSessionNumber(Object.values(journalStore.entries).flat())
              }
            },
            updatedAt: sessionEndTime
          });
          
          logger.debug('📓 Session end journal entry created with duration:', durationText);
        } catch (journalError) {
          logger.warn('Failed to access journal store for session end entry:', journalError);
        }
      } catch (error) {
        logger.warn('Failed to create session end journal entry:', error);
      }
      
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
            lastPlayed: getTimestamp(),
            narrativeCount: 0, // Will be updated by narrative store
          }
        };
        
        logger.debug('🔚 Saving session and resetting state:', sessionId, 'Total saved sessions:', Object.keys(newSavedSessions).length);
        
        return {
          ...initialState,
          savedSessions: newSavedSessions,
          onboardingCompleted: prevState.onboardingCompleted
        };
      });
    } else {
      logger.debug('🔚 No active session to save, just resetting state');
      // Keep savedSessions and onboarding state when resetting
      set(prevState => ({
        ...initialState,
        savedSessions: prevState.savedSessions,
        onboardingCompleted: prevState.onboardingCompleted
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

  // Template history actions
  addTemplateToHistory: (entry: TemplateHistoryEntry) => {
    logger.debug('Adding template to history:', entry.template.name);
    set(state => {
      const newHistory = [entry, ...state.templateHistory].slice(0, 5); // Keep only last 5
      return { templateHistory: newHistory };
    });
  },

  getTemplateHistory: () => {
    return get().templateHistory;
  },

  clearTemplateHistory: () => {
    logger.debug('Clearing template history');
    set({ templateHistory: [] });
  },

  // Auto-save methods
  setAutoSaveEnabled: (enabled: boolean) => {
    logger.debug('Setting auto-save enabled:', enabled);
    set(state => ({
      autoSave: {
        ...state.autoSave,
        enabled
      }
    }));
  },

  updateAutoSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error', errorMessage?: string) => {
    logger.debug('Updating auto-save status:', status, errorMessage);
    set(state => ({
      autoSave: {
        ...state.autoSave,
        status,
        errorMessage: errorMessage || null
      }
    }));
  },

  recordAutoSave: (timestamp: string) => {
    logger.debug('Recording auto-save at:', timestamp);
    set(state => ({
      autoSave: {
        ...state.autoSave,
        lastSaveTime: timestamp,
        status: 'saved' as const,
        totalSaves: state.autoSave.totalSaves + 1,
        errorMessage: null
      }
    }));
  },
  
  // Onboarding actions
  setOnboardingCompleted: (completed: boolean) => {
    logger.debug('Setting onboarding completed:', completed);
    set({ onboardingCompleted: completed });
  },
  
  isFirstTimeUser: () => {
    const state = get();
    return Object.keys(state.savedSessions).length === 0 && !state.onboardingCompleted;
  },
  
  // Fix existing session narrative counts by recalculating from narrative store
  fixExistingSessionNarrativeCounts: async () => {
    try {
      const { useNarrativeStore } = await import('./narrativeStore');
      const narrativeStore = useNarrativeStore.getState();
      const state = get();
      
      console.log('[SessionStore] Fixing narrative counts...');
      console.log('[SessionStore] Saved sessions:', Object.keys(state.savedSessions));
      console.log('[SessionStore] Narrative segments by session:', narrativeStore.sessionSegments);
      
      // Update each saved session's narrative count
      const updatedSessions = { ...state.savedSessions };
      let hasUpdates = false;
      
      for (const sessionId of Object.keys(updatedSessions)) {
        const sessionSegments = narrativeStore.sessionSegments[sessionId] || [];
        const actualCount = sessionSegments.length;
        const currentCount = updatedSessions[sessionId].narrativeCount;
        
        console.log(`[SessionStore] Session ${sessionId}: current count=${currentCount}, actual count=${actualCount}`);
        
        if (currentCount !== actualCount) {
          updatedSessions[sessionId] = {
            ...updatedSessions[sessionId],
            narrativeCount: actualCount
          };
          hasUpdates = true;
          logger.debug('Fixed narrative count for session:', sessionId, actualCount);
        }
      }
      
      if (hasUpdates) {
        set({ savedSessions: updatedSessions });
        logger.debug('Updated narrative counts for existing sessions');
      } else {
        console.log('[SessionStore] No updates needed');
      }
    } catch (error) {
      logger.error('Failed to fix existing session narrative counts:', error);
    }
  },

  shouldShowOnboarding: () => {
    const state = get();
    return Object.keys(state.savedSessions).length === 0 && !state.onboardingCompleted;
  },
}),
{
  name: 'narraitor-session-store',
  storage: createIndexedDBStorage(),
  version: 2,
  // Persist active session state to maintain continuity across browser refreshes
  partialize: (state) => ({ 
    savedSessions: state.savedSessions,
    templateHistory: state.templateHistory,
    // Persist active session state
    id: state.id,
    characterId: state.characterId,
    worldId: state.worldId,
    status: state.status,
    currentSceneId: state.currentSceneId,
    playerChoices: state.playerChoices,
    // Persist auto-save state
    autoSave: state.autoSave,
    // Persist onboarding state
    onboardingCompleted: state.onboardingCompleted
  }),
}
));

// Named export for consistent usage
// Also expose store globally for dev/test to allow direct state seeding
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).useSessionStore = useSessionStore;
}
