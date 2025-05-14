import { create } from 'zustand';
import { GameSession } from '../types/session.types';

/**
 * Session store for managing game session state in the Narraitor application.
 * Implements MVP functionality with basic state initialization only.
 */

// Define the initial state for the session store
const initialSessionState: GameSession = {
  id: '',
  worldId: '',
  characterId: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  state: {
    status: 'active',
    lastActivity: new Date().toISOString(),
  },
  narrativeHistory: [],
  currentContext: {
    recentSegments: [],
    activeCharacters: [],
  },
};

// Define the Session Store
export const sessionStore = create<GameSession>()(() => ({
  ...initialSessionState,
}));
