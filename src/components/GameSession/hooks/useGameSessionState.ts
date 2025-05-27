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
  
  // Always call store hooks unconditionally
  const worldStoreHook = worldStore();
  const sessionStoreHook = sessionStore();
  const characterStoreHook = characterStore();
  
  // Use provided stores or real stores for testing
  const actualWorldState = _stores?.worldStore 
    ? (typeof _stores.worldStore === 'function' ? _stores.worldStore() : _stores.worldStore) 
    : worldStoreHook;
  
  const actualSessionState = _stores?.sessionStore
    ? (typeof _stores.sessionStore === 'function' ? _stores.sessionStore() : _stores.sessionStore)
    : sessionStoreHook;
  
  const actualCharacterState = _stores?.characterStore
    ? (typeof _stores.characterStore === 'function' ? _stores.characterStore() : _stores.characterStore)
    : characterStoreHook;
  
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
  const worldCharacters = Object.values(actualCharacterState.characters || {}).filter(
    char => char.worldId === worldId
  );
  
  // Determine which character to use for this session (without side effects)
  const getCharacterForSession = (): string | null => {
    logger.debug('[getCharacterForSession] Current character ID:', currentCharacterId);
    logger.debug('[getCharacterForSession] World ID:', worldId);
    logger.debug('[getCharacterForSession] World characters:', worldCharacters.map(c => ({ id: c.id, name: c.name, worldId: c.worldId })));
    
    // If current character belongs to this world, use it
    if (currentCharacterId && actualCharacterState.characters?.[currentCharacterId]?.worldId === worldId) {
      logger.debug('[getCharacterForSession] Current character belongs to this world, using it:', currentCharacterId);
      return currentCharacterId;
    }
    
    // Otherwise, use the first available character for this world
    if (worldCharacters.length > 0) {
      const firstWorldChar = worldCharacters[0];
      logger.warn('[getCharacterForSession] Current character does not belong to this world, using first world character:', firstWorldChar.id);
      return firstWorldChar.id;
    }
    
    logger.debug('[getCharacterForSession] No characters found for this world');
    return null;
  };
  
  // Effect to update current character if needed
  useEffect(() => {
    if (!isClient) return;
    
    // If current character doesn't belong to this world, update it
    if (currentCharacterId && actualCharacterState.characters?.[currentCharacterId]?.worldId !== worldId) {
      const firstWorldChar = worldCharacters[0];
      if (firstWorldChar && actualCharacterState.setCurrentCharacter) {
        actualCharacterState.setCurrentCharacter(firstWorldChar.id);
      }
    }
  }, [worldId, currentCharacterId, worldCharacters.length]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Handle retry
  const handleRetry = () => {
    setError(null);
    setSessionState(prev => ({ ...prev, error: null }));
    if (actualSessionState.initializeSession) {
      const characterId = getCharacterForSession();
      if (!characterId) {
        logger.warn('No character available for this world');
        setError(new Error('Please create a character for this world before starting the game'));
        return;
      }
      actualSessionState.initializeSession(worldId, characterId, onSessionStart);
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
    if (actualSessionState.initializeSession) {
      const characterId = getCharacterForSession();
      if (!characterId) {
        logger.warn('No character available for this world');
        setError(new Error('Please create a character for this world before starting the game'));
        setSessionState(prev => ({ ...prev, error: 'Please create a character for this world before starting the game' }));
        return;
      }
      actualSessionState.initializeSession(worldId, characterId, onSessionStart);
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
    if (actualSessionState.selectChoice) {
      actualSessionState.selectChoice(choiceId);
    }
  };


  // Handle end session
  const handleEndSession = () => {
    actualSessionState.endSession?.();
    setSessionState(prev => ({ ...prev, status: 'ended' }));
    router?.push('/'); // Navigate back to home page
    if (onSessionEnd) {
      onSessionEnd();
    }
  };
  
  // Initialize session with correct character when component mounts
  useEffect(() => {
    if (!isClient) return;
    
    // Only initialize if session is not already active
    if (sessionState.status === 'initializing' && worldExists) {
      const characterId = getCharacterForSession();
      if (characterId) {
        // Check if there's a saved session for this world/character combo
        const savedSession = actualSessionState.getSavedSession?.(worldId, characterId);
        
        if (savedSession) {
          logger.debug('[useGameSessionState] Found saved session:', savedSession.id);
          // Resume the saved session
          if (actualSessionState.resumeSavedSession) {
            actualSessionState.resumeSavedSession(savedSession.id);
          }
        } else if (actualSessionState.initializeSession) {
          logger.debug('[useGameSessionState] No saved session, creating new one with character:', characterId);
          actualSessionState.initializeSession(worldId, characterId, onSessionStart);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, worldExists, sessionState.status]); // Dependencies carefully selected to avoid infinite loops
  
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
  
  // Get saved session for current world/character
  const savedSession = useMemo(() => {
    const characterId = getCharacterForSession();
    if (characterId && actualSessionState.getSavedSession) {
      return actualSessionState.getSavedSession(worldId, characterId);
    }
    return undefined;
  }, [worldId, actualCharacterState.currentCharacterId]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Handle resume saved session
  const handleResumeSession = () => {
    if (savedSession && actualSessionState.resumeSavedSession) {
      logger.debug('Resuming saved session:', savedSession.id);
      actualSessionState.resumeSavedSession(savedSession.id);
    }
  };
  
  // Handle new session (when saved session exists)
  const handleNewSession = () => {
    const characterId = getCharacterForSession();
    if (characterId && actualSessionState.initializeSession) {
      logger.debug('Starting new session, character:', characterId);
      actualSessionState.initializeSession(worldId, characterId, onSessionStart);
    }
  };
  
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