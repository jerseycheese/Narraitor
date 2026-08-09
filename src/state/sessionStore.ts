import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SessionStore } from '../types/game.types';
import { TutorialProgress, TutorialPhase } from '../types/tutorial.types';
import { EntityID } from '../types/common.types';
import { SessionLifecycleMetadata, SessionLifecycleStatus } from '../types/session.types';
import Logger from '@/lib/utils/logger';
import { createIndexedDBStorage } from './persistence';
import { getTimestamp } from '@/lib/utils/timestamp';
import { writeRecoveryMarker, clearRecoveryMarker } from '@/lib/utils/sessionRecoveryMarker';
import {
  storeEvents,
  StoreEventTypes,
  type SessionFreshStartEvent,
  type SessionStartedEvent,
  type SessionEndedEvent,
} from '@/lib/state/storePubSub';
import { shouldExposeStoreOnWindow } from '@/lib/utils/shouldExposeStoreOnWindow';

/**
 * Create logger instance for this store
 */
const logger = new Logger('SessionStore');

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
 * Keep the crash-recovery marker in step with the live session. Only an active
 * session with full world/character context is recoverable, so that's the only
 * shape we record. Called on activation and on each save/heartbeat (issue #221).
 */
const syncRecoveryMarker = (
  state: Pick<SessionStore, 'id' | 'status' | 'worldId' | 'characterId'>,
  lastActivity: string
): void => {
  if (state.status === 'active' && state.id && state.worldId && state.characterId) {
    writeRecoveryMarker({
      sessionId: state.id,
      worldId: state.worldId,
      characterId: state.characterId,
      lastActivity,
    });
  }
};

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
    
    // Let sibling stores reset their per-session data via the event bus.
    // The dynamic store imports that used to live here were the hub of every
    // import cycle in src/state; this store stays a leaf now. narrativeStore
    // clears the new session's segments/decisions (isNewSession) and
    // inventoryStore clears the character inventory (isForcedFresh) — old
    // session data is still preserved when changing characters.
    const isNewSession = isNewCharacterSession || !currentState.id;
    if (sessionId && (isNewSession || force)) {
      await storeEvents.emit<SessionFreshStartEvent>(StoreEventTypes.SESSION_FRESH_START, {
        sessionId,
        worldId,
        characterId,
        isNewSession,
        isForcedFresh: force,
      });
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

      // Mark the session live for crash recovery (issue #221)
      syncRecoveryMarker(get(), activationTimestamp);


      // Session-start journal entry (Issue #176) — created by the
      // SESSION_STARTED subscriber in src/lib/session/sessionJournalEntries.ts
      await storeEvents.emit<SessionStartedEvent>(StoreEventTypes.SESSION_STARTED, {
        sessionId,
        worldId,
        characterId,
        startedAt: getTimestamp(),
      });

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

  // Re-arm the crash-recovery marker for the current live session without
  // re-running activation. The play surface clears the marker on a clean
  // refresh (pagehide), but remounting an already-active session skips
  // initializeSession/resumeSavedSession — so without this, a crash in the
  // window before the next save would leave no marker and no recovery (issue #221).
  refreshRecoveryMarker: () => {
    syncRecoveryMarker(get(), getTimestamp());
  },

  // End the current session (save it instead of destroying)
  endSession: async () => {
    const state = get();
    const lifecycleUpdateTime = getTimestamp();

    // Clean exit: drop the crash-recovery marker so the next load doesn't
    // mistake this for an abnormal end (issue #221)
    clearRecoveryMarker();

    if (state.id && state.worldId && state.characterId) {

      // Session-end journal entry with duration + segment count (Issue #176) —
      // created by the SESSION_ENDED subscriber in
      // src/lib/session/sessionJournalEntries.ts. Emitted while this store
      // still holds the session identity (state resets just below).
      await storeEvents.emit<SessionEndedEvent>(StoreEventTypes.SESSION_ENDED, {
        sessionId: state.id,
        worldId: state.worldId,
        characterId: state.characterId,
        endedAt: lifecycleUpdateTime,
      });

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
      // Mark the resumed session live for crash recovery (issue #221)
      syncRecoveryMarker(get(), activationTimestamp);
      return true;
    }
    return false;
  },
  
  // Delete a saved session
  deleteSavedSession: (sessionId: string) => {
    set(state => {
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

    // Heartbeat: refresh the crash-recovery marker as the story progresses so a
    // crash recovers state from at most a few minutes ago (issue #221)
    syncRecoveryMarker(get(), getTimestamp());
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
        delete (nextState as Partial<SessionStore> & { onboardingCompleted?: boolean }).onboardingCompleted;
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
if (typeof window !== 'undefined' && shouldExposeStoreOnWindow()) {
  window.useSessionStore = useSessionStore;
}
