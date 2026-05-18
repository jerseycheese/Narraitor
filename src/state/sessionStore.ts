import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SessionStore, TemplateHistoryEntry } from '../types/game.types';
import { TutorialProgress, TutorialPhase } from '../types/tutorial.types';
import { EntityID } from '../types/common.types';
import { SessionLifecycleMetadata, SessionLifecycleStatus } from '../types/session.types';
import Logger from '@/lib/utils/logger';
import { createIndexedDBStorage } from './persistence';
import { formatSessionDuration, calculateNextSessionNumber } from '@/lib/utils/sessionUtils';
import { getTimestamp } from '@/lib/utils/timestamp';

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
let inventoryStoreModule: typeof import('./inventoryStore') | null = null;

const buildLifecycleMetadata = (
  params: {
    id: EntityID;
    worldId: EntityID;
    characterId: EntityID;
    status?: SessionLifecycleStatus;
    lastActivity?: string;
  }
): SessionLifecycleMetadata => ({
  id: params.id,
  worldId: params.worldId,
  characterId: params.characterId,
  status: params.status ?? 'active',
  lastActivity: params.lastActivity ?? getTimestamp(),
});

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
  sessionLifecycle: {} as Record<string, SessionLifecycleMetadata>,
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
  // Tutorial state
  tutorialProgress: {
    phases: {
      intro: { completed: false, skipped: false },
      worldCreation: { completed: false, skipped: false, lastStep: 0 },
      worldGeneration: { completed: false, skipped: false, lastStep: 0 },
      characterCreation: { completed: false, skipped: false, lastStep: 0, quickStartCompleted: false },
      firstPlay: { completed: false, skipped: false },
    },
    dismissedHints: [],
    lastActiveStep: null,
  } as TutorialProgress,
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


    // Don't initialize if we already have an active session for the same world/character
    // unless force is true (for fresh sessions)
    if (!force && currentState.status === 'active' &&
        currentState.worldId === worldId &&
        currentState.characterId === characterId) {
      if (onComplete) onComplete();
      return;
    }
    
    
    // Generate a new session ID for fresh sessions or when changing characters
    const isNewCharacterSession = currentState.characterId !== characterId;
    const sessionId = (isNewCharacterSession || !currentState.id) 
      ? `session-${worldId}-${characterId}-${Date.now()}` 
      : currentState.id;
    
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
          // The old session data remains intact in the narrative store
        }

        // Only clear data for the new session if it exists (to start fresh)
        const existingSegments = narrativeStore.getSessionSegments(sessionId);
        if (existingSegments.length > 0) {
          narrativeStore.clearSessionSegments(sessionId);
          narrativeStore.clearSessionDecisions(sessionId);
        }

        // Always clear any global ending state
        narrativeStore.clearEnding();
      } catch (error) {
        logger.warn('Failed to clear narrative data:', error);
      }
    }
    if (force) {
      try {
        if (!inventoryStoreModule) {
          inventoryStoreModule = await import('./inventoryStore');
        }
        const { useInventoryStore } = inventoryStoreModule;
        const clearInventory = () => {
          try {
            useInventoryStore.getState().clearCharacterInventory(characterId);
          } catch (clearError) {
            logger.warn('Failed to clear inventory for fresh session (during hydration callback):', clearError);
          }
        };

        const persistApi = (useInventoryStore as unknown as {
          persist?: {
            hasHydrated?: () => boolean;
            onFinishHydration?: (callback: () => void) => () => void;
          };
        }).persist;

        if (persistApi?.hasHydrated?.()) {
          clearInventory();
        } else if (persistApi?.onFinishHydration) {
          persistApi.onFinishHydration(clearInventory);
        } else {
          clearInventory();
        }
      } catch (error) {
        logger.warn('Failed to clear inventory for fresh session:', error);
      }
    }
    const lifecycleEntry: SessionLifecycleMetadata = {
      id: sessionId,
      worldId,
      characterId,
      status: 'active',
      lastActivity: getTimestamp(),
    };
    
    set(state => {
      return { 
        id: sessionId,
        status: 'loading', 
        worldId, 
        characterId, 
        error: null,
        sessionLifecycle: {
          ...state.sessionLifecycle,
          [sessionId]: lifecycleEntry,
        }
      };
    });
    
    try {
      // Simulate loading time for development
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const activationTimestamp = getTimestamp();
      set(state => {
        return { 
          status: 'active',
          currentSceneId: 'initial-scene',
          playerChoices: [], // Empty player choices - will be populated by AI choice generator
          error: null,
          sessionLifecycle: {
            ...state.sessionLifecycle,
            [sessionId]: {
              ...(state.sessionLifecycle[sessionId] ?? lifecycleEntry),
              status: 'active',
              worldId,
              characterId,
              lastActivity: activationTimestamp,
            }
          }
        };
      });
      
      
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
        
      } catch (error) {
        logger.warn('Failed to create session start journal entry:', error);
      }
      
      if (onComplete) {
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
    const lifecycleUpdateTime = getTimestamp();
    
    if (state.id && state.worldId && state.characterId) {
      
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
        
        const previousMetadata = prevState.sessionLifecycle[sessionId];
        const updatedLifecycle: Record<string, SessionLifecycleMetadata> = {
          ...prevState.sessionLifecycle,
          [sessionId]: {
            ...(previousMetadata ?? {
              id: sessionId,
              worldId: state.worldId!,
              characterId: state.characterId!,
              status: 'active',
              lastActivity: lifecycleUpdateTime,
            }),
            status: 'ended',
            worldId: state.worldId!,
            characterId: state.characterId!,
            lastActivity: lifecycleUpdateTime,
          },
        };
        
        return {
          ...initialState,
          savedSessions: newSavedSessions,
          tutorialProgress: prevState.tutorialProgress,
          sessionLifecycle: updatedLifecycle
        };
      });
    } else {
      // Keep savedSessions and onboarding state when resetting
      set(prevState => ({
        ...initialState,
        savedSessions: prevState.savedSessions,
        tutorialProgress: prevState.tutorialProgress,
        sessionLifecycle: prevState.sessionLifecycle
      }));
    }
  },

  // Set session status
  setStatus: (status) => {
    set({ status });
  },

  // Set error message
  setError: (error) => {
    set({ error });
  },

  // Set player choices
  setPlayerChoices: (choices) => {
    set({ playerChoices: choices });
  },

  // Select a player choice
  selectChoice: (choiceId) => {
    const { playerChoices } = get();
    const updatedChoices = playerChoices.map(choice => ({
      ...choice,
      isSelected: choice.id === choiceId,
    }));
    
    set({ playerChoices: updatedChoices });
  },

  // Clear player choices
  clearPlayerChoices: () => {
    set({ playerChoices: [] });
  },

  // Set current scene
  setCurrentScene: (sceneId) => {
    set({ currentSceneId: sceneId });
  },

  // Pause the session
  pauseSession: () => {
    set({ status: 'paused' });
  },

  // Resume the session from paused state
  resumeSession: () => {
    set({ status: 'active' });
  },
  
  // Set session ID
  setSessionId: (id) => {
    set({ id });
  },
  
  // Set character ID
  setCharacterId: (characterId: string) => {
    set({ characterId });
  },
  
  // Get saved session for a world/character combination
  getSavedSession: (worldId: string, characterId: string) => {
    const { savedSessions } = get();
    const found = Object.values(savedSessions).find(
      session => session.worldId === worldId && session.characterId === characterId
    );
    return found;
  },
  
  // Resume a saved session
  resumeSavedSession: (sessionId: string) => {
    const { savedSessions } = get();
    const savedSession = savedSessions[sessionId];

    if (savedSession) {
      const activationTimestamp = getTimestamp();
      set(state => {
        const nextLifecycle: Record<string, SessionLifecycleMetadata> = {
          ...state.sessionLifecycle,
          [sessionId]: {
            ...(
              state.sessionLifecycle[sessionId] ??
              buildLifecycleMetadata({
                id: sessionId,
                worldId: savedSession.worldId,
                characterId: savedSession.characterId,
                status: 'active',
                lastActivity: activationTimestamp,
              })
            ),
            worldId: savedSession.worldId,
            characterId: savedSession.characterId,
            status: 'active' as SessionLifecycleStatus,
            lastActivity: activationTimestamp,
          }
        };

        return {
          id: savedSession.id,
          worldId: savedSession.worldId,
          characterId: savedSession.characterId,
          status: 'active',
          currentSceneId: 'resumed-scene',
          playerChoices: [],
          error: null,
          sessionLifecycle: nextLifecycle,
        };
      });
      return true;
    }
    return false;
  },
  
  // Delete a saved session
  deleteSavedSession: (sessionId: string) => {
    set(state => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [sessionId]: _, ...remainingSessions } = state.savedSessions;
      const lifecycleEntry = state.sessionLifecycle[sessionId];
      const updatedLifecycle = lifecycleEntry
        ? {
            ...state.sessionLifecycle,
            [sessionId]: {
              ...lifecycleEntry,
              status: 'abandoned' as SessionLifecycleStatus,
              lastActivity: getTimestamp(),
            },
          }
        : state.sessionLifecycle;
      return { 
        savedSessions: remainingSessions,
        sessionLifecycle: updatedLifecycle
      };
    });
  },
  
  // Update narrative count for a saved session
  // Also creates the saved session entry if it doesn't exist yet
  // This ensures sessions are saved when narrative content is added during gameplay,
  // not only when explicitly ended
  updateSavedSessionNarrativeCount: (sessionId: string, narrativeCount: number) => {
    set(state => {
      const timestamp = getTimestamp();
      // If session doesn't exist in savedSessions yet, create it
      if (!state.savedSessions[sessionId] && state.id === sessionId) {
        if (!state.worldId || !state.characterId) {
          logger.warn(
            'Skipping saved session creation for',
            sessionId,
            'because world or character context is missing'
          );
          return state;
        }
        // This is the active session - save it for the first time
        const nextLifecycle: Record<string, SessionLifecycleMetadata> = {
          ...state.sessionLifecycle,
          [sessionId]: {
            ...(
              state.sessionLifecycle[sessionId] ??
              buildLifecycleMetadata({
                id: sessionId,
                worldId: state.worldId!,
                characterId: state.characterId!,
                status: 'active',
                lastActivity: timestamp,
              })
            ),
            status: 'active' as SessionLifecycleStatus,
            lastActivity: timestamp,
          }
        };

        return {
          savedSessions: {
            ...state.savedSessions,
            [sessionId]: {
              id: sessionId,
              worldId: state.worldId!,
              characterId: state.characterId!,
              lastPlayed: timestamp,
              narrativeCount
            }
          },
          sessionLifecycle: nextLifecycle,
        };
      }

      // Session already exists - just update the count and timestamp
      const savedSession = state.savedSessions[sessionId];
      if (!savedSession) {
        return state;
      }

      const nextLifecycle: Record<string, SessionLifecycleMetadata> = {
        ...state.sessionLifecycle,
        [sessionId]: {
          ...(
            state.sessionLifecycle[sessionId] ??
            buildLifecycleMetadata({
              id: sessionId,
              worldId: savedSession.worldId,
              characterId: savedSession.characterId,
              status: 'active',
              lastActivity: timestamp,
            })
          ),
          status: 'active' as SessionLifecycleStatus,
          lastActivity: timestamp,
        }
      };

      return {
        savedSessions: {
          ...state.savedSessions,
          [sessionId]: {
            ...savedSession,
            narrativeCount,
            lastPlayed: timestamp // Update lastPlayed on each segment
          }
        },
        sessionLifecycle: nextLifecycle,
      };
    });
  },

  upsertSessionLifecycle: (metadata: SessionLifecycleMetadata) => {
    set(state => ({
      sessionLifecycle: {
        ...state.sessionLifecycle,
        [metadata.id]: {
          ...metadata,
          lastActivity: metadata.lastActivity ?? getTimestamp(),
        }
      }
    }));
  },

  setSessionLifecycleStatus: (sessionId: string, status: SessionLifecycleStatus) => {
    set(state => {
      const existing = state.sessionLifecycle[sessionId];
      if (!existing) {
        logger.warn('Cannot update lifecycle status for unknown session:', sessionId);
        return {};
      }

      return {
        sessionLifecycle: {
          ...state.sessionLifecycle,
          [sessionId]: {
            ...existing,
            status,
            lastActivity: getTimestamp(),
          }
        }
      };
    });
  },

  getSessionLifecycle: (sessionId: string) => {
    return get().sessionLifecycle[sessionId];
  },

  // Template history actions
  addTemplateToHistory: (entry: TemplateHistoryEntry) => {
    set(state => {
      const newHistory = [entry, ...state.templateHistory].slice(0, 5); // Keep only last 5
      return { templateHistory: newHistory };
    });
  },

  getTemplateHistory: () => {
    return get().templateHistory;
  },

  clearTemplateHistory: () => {
    set({ templateHistory: [] });
  },

  // Auto-save methods
  setAutoSaveEnabled: (enabled: boolean) => {
    set(state => ({
      autoSave: {
        ...state.autoSave,
        enabled
      }
    }));
  },

  updateAutoSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error', errorMessage?: string) => {
    set(state => ({
      autoSave: {
        ...state.autoSave,
        status,
        errorMessage: errorMessage || null
      }
    }));
  },

  recordAutoSave: (timestamp: string) => {
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
  
  // Tutorial actions
  updateTutorialProgress: (phase, updates) => {
    set(state => ({
      tutorialProgress: {
        ...state.tutorialProgress,
        phases: {
          ...state.tutorialProgress.phases,
          [phase]: {
            ...state.tutorialProgress.phases[phase],
            ...updates
          }
        }
      }
    }));
  },

  dismissTutorialHint: (hintId) => {
    set(state => {
      if (state.tutorialProgress.dismissedHints.includes(hintId)) return state;
      return {
        tutorialProgress: {
          ...state.tutorialProgress,
          dismissedHints: [...state.tutorialProgress.dismissedHints, hintId]
        }
      };
    });
  },

  resetTutorialProgress: () => {
    set({
      tutorialProgress: {
        phases: {
          intro: { completed: false, skipped: false },
          worldCreation: { completed: false, skipped: false, lastStep: 0 },
          worldGeneration: { completed: false, skipped: false, lastStep: 0 },
          characterCreation: { completed: false, skipped: false, lastStep: 0 },
          firstPlay: { completed: false, skipped: false },
        },
        dismissedHints: [],
        lastActiveStep: null,
      }
    });
  },

  completeTutorialPhase: (phase) => {
    set(state => ({
      tutorialProgress: {
        ...state.tutorialProgress,
        phases: {
          ...state.tutorialProgress.phases,
          [phase]: {
            ...state.tutorialProgress.phases[phase],
            completed: true
          }
        }
      }
    }));
  },

  // Tutorial selectors (computed)
  shouldShowTutorialPhase: (phase) => {
    const { tutorialProgress } = get();
    return !tutorialProgress.phases[phase].completed && !tutorialProgress.phases[phase].skipped;
  },

  isTutorialComplete: () => {
    const { tutorialProgress } = get();
    return Object.values(tutorialProgress.phases).every(p => p.completed || p.skipped);
  },

  getCurrentTutorialPhase: () => {
    const { tutorialProgress } = get();
    const phases: TutorialPhase[] = ['intro', 'worldCreation', 'worldGeneration', 'characterCreation', 'firstPlay'];
    return phases.find(p => !tutorialProgress.phases[p].completed && !tutorialProgress.phases[p].skipped) || null;
  },

  isFirstTimeUser: () => {
    const state = get();
    // Consider a user "first time" if they haven't completed the intro phase
    return !state.tutorialProgress.phases.intro.completed && !state.tutorialProgress.phases.intro.skipped;
  },
  
  // Fix existing session narrative counts by recalculating from narrative store
  fixExistingSessionNarrativeCounts: async () => {
    try {
      const { useNarrativeStore } = await import('./narrativeStore');
      const narrativeStore = useNarrativeStore.getState();
      const state = get();
      
      // Update each saved session's narrative count
      const updatedSessions = { ...state.savedSessions };
      let hasUpdates = false;

      for (const sessionId of Object.keys(updatedSessions)) {
        const sessionSegments = narrativeStore.sessionSegments[sessionId] || [];
        const actualCount = sessionSegments.length;
        const currentCount = updatedSessions[sessionId].narrativeCount;
        
        if (currentCount !== actualCount) {
          updatedSessions[sessionId] = {
            ...updatedSessions[sessionId],
            narrativeCount: actualCount
          };
          hasUpdates = true;
        }
      }
      
      if (hasUpdates) {
        set({ savedSessions: updatedSessions });
      }
    } catch (error) {
      logger.error('Failed to fix existing session narrative counts:', error);
    }
  },

  shouldShowOnboarding: () => {
    // Show onboarding if intro phase is not complete/skipped
    return get().isFirstTimeUser();
  },
}),
{
  name: 'narraitor-session-store',
  storage: createIndexedDBStorage(),
  version: 4,
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
    // Persist tutorial state
    tutorialProgress: state.tutorialProgress
  }),
  migrate: (persistedState: unknown, version?: number) => {
    try {
      const nextState = persistedState as Partial<SessionStore>;

      // Migration from v2 to v3: Add tutorialProgress
      // CLEAN BREAK: No backward compatibility - all users get fresh tutorial state
      if (typeof version === 'number' && version < 3) {
        nextState.tutorialProgress = {
          phases: {
            intro: { completed: false, skipped: false },
            worldCreation: { completed: false, skipped: false, lastStep: 0 },
            worldGeneration: { completed: false, skipped: false, lastStep: 0 },
            characterCreation: { completed: false, skipped: false, lastStep: 0, quickStartCompleted: false },
            firstPlay: { completed: false, skipped: false },
          },
          dismissedHints: [],
          lastActiveStep: null,
        };
        // Remove old onboarding flag - replaced by tutorialProgress
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (nextState as any).onboardingCompleted;
      }
      
      // Migration from v3 to v4: Add worldGeneration phase
      if (typeof version === 'number' && version < 4 && nextState.tutorialProgress) {
        nextState.tutorialProgress.phases = {
          ...nextState.tutorialProgress.phases,
          worldGeneration: { completed: false, skipped: false, lastStep: 0 }
        };
      }

      return nextState;
    } catch (error) {
      logger.error('State migration failed', error);
      return initialState;
    }
  },
}
));

// Named export for consistent usage
// Also expose store globally for dev/test to allow direct state seeding
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  window.useSessionStore = useSessionStore;
}
