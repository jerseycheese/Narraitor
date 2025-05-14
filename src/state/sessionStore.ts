import { create } from 'zustand';
import { GameSession, SessionState } from '../types/session.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';

/**
 * Session store interface with state and actions
 */
interface SessionStore {
  // State
  sessions: Record<EntityID, GameSession>;
  activeSessionId: EntityID | null;
  error: string | null;
  loading: boolean;

  // Actions
  createSession: (worldId: EntityID, characterId: EntityID) => EntityID;
  updateSession: (sessionId: EntityID, updates: Partial<GameSession>) => void;
  endSession: (sessionId: EntityID) => void;
  setActiveSession: (sessionId: EntityID) => void;
  
  // State management
  reset: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Initial state
const initialState = {
  sessions: {},
  activeSessionId: null,
  error: null,
  loading: false,
};

// Session Store implementation
export const sessionStore = create<SessionStore>()((set) => ({
  ...initialState,

  // Create session
  createSession: (worldId, characterId) => {
    const sessionId = generateUniqueId('session');
    const now = new Date().toISOString();
    
    const sessionState: SessionState = {
      status: 'active',
      lastActivity: now,
    };

    const newSession: GameSession = {
      id: sessionId,
      worldId,
      characterId,
      state: sessionState,
      narrativeHistory: [],
      currentContext: {
        recentSegments: [],
        activeCharacters: [characterId],
      },
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      sessions: {
        ...state.sessions,
        [sessionId]: newSession,
      },
      activeSessionId: sessionId, // New sessions become active by default
    }));

    return sessionId;
  },

  // Update session
  updateSession: (sessionId, updates) => set((state) => {
    if (!state.sessions[sessionId]) {
      return { error: 'Session not found' };
    }

    const updatedSession: GameSession = {
      ...state.sessions[sessionId],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return {
      sessions: {
        ...state.sessions,
        [sessionId]: updatedSession,
      },
      error: null,
    };
  }),

  // End session
  endSession: (sessionId) => set((state) => {
    if (!state.sessions[sessionId]) {
      return { error: 'Session not found' };
    }

    const updatedSession: GameSession = {
      ...state.sessions[sessionId],
      state: {
        ...state.sessions[sessionId].state,
        status: 'completed',
      },
      updatedAt: new Date().toISOString(),
    };

    return {
      sessions: {
        ...state.sessions,
        [sessionId]: updatedSession,
      },
      activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
      error: null,
    };
  }),

  // Set active session
  setActiveSession: (sessionId) => set((state) => {
    if (!state.sessions[sessionId]) {
      return { 
        error: 'Session not found',
        activeSessionId: null,
      };
    }

    return {
      activeSessionId: sessionId,
      error: null,
    };
  }),

  // State management actions
  reset: () => set(() => initialState),
  setError: (error) => set(() => ({ error })),
  clearError: () => set(() => ({ error: null })),
  setLoading: (loading) => set(() => ({ loading })),
}));
