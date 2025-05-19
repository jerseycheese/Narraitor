'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GameSessionState } from '@/types/game.types';
import { sessionStore } from '@/state/sessionStore';
import { worldStore } from '@/state/worldStore';
import { useGameSessionState } from './hooks/useGameSessionState';
import GameSessionLoading from './GameSessionLoading';
import GameSessionError from './GameSessionError';
import GameSessionActive from './GameSessionActive';
import GameSessionActiveWithNarrative from './GameSessionActiveWithNarrative';
import ErrorMessage from '@/lib/components/ErrorMessage';

interface GameSessionProps {
  worldId: string;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
  initialState?: Partial<GameSessionState>;
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
  _stores,
  _router,
}) => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  // Use provided router or real router
  const actualRouter = _router || router;
  
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
    prevStatusRef,
    handleRetry,
    handleDismissError,
    startSession,
    handleSelectChoice,
    handlePauseToggle,
    handleEndSession,
  } = useGameSessionState({
    worldId,
    isClient,
    onSessionStart,
    onSessionEnd,
    initialState,
    router: actualRouter,
    _stores,
  });
  
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
  
  // Clean up on unmount
  useEffect(() => {
    if (!isClient) return; // Skip on server-side
    
    return () => {
      // Only call onSessionEnd if the session is actually ending (status is 'ended')
      const currentStatus = sessionStore.getState().status;
      if (onSessionEnd && currentStatus === 'ended') {
        onSessionEnd();
      }
    };
  }, [isClient, onSessionEnd]);
  
  // For server-side rendering and initial client render, show a simple loading state
  if (!isClient) {
    return <GameSessionLoading />;
  }
  
  // Client-side only checks from here on
  if (!worldExists) {
    return (
      <div data-testid="game-session-error-container">
        <ErrorMessage 
          error={new Error('World not found')}
          onRetry={handleRetry}
          onDismiss={handleDismissError}
        />
      </div>
    );
  }
  
  if (sessionState.status === 'initializing') {
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
    // Use the new narrative integration component with a stable session ID
    const stableSessionId = useMemo(() => 
      sessionState.id || `session-${worldId}-${Date.now()}`,
    [worldId, sessionState.id]);
    
    return (
      <GameSessionActiveWithNarrative
        worldId={worldId}
        sessionId={stableSessionId}
        world={world}
        status={sessionState.status}
        onChoiceSelected={handleSelectChoice}
        onPause={handlePauseToggle}
        onResume={handlePauseToggle}
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