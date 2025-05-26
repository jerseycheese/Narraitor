'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { worldStore } from '@/state/worldStore';
import { sessionStore } from '@/state/sessionStore';
import { characterStore } from '@/state/characterStore';
import { GameSessionState } from '@/types/game.types';
import Logger from '@/lib/utils/logger';

interface UseGameSessionStateOptions {
  worldId: string;
  isClient: boolean;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
  initialState?: Partial<GameSessionState>;
  router?: { push: (url: string) => void };
  _stores?: {
    worldStore: Partial<ReturnType<typeof worldStore.getState>> | (() => Partial<ReturnType<typeof worldStore.getState>>);
    sessionStore: Partial<ReturnType<typeof sessionStore.getState>> | (() => Partial<ReturnType<typeof sessionStore.getState>>);
    characterStore?: Partial<ReturnType<typeof characterStore.getState>> | (() => Partial<ReturnType<typeof characterStore.getState>>);
  };
}

export const useGameSessionState = ({
  worldId,
  isClient,
  onSessionStart,
  onSessionEnd,
  initialState,
  router,
  _stores,
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
  
  // Use provided stores or real stores for testing
  const worldStoreState = _stores?.worldStore 
    ? (typeof _stores.worldStore === 'function' ? _stores.worldStore() : _stores.worldStore) 
    : worldStore.getState();
  
  const sessionStoreState = _stores?.sessionStore
    ? (typeof _stores.sessionStore === 'function' ? _stores.sessionStore() : _stores.sessionStore)
    : sessionStore.getState();
  
  const characterStoreState = _stores?.characterStore
    ? (typeof _stores.characterStore === 'function' ? _stores.characterStore() : _stores.characterStore)
    : characterStore.getState();
  
  // Check if world exists - only on client-side
  const worldExists = useMemo(() => {
    if (!isClient) return true; // Default for SSR
    return !!worldStoreState.worlds?.[worldId];
  }, [worldStoreState.worlds, worldId, isClient]);
  
  // Get the world for the active session
  const world = worldStoreState.worlds?.[worldId];
  
  // Get the current character ID from the character store
  const currentCharacterId = characterStoreState.currentCharacterId;
  
  // Handle retry
  const handleRetry = () => {
    setError(null);
    setSessionState(prev => ({ ...prev, error: null }));
    if (sessionStoreState.initializeSession) {
      if (!currentCharacterId) {
        logger.warn('No character selected for session');
        setError(new Error('Please select a character before starting the game'));
        return;
      }
      sessionStoreState.initializeSession(worldId, currentCharacterId, onSessionStart);
    }
  };

  // Handle dismiss error
  const handleDismissError = () => {
    setError(null);
    setSessionState(prev => ({ ...prev, error: null }));
    router?.push('/');
  };
  
  // Manual session initialization
  const startSession = () => {
    logger.debug('Manual session start requested');
    if (sessionStoreState.initializeSession) {
      if (!currentCharacterId) {
        logger.warn('No character selected for session');
        setError(new Error('Please select a character before starting the game'));
        setSessionState(prev => ({ ...prev, error: 'Please select a character before starting the game' }));
        return;
      }
      sessionStoreState.initializeSession(worldId, currentCharacterId, onSessionStart);
    }
  };
  
  // Handle selection of a choice
  const handleSelectChoice = (choiceId: string) => {
    if (!sessionState.playerChoices) return;
    
    logger.debug('Selecting choice:', choiceId);
    
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
    if (sessionStoreState.selectChoice) {
      sessionStoreState.selectChoice(choiceId);
    }
  };


  // Handle end session
  const handleEndSession = () => {
    sessionStoreState.endSession?.();
    setSessionState(prev => ({ ...prev, status: 'ended' }));
    router?.push('/'); // Navigate back to home page
    if (onSessionEnd) {
      onSessionEnd();
    }
  };
  
  // Poll for session state updates to avoid subscription issues
  useEffect(() => {
    if (!isClient) return;
    
    // Function to update state from the store
    const updateStateFromStore = () => {
      const storeState = sessionStore.getState();
      
      // Only update if there's a meaningful change to avoid unnecessary re-renders
      const shouldUpdate = 
        storeState.status !== sessionState.status ||
        storeState.error !== sessionState.error ||
        storeState.currentSceneId !== sessionState.currentSceneId ||
        JSON.stringify(storeState.playerChoices) !== JSON.stringify(sessionState.playerChoices);
      
      if (shouldUpdate) {
        setSessionState(prev => {
          const effectiveStatus = storeState.status;
          
          // Store previous status for focus management
          prevStatusRef.current = prev.status!;
          
          return {
            ...prev,
            status: effectiveStatus, // Use our effective status
            error: storeState.error,
            currentSceneId: storeState.currentSceneId,
            playerChoices: storeState.playerChoices,
          };
        });
      }
    };
    
    // Update immediately
    updateStateFromStore();
    
    // Then set up polling interval - use a longer interval to reduce console noise
    const intervalId = setInterval(updateStateFromStore, 2000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isClient, sessionState.currentSceneId, sessionState.error, sessionState.playerChoices, sessionState.status]);
  
  return {
    sessionState,
    error,
    worldExists,
    world,
    prevStatusRef,
    handleRetry,
    handleDismissError,
    startSession,
    handleSelectChoice,
    handleEndSession,
    setError,
    setSessionState,
  };
};