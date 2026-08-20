'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GameSessionState } from '@/types/game.types';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { generateUniqueId } from '@/lib/utils/generateId';
import { useGameSessionState } from './hooks/useGameSessionState';
import GameSessionLoading from './GameSessionLoading';
import GameSessionError from './GameSessionError';
import ActiveGameSession from './ActiveGameSession';
import GameSessionResume from './GameSessionResume';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Users, BookOpen } from 'lucide-react';

interface GameSessionProps {
  worldId: string;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
  onStartNew?: () => void;
  onBack?: () => void;
  initialState?: Partial<GameSessionState>;
  disableAutoResume?: boolean; // For testing/dev harnesses
}

/**
 * GameSession component that manages the game session state and UI
 */
const GameSession: React.FC<GameSessionProps> = ({
  worldId,
  onSessionStart,
  onSessionEnd,
  onStartNew,
  onBack,
  initialState,
  disableAutoResume = false,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  // Check for auto-resume parameter
  const autoResume = searchParams?.get('autoResume') === 'true';
  const [hasAutoResumed, setHasAutoResumed] = useState(false);
  
  // Create a stable fresh session ID when disableAutoResume is true
  const freshSessionId = useMemo(() => {
    if (disableAutoResume) {
      return generateUniqueId(`fresh-session-${worldId}`);
    }
    return null;
  }, [disableAutoResume, worldId]); // Only depend on these stable values
  
  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // No test globals; use real persisted state only
  const testSessionState = null;

  // Use the custom hook for state management
  const hookResult = useGameSessionState({
    worldId,
    isClient,
    onSessionStart,
    onSessionEnd,
    initialState: testSessionState || initialState,
    disableAutoResume,
    router,
  });

  // Override session state for test mode
  const {
    sessionState: hookSessionState,
    error,
    worldExists,
    world,
    worldCharacters,
    prevStatusRef,
    handleRetry,
    handleDismissError,
    startSession,
    handleSelectChoice,
    savedSession,
    handleResumeSession,
    handleNewSession,
  } = hookResult;

  const sessionState = testSessionState || hookSessionState;
  
  // Create a stable session ID that won't change on re-renders
  const stableSessionId = useMemo(() => {
    // If we're disabling auto-resume (fresh session requested), use the stable fresh session ID
    if (disableAutoResume && freshSessionId) {
      return freshSessionId;
    }
    
    // First priority: Use session ID from session state (from store)
    if (sessionState.id) {
      return sessionState.id;
    }
    
    // Second priority: Check if store already has a session ID
    const currentStoreState = useSessionStore.getState();
    if (currentStoreState.id && currentStoreState.worldId === worldId) {
      return currentStoreState.id;
    }
    
    // Third priority: Check if we're resuming a saved session
    if (savedSession) {
      return savedSession.id;
    }
    
    // Fourth priority: Check if there's existing narrative data for this world that we can resume
    const narrativeState = useNarrativeStore.getState();
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
          return existingSessionId;
        }
      }
    }
    
    // Last resort: Create a new stable ID if no existing session found
    const sessionId = generateUniqueId(`session-${worldId}`);
    
    return sessionId;
  }, [worldId, sessionState.id, savedSession, disableAutoResume, freshSessionId]);
  
  // Update session store when session ID changes
  useEffect(() => {
    if (!stableSessionId) return;
    
    // Only clear segments if this is a brand new session (not resuming existing)
    const narrativeState = useNarrativeStore.getState();
    const existingSegments = narrativeState.sessionSegments[stableSessionId] || [];
    const isNewSession = existingSegments.length === 0;
    
    if (isNewSession) {
      // New session - clearing any stale segments
      useNarrativeStore.getState().clearSessionSegments(stableSessionId);
    } else {
      // Resuming existing session with segments
    }
    
    // Update the session store
    if (useSessionStore.getState().setSessionId) {
      useSessionStore.getState().setSessionId(stableSessionId);
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
    statusAnnouncer.className = '';
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
  
  // Clean up on unmount - only in production or when actually navigating away
  useEffect(() => {
    if (!isClient) return; // Skip on server-side
    
    return () => {
      // In development mode with fast refresh, don't end sessions
      // This prevents the infinite reset loop during hot reloading
      if (process.env.NODE_ENV === 'development') {
        return;
      }
      
      // Save the session when component unmounts (navigating away)
      const currentState = useSessionStore.getState();
      if (currentState.status === 'active' && currentState.id) {
        // Don't reset the session, just save it
        useSessionStore.getState().endSession();
        
        // Update the narrative count after saving
        const narrativeCount = useNarrativeStore.getState().getSessionSegments(currentState.id).length;
        useSessionStore.getState().updateSavedSessionNarrativeCount(currentState.id, narrativeCount);
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
      <div className="manuscript-play-entry" data-testid="game-session-error-container">
        <ErrorDisplay
          variant="section"
          title="World Not Found"
          message="The world you're trying to access doesn't exist or has been deleted."
          severity="error"
        />
        <Button
          variant="default"
          onClick={() => router?.push('/worlds')}
        >
          Back to Worlds
        </Button>
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
        <div className="manuscript-play-entry" data-testid="game-session-no-characters">
          <EmptyState
            icon={<Users aria-hidden="true" />}
            title="No Characters Found"
            description="You'll need a character before you can start playing in this world."
            action={
              <>
                <Button
                  variant="default"
                  onClick={() => router?.push(`/characters/create?worldId=${worldId}`)}
                >
                  Create Character
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router?.push('/worlds')}
                >
                  Back to Worlds
                </Button>
              </>
            }
          />
        </div>
      );
    }
    
    return (
      <div className="manuscript-play-entry" data-testid="game-session-initializing">
        <EmptyState
          icon={<BookOpen aria-hidden="true" />}
          title="Session Not Started"
          description="No active game session yet."
          action={
            <>
              <Button
                variant="default"
                onClick={startSession}
              >
                Start Session
              </Button>
              <Button
                variant="secondary"
                onClick={() => router?.push('/worlds')}
              >
                Back to Worlds
              </Button>
            </>
          }
        />
        {process.env.NODE_ENV === 'development' && (
          <div className="manuscript-play-entry-debug">
            Debug: Session ID: {sessionState.id || 'none'}, Status: {sessionState.status}
          </div>
        )}
      </div>
    );
  }
  
  // Treat 'loading' as an active session to allow the
  // ActiveGameSession to show its coordinated skeleton and
  // continue initialization even if the store is still 'loading'
  // (fresh sessions should not be blocked by this gate). Returning
  // <GameSessionLoading /> here instead gets stuck.

  if (error || sessionState.error) {
    return (
      <div className="manuscript-play-entry">
        <GameSessionError
          error={(error?.message || sessionState.error || 'Unknown error')}
          onRetry={handleRetry}
          onDismiss={handleDismissError}
        />
        <Button
          variant="ghost"
          onClick={() => router?.push('/worlds')}
        >
          Back to Worlds
        </Button>
      </div>
    );
  }
  
  if (sessionState.status === 'active' || sessionState.status === 'paused' || sessionState.status === 'loading') {
    // Use the new narrative integration component
    return (
      <ActiveGameSession
        worldId={worldId}
        sessionId={stableSessionId}
        world={world}
        // Map 'loading' to 'active' to keep the UI enabled
        status={sessionState.status === 'paused' ? 'paused' : 'active'}
        onChoiceSelected={handleSelectChoice}
        onStartNew={onStartNew}
        onBack={onBack}
        choices={sessionState.playerChoices || []}
        // Kick off generation in both 'active' and 'loading' states
        triggerGeneration={sessionState.status === 'active' || sessionState.status === 'loading'}
      />
    );
  }
  
  // Default case - unknown state
  return (
    <div data-testid="game-session-unknown" >
      <div>
        <p>Unknown session state: {sessionState.status}</p>
      </div>
    </div>
  );
};

export default GameSession;
