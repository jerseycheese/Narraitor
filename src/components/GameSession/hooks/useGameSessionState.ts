'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore, type StoreCharacter } from '@/state/characterStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { GameSessionState, PlayerChoice } from '@/types/game.types';
import Logger from '@/lib/utils/logger';

/**
 * Efficiently compare two arrays of player choices without JSON.stringify
 * Only compares essential fields to avoid performance issues with large lists
 */
const arePlayerChoicesEqual = (choices1?: PlayerChoice[], choices2?: PlayerChoice[]): boolean => {
  if (!choices1 && !choices2) return true;
  if (!choices1 || !choices2) return false;
  if (choices1.length !== choices2.length) return false;
  
  // For small lists (< 10), do a full comparison
  if (choices1.length < 10) {
    return choices1.every((choice, index) => {
      const other = choices2[index];
      return choice.id === other.id && 
             choice.text === other.text && 
             choice.isSelected === other.isSelected;
    });
  }
  
  // For larger lists, compare only length, first/last items, and selected states
  // This covers most real-world change scenarios while being performant
  const firstMatch = choices1[0].id === choices2[0].id && choices1[0].isSelected === choices2[0].isSelected;
  const lastMatch = choices1[choices1.length - 1].id === choices2[choices2.length - 1].id && 
                   choices1[choices1.length - 1].isSelected === choices2[choices2.length - 1].isSelected;
  
  // Quick scan for any selection changes (most common update scenario)
  const selectedCount1 = choices1.filter(c => c.isSelected).length;
  const selectedCount2 = choices2.filter(c => c.isSelected).length;
  
  return firstMatch && lastMatch && selectedCount1 === selectedCount2;
};

interface UseGameSessionStateOptions {
  worldId: string;
  isClient: boolean;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
  initialState?: Partial<GameSessionState>;
  disableAutoResume?: boolean;
  router?: { push: (url: string) => void };
}

