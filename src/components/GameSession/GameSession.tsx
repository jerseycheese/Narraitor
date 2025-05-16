'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { sessionStore } from '@/state/sessionStore';
import { GameSessionState } from '@/types/game.types';
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
  // Debug logging utility - only logs in development mode when enabled
  const debugLog = React.useCallback((message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true') {
      console.log(`[GameSession] ${message}`, data);
    }
  }, []);
  
  debugLog('Component rendering with worldId:', worldId);
  
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  // Track previous status for focus management
  const prevStatusRef = React.useRef<GameSessionState['status']>('initializing');
  
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
  
  // Use provided router or real router
  const actualRouter = _router || router;
  
  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Check if world exists - only on client-side
  const worldExists = useMemo(() => {
    if (!isClient) return true; // Default for SSR
    return !!worldStoreState.worlds?.[worldId];
  }, [worldStoreState.worlds, worldId, isClient]);
  
  // Handle retry
  const handleRetry = () => {
    setError(null);
    setSessionState(prev => ({ ...prev, error: null }));
    if (sessionStoreState.initializeSession) {
      sessionStoreState.initializeSession(worldId, onSessionStart);
    }
  };

  // Handle dismiss error
  const handleDismissError = () => {
    setError(null);
    setSessionState(prev => ({ ...prev, error: null }));
    actualRouter.push('/');
  };
  
  // Handle selection of a choice
  const handleSelectChoice = (choiceId: string) => {
    if (!sessionState.playerChoices) return;
    
    debugLog('Selecting choice:', choiceId);
    
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

  // Use a ref to track paused state properly across renders
  const pausedRef = React.useRef(false);
  
  // Handle pause/resume toggle
  const handlePauseToggle = () => {
    // Toggle the paused state
    pausedRef.current = !pausedRef.current;
    
    // Update local state immediately
    setSessionState(prev => ({ 
      ...prev, 
      status: pausedRef.current ? 'paused' : 'active' 
    }));
    
    // Update the store based on the action
    if (pausedRef.current) {
      debugLog('Pausing session');
      sessionStoreState.pauseSession?.();
    } else {
      debugLog('Resuming session');
      sessionStoreState.resumeSession?.();
    }
  };

  // Handle end session
  const handleEndSession = () => {
    sessionStoreState.endSession?.();
    setSessionState(prev => ({ ...prev, status: 'ended' }));
    actualRouter.push('/'); // Navigate back to home page
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
        !pausedRef.current && 
        (storeState.status !== sessionState.status ||
         storeState.error !== sessionState.error ||
         storeState.currentSceneId !== sessionState.currentSceneId ||
         JSON.stringify(storeState.playerChoices) !== JSON.stringify(sessionState.playerChoices));
      
      if (shouldUpdate) {
        // Only update if we're not in a paused state that we control locally
        setSessionState(prev => {
          // If we have a local paused state, maintain it
          const effectiveStatus = pausedRef.current ? 'paused' : storeState.status;
          
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
  }, [sessionState.status, sessionState.error, isClient]);
  
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
  }, [sessionState.status, sessionState.error, isClient]);
  
  // Track initialization to avoid repeated calls
  const initRef = React.useRef(false);
  
  // Initialize session on mount - but only if world exists and we're on the client
  useEffect(() => {
    if (!isClient) return; // Skip on server-side
    if (initRef.current) return; // Skip if already initialized
    
    debugLog('init effect - worldExists:', worldExists);
    debugLog('init effect - worldId:', worldId);
    
    if (worldExists) {
      try {
        debugLog('Starting session initialization');
        // Mark as initialized to prevent duplicate calls
        initRef.current = true;
        
        if (typeof sessionStoreState.initializeSession === 'function') {
          try {
            const initPromise = sessionStoreState.initializeSession(worldId, () => {
              debugLog('Session initialized successfully');
              if (onSessionStart) {
                onSessionStart();
              }
            });
            
            // Handle Promise if returned
            if (initPromise && typeof initPromise.catch === 'function') {
              initPromise.catch(err => {
                console.error('[GameSession] Async error in initializeSession:', err);
                const newError = err instanceof Error ? err : new Error('Failed to initialize session');
                setError(newError);
                setSessionState(prev => ({
                  ...prev,
                  error: newError.message,
                }));
              });
            }
          } catch (err) {
            console.error('[GameSession] Error in initializeSession try/catch:', err);
            const newError = err instanceof Error ? err : new Error('Failed to initialize session');
            setError(newError);
            setSessionState(prev => ({
              ...prev,
              error: newError.message,
            }));
          }
        } else {
          console.error('[GameSession] initializeSession is not a function');
          setError(new Error('Session initialization is not available'));
          setSessionState(prev => ({
            ...prev,
            error: 'Session initialization is not available',
          }));
        }
      } catch (err) {
        console.error('[GameSession] Error in initializeSession:', err);
        const newError = err instanceof Error ? err : new Error('Failed to initialize session');
        setError(newError);
        setSessionState(prev => ({
          ...prev,
          error: newError.message,
        }));
      }
    } else {
      debugLog('World does not exist, skipping initialization');
    }
  }, [worldId, sessionStoreState, onSessionStart, worldExists, isClient, debugLog]);

  // Clean up on unmount
  useEffect(() => {
    if (!isClient) return; // Skip on server-side
    
    return () => {
      if (onSessionEnd) {
        onSessionEnd();
      }
    };
  }, [onSessionEnd, isClient]);
  
  // For server-side rendering and initial client render, show a simple loading state
  if (!isClient) {
    return (
      <div data-testid="game-session-loading" className="p-4" aria-live="polite" role="status">
        <div className="text-center">
          <p>Loading game session...</p>
        </div>
      </div>
    );
  }
  
  debugLog('Rendering with session state:', sessionState);
  
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
  
  if (sessionState.status === 'initializing' || sessionState.status === 'loading') {
    return (
      <div data-testid="game-session-loading" className="p-4">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2" aria-live="polite">Loading game session... {sessionState.status}</p>
        </div>
      </div>
    );
  }
  
  if (error || sessionState.error) {
    return (
      <div data-testid="game-session-error">
        <ErrorMessage 
          error={error || new Error(sessionState.error || 'Unknown error')}
          onRetry={handleRetry}
          onDismiss={handleDismissError}
        />
      </div>
    );
  }
  
  if (sessionState.status === 'active' || sessionState.status === 'paused') {
    // Get the world for the active session
    const world = worldStoreState.worlds?.[worldId];
    
    return (
      <div data-testid="game-session-active" className="p-4" role="region" aria-label="Game session">
        <div className="mb-2">
          <h1 className="text-2xl font-bold">{world?.name}</h1>
          <p className="text-gray-600">{world?.theme}</p>
          <p className="text-blue-600" aria-live="polite">Status: {sessionState.status}</p>
        </div>
        
        <div className="mb-6 p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-bold mb-2">Current Scene</h2>
          <p>Scene ID: {sessionState.currentSceneId || 'none'}</p>
          <div aria-live="polite">
            <p className="italic text-gray-600 mt-2">You are in a dimly lit tavern. The air is thick with smoke and the scent of ale. A mysterious figure sits in the corner, watching you.</p>
          </div>
        </div>

        {sessionState.playerChoices && sessionState.playerChoices.length > 0 && (
          <div data-testid="player-choices" className="mt-4">
            <h3 className="text-lg font-semibold mb-2" id="choices-heading">What will you do?</h3>
            <div className="space-y-2" role="radiogroup" aria-labelledby="choices-heading">
              {sessionState.playerChoices.map(choice => (
                <button
                  key={choice.id}
                  data-testid={`player-choice-${choice.id}`}
                  className={`block w-full text-left p-3 border rounded 
                    ${choice.isSelected 
                      ? 'bg-blue-100 border-blue-500 font-bold' 
                      : 'bg-white hover:bg-gray-50'}`}
                  onClick={() => handleSelectChoice(choice.id)}
                  aria-checked={choice.isSelected}
                  role="radio"
                >
                  {choice.isSelected ? '➤ ' : ''}{choice.text}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button 
            data-testid="game-session-controls-pause" 
            className={`px-4 py-2 rounded
              ${pausedRef.current
                ? 'bg-green-600 text-white' 
                : 'bg-yellow-600 text-white'}`}
            onClick={handlePauseToggle}
            aria-pressed={pausedRef.current}
          >
            {pausedRef.current ? '▶️ Resume' : '⏸️ Pause'}
          </button>
          <button 
            data-testid="game-session-controls-end" 
            className="px-4 py-2 bg-red-600 text-white rounded"
            onClick={handleEndSession}
          >
            End Session
          </button>
        </div>
      </div>
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