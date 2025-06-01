'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GameSessionState } from '@/types/game.types';
import { sessionStore } from '@/state/sessionStore';
import { worldStore } from '@/state/worldStore';
import { narrativeStore } from '@/state/narrativeStore';
import { useGameSessionState } from './hooks/useGameSessionState';
import GameSessionLoading from './GameSessionLoading';
import GameSessionError from './GameSessionError';
import ActiveGameSession from './ActiveGameSession';
import GameSessionResume from './GameSessionResume';
import { SectionError } from '@/components/ui/ErrorDisplay/ErrorDisplay';

interface GameSessionProps {
  worldId: string;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
  initialState?: Partial<GameSessionState>;
  disableAutoResume?: boolean; // For testing/dev harnesses
  // Optional testing props
  _stores?: {
    worldStore: Partial<ReturnType<typeof worldStore.getState>> | (() => Partial<ReturnType<typeof worldStore.getState>>);
    sessionStore: Partial<ReturnType<typeof sessionStore.getState>> | (() => Partial<ReturnType<typeof sessionStore.getState>>);
  };
  _router?: {
    push: (url: string) => void;
  };
}

/**
 * GameSession component that manages the game session state and UI
 */
const GameSession: React.FC<GameSessionProps> = ({
  worldId,
  onSessionStart,
  onSessionEnd,
  initialState,
  disableAutoResume = false,
  _stores,
  _router,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  
  // Use provided router or real router
  const actualRouter = _router || router;
  
  // Check for auto-resume parameter
  const autoResume = searchParams?.get('autoResume') === 'true';
  const [hasAutoResumed, setHasAutoResumed] = useState(false);
  
  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Use the custom hook for state management
  const {
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
    savedSession,
    handleResumeSession,
    handleNewSession,
  } = useGameSessionState({
    worldId,
    isClient,
    onSessionStart,
    onSessionEnd,
    initialState,
    disableAutoResume,
    router: actualRouter,
    _stores,
  });
  
  // Create a stable session ID that won't change on re-renders
  const stableSessionId = useMemo(() => {
    if (sessionState.id) {
      console.log(`[GameSession] Using existing session ID: ${sessionState.id}`);
      return sessionState.id;
    }
    
    // Check if we're resuming a saved session
    if (savedSession) {
      console.log(`[GameSession] Using saved session ID: ${savedSession.id}`);
      return savedSession.id;
    }
    
    // Check if there's existing narrative data for this world that we can resume
    const narrativeState = narrativeStore.getState();
    const existingSessions = Object.keys(narrativeState.sessionSegments);
    
    // Look for existing sessions that have segments for this world
    for (const existingSessionId of existingSessions) {
      const segments = narrativeState.sessionSegments[existingSessionId] || [];
      if (segments.length > 0) {
        // Check if any segments belong to this world by looking at the actual segments
        const hasWorldSegments = segments.some(segmentId => {
          const segment = narrativeState.segments[segmentId];
          return segment && segment.worldId === worldId;
        });
        
        if (hasWorldSegments) {
          console.log(`[GameSession] Found existing narrative session for world ${worldId}: ${existingSessionId}`);
          return existingSessionId;
        }
      }
    }
    
    // Create a new stable ID if no existing session found
    const sessionId = `session-${worldId}-${Math.floor(Date.now() / 1000)}`;
    console.log(`[GameSession] Created new stable session ID: ${sessionId}`);
    
    return sessionId;
  }, [worldId, sessionState.id, savedSession]);
  
  // Update session store when session ID changes
  useEffect(() => {
    if (!stableSessionId) return;
    
    // Only clear segments if this is a brand new session (not resuming existing)
    const narrativeState = narrativeStore.getState();
    const existingSegments = narrativeState.sessionSegments[stableSessionId] || [];
    const isNewSession = existingSegments.length === 0;
    
    if (isNewSession) {
      console.log(`[GameSession] New session - clearing any stale segments for: ${stableSessionId}`);
      narrativeStore.getState().clearSessionSegments(stableSessionId);
    } else {
      console.log(`[GameSession] Resuming existing session with ${existingSegments.length} segments: ${stableSessionId}`);
    }
    
    // Update the session store
    if (sessionStore.getState().setSessionId) {
      sessionStore.getState().setSessionId(stableSessionId);
    }
  }, [stableSessionId]);
  
  // Focus management for state transitions
  useEffect(() => {
    if (!isClient) return;
    
    // Create a small delay to allow rendering to complete
    const focusTimeout = setTimeout(() => {
      // Handle focus when transitioning from loading to active
      if (prevStatusRef.current === 'loading' && sessionState.status === 'active') {
        // Focus on the first player choice if available
        const firstChoice = document.querySelector('[data-testid^="player-choice-"]');
        if (firstChoice) {
          (firstChoice as HTMLElement).focus();
        }
      }
      
      // Handle focus when an error occurs
      if (!prevStatusRef.current.includes('error') && sessionState.error) {
        const retryButton = document.querySelector('[data-testid="game-session-error-retry"]');
        if (retryButton) {
          (retryButton as HTMLElement).focus();
        }
      }
      
      // Update previous status reference
      prevStatusRef.current = sessionState.status ?? 'initializing';
    }, 50);
    
    return () => {
      clearTimeout(focusTimeout);
    };
  }, [sessionState.status, sessionState.error, isClient, prevStatusRef]);
  
  // Create a screen reader announcer for important state changes
  useEffect(() => {
    if (!isClient) return;
    
    // Create announcer for screen readers
    const statusAnnouncer = document.createElement('div');
    statusAnnouncer.setAttribute('aria-live', 'polite');
    statusAnnouncer.setAttribute('aria-atomic', 'true');
    statusAnnouncer.className = 'sr-only';
    document.body.appendChild(statusAnnouncer);
    
    // Function to announce messages to screen readers
    const announce = (message: string) => {
      statusAnnouncer.textContent = message;
    };
    
    // Announce status changes
    if (sessionState.status === 'active' && prevStatusRef.current === 'loading') {
      announce('Game session started. Scene loaded.');
    } else if (sessionState.status === 'paused') {
      announce('Game session paused.');
    } else if (sessionState.status === 'active' && prevStatusRef.current === 'paused') {
      announce('Game session resumed.');
    } else if (sessionState.error) {
      announce(`Error occurred: ${sessionState.error}`);
    }
    
    return () => {
      document.body.removeChild(statusAnnouncer);
    };
  }, [sessionState.status, sessionState.error, isClient, prevStatusRef]);
  
  // Clean up on unmount - save session when navigating away
  useEffect(() => {
    if (!isClient) return; // Skip on server-side
    
    return () => {
      // Save the session when component unmounts (navigating away)
      const currentState = sessionStore.getState();
      if (currentState.status === 'active' && currentState.id) {
        console.log('[GameSession] Saving session on unmount:', currentState.id);
        // Don't reset the session, just save it
        sessionStore.getState().endSession();
        
        // Update the narrative count after saving
        const narrativeCount = narrativeStore.getState().getSessionSegments(currentState.id).length;
        sessionStore.getState().updateSavedSessionNarrativeCount(currentState.id, narrativeCount);
      }
      
      // Only call onSessionEnd if the session is actually ending (status is 'ended')
      if (onSessionEnd && currentState.status === 'ended') {
        onSessionEnd();
      }
    };
  }, [isClient, onSessionEnd]);
  
  // Handle auto-resume - MUST be before any conditional returns
  useEffect(() => {
    if (autoResume && savedSession && !hasAutoResumed && isClient && sessionState.status === 'initializing' && !disableAutoResume) {
      setHasAutoResumed(true);
      handleResumeSession();
    }
  }, [autoResume, savedSession, hasAutoResumed, isClient, sessionState.status, handleResumeSession, disableAutoResume]);
  
  // For server-side rendering and initial client render, show a simple loading state
  if (!isClient) {
    return <GameSessionLoading />;
  }
  
  // Client-side only checks from here on
  if (!worldExists) {
    return (
      <div data-testid="game-session-error-container">
        <SectionError 
          title="World Not Found"
          message="The world you're trying to access doesn't exist or has been deleted."
          severity="error"
          showRetry
          onRetry={handleRetry}
          showDismiss
          onDismiss={handleDismissError}
        />
      </div>
    );
  }
  
  if (sessionState.status === 'initializing') {
    // Check if there's a saved session to resume
    if (savedSession && !sessionState.id) {
      // Show loading if auto-resuming
      if (autoResume && (hasAutoResumed || !isClient)) {
        return <GameSessionLoading />;
      }
      
      return (
        <GameSessionResume
          savedSession={savedSession}
          onResume={handleResumeSession}
          onNewGame={handleNewSession}
        />
      );
    }
    
    // Check if there are any characters for this world
    if (worldCharacters.length === 0) {
      return (
        <div data-testid="game-session-no-characters" className="p-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-xl font-bold mb-2">No Characters Found</h2>
            <p className="text-gray-600 mb-4">
              You need to create a character before you can start playing in this world.
            </p>
            <button 
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => actualRouter?.push(`/characters/create?worldId=${worldId}`)}
            >
              Create Character
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div data-testid="game-session-initializing" className="p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Session Not Started</h2>
          <p className="text-gray-600 mb-4">No active game session.</p>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={startSession}
          >
            Start Session
          </button>
        </div>
      </div>
    );
  }
  
  if (sessionState.status === 'loading') {
    return <GameSessionLoading />;
  }
  
  if (error || sessionState.error) {
    return (
      <GameSessionError 
        error={(error?.message || sessionState.error || 'Unknown error')}
        onRetry={handleRetry}
        onDismiss={handleDismissError}
      />
    );
  }
  
  if (sessionState.status === 'active' || sessionState.status === 'paused') {
    // Use the new narrative integration component
    return (
      <ActiveGameSession
        worldId={worldId}
        sessionId={stableSessionId}
        world={world}
        status={sessionState.status}
        onChoiceSelected={handleSelectChoice}
        onEnd={handleEndSession}
        choices={sessionState.playerChoices || []}
        triggerGeneration={sessionState.status === 'active'}
      />
    );
  }
  
  // Default case - unknown state
  return (
    <div data-testid="game-session-unknown" className="p-4">
      <div className="text-center">
        <p>Unknown session state: {sessionState.status}</p>
      </div>
    </div>
  );
};

export default GameSession;