export const useGameSessionState = ({
  worldId,
  isClient,
  onSessionStart,
  onSessionEnd,
  initialState,
  disableAutoResume = false,
  router,
}: UseGameSessionStateOptions) => {
  const logger = useMemo(() => new Logger('GameSession'), []);
  
  // Track previous status for focus management
  const prevStatusRef = useRef<GameSessionState['status']>('initializing');
  
  // Local state for component with manual updates
  const [sessionState, setSessionState] = useState<Partial<GameSessionState>>({
    status: 'initializing',
    error: null,
    currentSceneId: null,
    playerChoices: [],
    ...initialState,
  });
  
  // Local state for error handling
  const [error, setError] = useState<Error | null>(null);
  
  // Scope each store subscription to the slice this hook actually uses, so the
  // game session doesn't re-render on every unrelated store write during play.
  // Session state itself is consumed via the dedicated subscription below; here
  // we only need its (stable) action methods.
  const actualWorldState = useWorldStore(
    useShallow((state) => ({ worlds: state.worlds }))
  );
  const actualSessionState = useSessionStore(
    useShallow((state) => ({
      // savedSessions is part of the slice (not just the actions) because the
      // savedSession memo below derives from getSavedSession(savedSessions). If
      // IndexedDB hydration populates saved sessions after the world/character
      // ids are already stable, the resume prompt still needs to refresh — so we
      // subscribe to it. It changes far less often than the streaming session
      // fields (status/playerChoices/currentSceneId), which is where the
      // mid-stream re-render churn we're avoiding actually comes from.
      savedSessions: state.savedSessions,
      initializeSession: state.initializeSession,
      selectChoice: state.selectChoice,
      endSession: state.endSession,
      getSavedSession: state.getSavedSession,
      resumeSavedSession: state.resumeSavedSession,
    }))
  );
  const actualCharacterState = useCharacterStore(
    useShallow((state) => ({
      characters: state.characters,
      currentCharacterId: state.currentCharacterId,
      setCurrentCharacter: state.setCurrentCharacter,
    }))
  );
  
  // Check if world exists - only on client-side
  const worldExists = useMemo(() => {
    if (!isClient) return true; // Default for SSR
    return !!actualWorldState.worlds?.[worldId];
  }, [actualWorldState.worlds, worldId, isClient]);
  
  // Get the world for the active session
  const world = actualWorldState.worlds?.[worldId];
  
  // Get the current character ID from the character store
  const currentCharacterId = actualCharacterState.currentCharacterId;
  
  // Get all characters for this world
  const worldCharacters = (Object.values(actualCharacterState.characters || {}) as StoreCharacter[]).filter(
    char => char.worldId === worldId
  );
  
  // Memoize the character for this session to prevent re-calculation
  const sessionCharacterId = useMemo(() => {
    if (!isClient) return null;
    
    // If current character belongs to this world, use it
    if (currentCharacterId && actualCharacterState.characters?.[currentCharacterId]?.worldId === worldId) {
      return currentCharacterId;
    }
    
    // Otherwise, use the first available character for this world
    const firstWorldChar = (Object.values(actualCharacterState.characters || {}) as StoreCharacter[]).find(
      char => char.worldId === worldId
    );
    
    if (firstWorldChar) {
      return firstWorldChar.id;
    }
    
    return null;
  }, [worldId, currentCharacterId, actualCharacterState.characters, isClient]);
  
  // Effect to update current character if needed - only when worldId or currentCharacterId changes
  useEffect(() => {
    if (!isClient) return;
    
    // If current character doesn't belong to this world, update it once
    if (currentCharacterId && actualCharacterState.characters?.[currentCharacterId]?.worldId !== worldId) {
      const firstWorldChar = worldCharacters[0];
      if (firstWorldChar && actualCharacterState.setCurrentCharacter) {
        logger.debug('[useGameSessionState] Updating character from', currentCharacterId, 'to', firstWorldChar.id);
        actualCharacterState.setCurrentCharacter(firstWorldChar.id);
      }
    }
  }, [worldId, currentCharacterId, isClient, actualCharacterState, logger, worldCharacters]); // Dependencies to prevent stale closures
  
  const handleRetry = useCallback(() => {
    setError(null);
    setSessionState(prev => ({ ...prev, error: null }));
    if (actualSessionState.initializeSession) {
      if (!sessionCharacterId) {
        logger.warn('No character available for this world');
        setError(new Error('Please create a character for this world before starting the game'));
        return;
      }
      actualSessionState.initializeSession(worldId, sessionCharacterId, onSessionStart);
    }
  }, [sessionCharacterId, worldId, onSessionStart, actualSessionState, logger]);

  const handleDismissError = () => {
    setError(null);
    setSessionState(prev => ({ ...prev, error: null }));
    router?.push('/dashboard');
  };
  
  // Manual session initialization
  const startSession = useCallback(() => {
    logger.debug('Manual session start requested');
    
    // Clear any existing ending state
    useNarrativeStore.getState().clearEnding();
    
    if (actualSessionState.initializeSession) {
      if (!sessionCharacterId) {
        logger.warn('No character available for this world');
        setError(new Error('Please create a character for this world before starting the game'));
        setSessionState(prev => ({ ...prev, error: 'Please create a character for this world before starting the game' }));
        return;
      }
      actualSessionState.initializeSession(worldId, sessionCharacterId, onSessionStart);
    }
  }, [sessionCharacterId, worldId, onSessionStart, actualSessionState, logger]);
  
  // Handle selection of a choice
  const handleSelectChoice = (choiceId: string) => {
    if (!sessionState.playerChoices) return;
    
    
    // Update local state immediately for visual feedback
    setSessionState(prev => {
      // Map through choices and update the selected one
      const updatedChoices = prev.playerChoices?.map(choice => ({
        ...choice,
        isSelected: choice.id === choiceId,
      }));
      
      return {
        ...prev,
        playerChoices: updatedChoices,
      };
    });
    
    // Then update store - would trigger narrative progression in a full implementation
    if (actualSessionState.selectChoice) {
      actualSessionState.selectChoice(choiceId);
    }
  };


  const handleEndSession = () => {
    actualSessionState.endSession?.();
    setSessionState(prev => ({ ...prev, status: 'ended' }));
    router?.push('/dashboard'); // Back to the app home, not the public landing page (#1528)
    if (onSessionEnd) {
      onSessionEnd();
    }
  };
  
  // Initialize session with correct character when component mounts
  useEffect(() => {
    if (!isClient) return;
    
    // Get current store state to check for existing session
    const currentStoreState = useSessionStore.getState();
    
    // If store already has an active session that matches our requirements, don't
    // re-initialize — but re-arm the crash-recovery marker. A clean refresh clears
    // it on pagehide, and this remount path skips initializeSession/resumeSavedSession,
    // so without this a crash before the next save would leave no marker.
    if (!disableAutoResume &&
        currentStoreState.status === 'active' &&
        currentStoreState.worldId === worldId &&
        currentStoreState.characterId === sessionCharacterId) {
      currentStoreState.refreshRecoveryMarker?.();
      return;
    }
    
    // Only initialize if session is not already active and we haven't already initiated
    if (sessionState.status === 'initializing' && worldExists && sessionCharacterId) {
      // Clear any existing ending state when starting any session
      useNarrativeStore.getState().clearEnding();
      
      // Check if there's a saved session for this world/character combo
      const currentSavedSession = actualSessionState.getSavedSession?.(worldId, sessionCharacterId);
      
      if (currentSavedSession && !disableAutoResume) {
        logger.debug('[useGameSessionState] Found saved session:', currentSavedSession.id);
        // Resume the saved session
        if (actualSessionState.resumeSavedSession) {
          actualSessionState.resumeSavedSession(currentSavedSession.id);
        }
      } else if (actualSessionState.initializeSession) {
        // Initialize a new session if:
        // 1. No saved session exists, OR
        // 2. disableAutoResume is true (fresh session requested)
        actualSessionState.initializeSession(worldId, sessionCharacterId, onSessionStart, disableAutoResume);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, worldExists, sessionState.status, sessionCharacterId, disableAutoResume]); // Dependencies carefully selected to avoid infinite loops
  
  // Subscribe to session store changes directly to avoid polling issues
  useEffect(() => {
    if (!isClient) return;
    
    // Subscribe to store changes
    const unsubscribe = useSessionStore.subscribe((state) => {
      // Only update if there's a meaningful change to avoid unnecessary re-renders
      const shouldUpdate = 
        state.status !== sessionState.status ||
        state.error !== sessionState.error ||
        state.currentSceneId !== sessionState.currentSceneId ||
        state.id !== sessionState.id ||
        !arePlayerChoicesEqual(state.playerChoices, sessionState.playerChoices);
      
      if (shouldUpdate) {
        
        setSessionState(prev => {
          // Store previous status for focus management
          prevStatusRef.current = prev.status!;
          
          return {
            ...prev,
            id: state.id,
            status: state.status,
            error: state.error,
            currentSceneId: state.currentSceneId,
            playerChoices: state.playerChoices,
            worldId: state.worldId,
            characterId: state.characterId,
          };
        });
      }
    });
    
    // Initial sync to get current state
    const currentState = useSessionStore.getState();
    setSessionState(prev => ({
      ...prev,
      id: currentState.id,
      status: currentState.status,
      error: currentState.error,
      currentSceneId: currentState.currentSceneId,
      playerChoices: currentState.playerChoices,
      worldId: currentState.worldId,
      characterId: currentState.characterId,
    }));
    
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]); // Intentionally excluding sessionState to prevent infinite loops
  
  
  // Get saved session for current world/character
  const savedSession = useMemo(() => {
    if (sessionCharacterId && actualSessionState.getSavedSession && !disableAutoResume) {
      return actualSessionState.getSavedSession(worldId, sessionCharacterId);
    }
    return undefined;
  }, [worldId, sessionCharacterId, actualSessionState, disableAutoResume]);
  
  // Handle resume saved session
  const handleResumeSession = () => {
    if (savedSession && actualSessionState.resumeSavedSession) {
      logger.debug('Resuming saved session:', savedSession.id);
      // Clear any existing ending state when resuming
      useNarrativeStore.getState().clearEnding();
      actualSessionState.resumeSavedSession(savedSession.id);
    }
  };
  
  // Handle new session (when saved session exists)
  const handleNewSession = useCallback(() => {
    if (sessionCharacterId && actualSessionState.initializeSession) {
      logger.debug('Starting new session, character:', sessionCharacterId);
      // Clear any existing ending state when starting new session
      useNarrativeStore.getState().clearEnding();
      actualSessionState.initializeSession(worldId, sessionCharacterId, onSessionStart);
    }
  }, [sessionCharacterId, worldId, onSessionStart, actualSessionState, logger]);
  
  return {
    sessionState,
    error,
    worldExists,
    world,
    worldCharacters,
    prevStatusRef,
    handleRetry,
    handleDismissError,
    startSession,
    handleSelectChoice,
    handleEndSession,
    setError,
    setSessionState,
    savedSession,
    handleResumeSession,
    handleNewSession,
  };
};
