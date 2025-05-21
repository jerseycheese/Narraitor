'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { NarrativeController } from '@/components/Narrative/NarrativeController';
import { NarrativeHistoryManager } from '@/components/Narrative/NarrativeHistoryManager';
import { Decision, NarrativeSegment } from '@/types/narrative.types';
import PlayerChoices from './PlayerChoices';
import SessionControls from './SessionControls';
import { narrativeStore } from '@/state/narrativeStore';
import { PlayerChoiceSelector } from '@/components/Narrative';

interface GameSessionActiveWithNarrativeProps {
  worldId: string;
  sessionId: string;
  world?: World;
  status?: 'active' | 'paused' | 'ended';
  onChoiceSelected: (choiceId: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
  // Narrative specific props
  existingSegments?: NarrativeSegment[];
  choices?: Array<{
    id: string;
    text: string;
    isSelected?: boolean;
  }>;
  triggerGeneration?: boolean;
  selectedChoiceId?: string;
}

const GameSessionActiveWithNarrative: React.FC<GameSessionActiveWithNarrativeProps> = ({
  worldId,
  sessionId,
  world,
  status = 'active',
  onChoiceSelected,
  onPause,
  onResume,
  onEnd,
  /* existingSegments - not currently used */
  choices,
  triggerGeneration = false,
  selectedChoiceId,
}) => {
  const [isGenerating, setIsGenerating] = React.useState(true); // Start as generating
  // We track generation for debugging - not used directly in render
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [generation, setGeneration] = React.useState(0);
  const [initialized, setInitialized] = React.useState(false);
  const [currentDecision, setCurrentDecision] = React.useState<Decision | null>(null);
  // Use a consistent key that doesn't change on remounts for the same session
  const controllerKey = React.useMemo(() => `controller-fixed-${sessionId}`, [sessionId]);
  
  // Initialize the narrative only once per session
  // instead of clearing and recreating each time
  React.useEffect(() => {
    // Initialize session with unique controller key
    let isMounted = true;
    
    // Set initial loading state
    setIsGenerating(true);
    
    // Function to check existing narrative and set up if needed
    const setupNarrative = async () => {
      try {
        // Dynamically import the narrativeStore to avoid circular dependencies
        const { narrativeStore } = await import('@/state/narrativeStore');
        
        // Only proceed if still mounted
        if (!isMounted) return;
        
        // Check if we already have segments for this session
        const existingSegments = narrativeStore.getState().getSessionSegments(sessionId);
        const hasInitialScene = existingSegments.some(seg => 
          seg.type === 'scene' && 
          (seg.metadata?.location === 'Starting Location' || 
           seg.metadata?.location === 'Frontier Town')
        );
        
        if (hasInitialScene) {
          // If we already have an initial scene, just use it - no need to generate again
          // Found existing initial scene, use it without generating a new one
          setInitialized(true);
          setIsGenerating(false);
        }
        else if (existingSegments.length > 0) {
          // We have segments but no initial scene - unusual state - clean up and regenerate
          // Found segments but no initial scene - unusual state - clean up
          narrativeStore.getState().clearSessionSegments(sessionId);
          
          // Wait a short time to ensure the store update has completed
          setTimeout(() => {
            if (isMounted) {
              // Set initialized flag to generate fresh narrative
              setInitialized(true);
            }
          }, 500);
        }
        else {
          // No segments at all - normal case for new session
          // No existing segments found, will generate initial scene
          setInitialized(true);
        }
      } catch (err) {
        console.error(`Error setting up narrative:`, err);
        // Set initialized anyway so we don't get stuck
        setInitialized(true);
      }
    };
    
    // Check existing narrative and set up if needed
    setupNarrative();
    
    return () => {
      // Mark component as unmounted to prevent state updates after unmounting
      isMounted = false;
    };
  }, [sessionId, worldId, controllerKey]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleNarrativeGenerated = (_: NarrativeSegment) => {
    // Narrative segment was successfully generated
    setIsGenerating(false);
  };

  const handleChoiceSelected = (choiceId: string) => {
    // Player choice was selected
    setIsGenerating(true);
    setGeneration(prev => prev + 1);  // Increment generation counter
    
    // If we have a current decision, update its selected option
    if (currentDecision) {
      narrativeStore.getState().selectDecisionOption(currentDecision.id, choiceId);
    }
    
    onChoiceSelected(choiceId);
  };
  
  // Handle newly generated player choices
  const handleChoicesGenerated = (decision: Decision) => {
    setCurrentDecision(decision);
  };

  return (
    <div data-testid="game-session-active" className="p-4" role="region" aria-label="Game session">
      {world && (
        <div className="mb-2">
          <h1 className="text-2xl font-bold">{world.name}</h1>
          <p className="text-gray-600">{world.theme}</p>
          <p className="text-blue-600" aria-live="polite">Status: {status}</p>
        </div>
      )}
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-bold mb-2">Story</h2>
        {/* Use NarrativeHistoryManager to display narrative content without generation logic */}
        <NarrativeHistoryManager
          key={`display-${controllerKey}`}
          sessionId={sessionId}
          className="mb-4"
        />
        
        {/* Loading indicator when generating */}
        {isGenerating && (
          <div className="text-center py-2">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Generating story...</p>
          </div>
        )}
        
        {/* Hidden controller just to generate content - always include it but hide from view */}
        <div aria-hidden="true" style={{ display: 'none', height: 0, overflow: 'hidden' }}>
          <NarrativeController
            key={`generator-${controllerKey}`}
            worldId={worldId}
            sessionId={sessionId}
            triggerGeneration={triggerGeneration || !initialized} // Force generation if not initialized
            choiceId={selectedChoiceId}
            onNarrativeGenerated={handleNarrativeGenerated}
            onChoicesGenerated={handleChoicesGenerated}
            generateChoices={true}
          />
        </div>
      </div>

      {/* Show AI-generated choices if available, otherwise fallback to static choices */}
      {currentDecision ? (
        <PlayerChoiceSelector
          decision={currentDecision}
          onSelect={handleChoiceSelected}
          isDisabled={status !== 'active' || isGenerating}
        />
      ) : choices && choices.length > 0 ? (
        <PlayerChoices
          choices={choices}
          onChoiceSelected={handleChoiceSelected}
          isDisabled={status !== 'active' || isGenerating}
        />
      ) : null}

      {onPause && onResume && onEnd && (
        <SessionControls
          status={status}
          onPause={onPause}
          onResume={onResume}
          onEnd={onEnd}
        />
      )}
    </div>
  );
};

export default GameSessionActiveWithNarrative;