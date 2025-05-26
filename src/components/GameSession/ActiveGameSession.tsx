'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { NarrativeController } from '@/components/Narrative/NarrativeController';
import { NarrativeHistoryManager } from '@/components/Narrative/NarrativeHistoryManager';
import { Decision, NarrativeSegment } from '@/types/narrative.types';
import PlayerChoices from './PlayerChoices';
import SessionControls from './SessionControls';
import { narrativeStore } from '@/state/narrativeStore';
import { sessionStore } from '@/state/sessionStore';
import { characterStore } from '@/state/characterStore';
import { PlayerChoiceSelector } from '@/components/Narrative';
import { CharacterPortrait } from '@/components/CharacterPortrait';

interface ActiveGameSessionProps {
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

const ActiveGameSession: React.FC<ActiveGameSessionProps> = ({
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
  const [isGenerating, setIsGenerating] = React.useState(true);
  const [initialized, setInitialized] = React.useState(false);
  const [currentDecision, setCurrentDecision] = React.useState<Decision | null>(null);
  const [localSelectedChoiceId, setLocalSelectedChoiceId] = React.useState<string | undefined>();
  const [shouldTriggerGeneration, setShouldTriggerGeneration] = React.useState(false);
  
  // Get character ID from session store
  const characterId = sessionStore(state => state.characterId);
  
  // Get character details
  const character = characterStore(state => 
    state.characters[characterId || '']
  );
  const [isGeneratingChoices, setIsGeneratingChoices] = React.useState(false);
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
        
        // Check for existing decisions in the store
        const existingDecisions = narrativeStore.getState().getSessionDecisions(sessionId);
        
        // If we have existing decisions, use the latest one
        if (existingDecisions.length > 0) {
          const latestDecision = existingDecisions[existingDecisions.length - 1];
          setCurrentDecision(latestDecision);
        }
        
        if (hasInitialScene || existingSegments.length > 0) {
          // If we have any segments at all, use them
          // Don't clear existing narrative history
          setInitialized(true);
          setIsGenerating(false);
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
    setShouldTriggerGeneration(false); // Reset trigger
    // Start generating choices
    setIsGeneratingChoices(true);
    
    // Set a fallback timer to ensure choices eventually appear
    setTimeout(() => {
      // If we're still generating choices after 10 seconds, create fallback choices
      if (isGeneratingChoices && !currentDecision) {
        const fallbackId = `decision-timeout-${Date.now()}`;
        const fallbackDecision: Decision = {
          id: fallbackId,
          prompt: "What will you do?",
          options: [
            { id: `option-${fallbackId}-1`, text: "Investigate further" },
            { id: `option-${fallbackId}-2`, text: "Talk to nearby characters" },
            { id: `option-${fallbackId}-3`, text: "Move to a new location" }
          ]
        };
        
        setCurrentDecision(fallbackDecision);
        setIsGeneratingChoices(false);
      }
    }, 10000); // 10 second timeout
  };

  const handleChoiceSelected = (choiceId: string) => {
    // Player choice was selected
    setIsGenerating(true);
    setLocalSelectedChoiceId(choiceId);
    setShouldTriggerGeneration(true); // Trigger narrative generation
    
    // If we have a current decision, update its selected option
    if (currentDecision) {
      narrativeStore.getState().selectDecisionOption(currentDecision.id, choiceId);
    }
    
    onChoiceSelected(choiceId);
  };
  
  // Handle newly generated player choices
  const handleChoicesGenerated = (decision: Decision) => {
    if (!decision || !decision.options || decision.options.length === 0) {
      console.error('Invalid decision received:', decision);
      setIsGeneratingChoices(false);
      return;
    }
    
    // Force update with a new object reference to ensure React detects the change
    const decisionCopy: Decision = {
      id: decision.id,
      prompt: decision.prompt,
      options: [...decision.options],
      selectedOptionId: decision.selectedOptionId,
    };
    
    // Update the current decision state with the copy
    setCurrentDecision(decisionCopy);
    // Stop the choice generation loading state
    setIsGeneratingChoices(false);
    
    // Convert AI-generated decision to player choices format for the session
    const playerChoices = decision.options.map(option => ({
      id: option.id,
      text: option.text,
      isSelected: option.id === decision.selectedOptionId
    }));
    
    // Update session store with AI-generated choices
    sessionStore.getState().setPlayerChoices(playerChoices);
  };
  

  return (
    <div data-testid="game-session-active" className="p-4" role="region" aria-label="Game session">
      {world && (
        <div className="mb-4">
          <h1 className="text-2xl font-bold">{world.name}</h1>
          <p className="text-gray-600 mb-3">{world.theme}</p>
          {character && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CharacterPortrait
                portrait={character.portrait || { type: 'placeholder', url: null }}
                characterName={character.name}
                size="small"
              />
              <div>
                <p className="text-green-700 font-medium">Playing as: {character.name}</p>
                <p className="text-green-600 text-sm">Level {character.level}</p>
              </div>
            </div>
          )}
          <p className="text-blue-600 mt-2" aria-live="polite">Status: {status}</p>
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
        
        {/* Note: Loading indicator is handled by NarrativeHistoryManager itself */}
        
        {/* Hidden controller just to generate content - always include it but hide from view */}
        <div aria-hidden="true" style={{ display: 'none', height: 0, overflow: 'hidden' }}>
          <NarrativeController
            key={`generator-${controllerKey}`}
            worldId={worldId}
            sessionId={sessionId}
            characterId={characterId || undefined}
            triggerGeneration={triggerGeneration || !initialized || shouldTriggerGeneration} // Trigger on choice or initialization
            choiceId={localSelectedChoiceId || selectedChoiceId}
            onNarrativeGenerated={handleNarrativeGenerated}
            onChoicesGenerated={handleChoicesGenerated}
            generateChoices={true}
          />
        </div>
      </div>

      {/* Show AI-generated choices, loading state, or fallback */}
      {currentDecision ? (
        <div className="player-choices-container">
          <PlayerChoiceSelector
            decision={currentDecision}
            onSelect={handleChoiceSelected}
            isDisabled={status !== 'active' || isGenerating}
          />
        </div>
      ) : isGeneratingChoices ? (
        <div className="player-choices-container">
          <div className="p-4 border rounded bg-gray-50">
            <div className="flex items-center space-x-2">
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent">
                <span className="sr-only">Loading...</span>
              </div>
              <p className="text-sm text-gray-600">Generating your choices...</p>
            </div>
          </div>
        </div>
      ) : choices && choices.length > 0 ? (
        <div className="player-choices-container">
          <PlayerChoices
            choices={choices}
            onChoiceSelected={handleChoiceSelected}
            isDisabled={status !== 'active' || isGenerating}
          />
        </div>
      ) : (
        <div className="player-choices-container">
          <div className="p-4 border rounded bg-gray-50">
            <p className="text-sm text-gray-600 mb-2">No choices available.</p>
            <button 
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              onClick={() => {
                // Try to get latest decision from narrative store
                const latestDecision = narrativeStore.getState().getLatestDecision(sessionId);
                if (latestDecision) {
                  setCurrentDecision(latestDecision);
                } else {
                  
                  // Create fallback choices manually
                  const fallbackId = `decision-fallback-${Date.now()}`;
                  const fallbackDecision: Decision = {
                    id: fallbackId,
                    prompt: "What will you do?",
                    options: [
                      { id: `option-${fallbackId}-1`, text: "Investigate further" },
                      { id: `option-${fallbackId}-2`, text: "Talk to nearby characters" },
                      { id: `option-${fallbackId}-3`, text: "Move to a new location" }
                    ]
                  };
                  
                  // Save to store for future reference
                  narrativeStore.getState().addDecision(sessionId, {
                    prompt: fallbackDecision.prompt,
                    options: fallbackDecision.options
                  });
                  
                  // Update state
                  setCurrentDecision(fallbackDecision);
                  
                  // Also update session store
                  const playerChoices = fallbackDecision.options.map(option => ({
                    id: option.id,
                    text: option.text,
                    isSelected: false
                  }));
                  sessionStore.getState().setPlayerChoices(playerChoices);
                }
              }}
            >
              Generate Fallback Choices
            </button>
          </div>
        </div>
      )}

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

export default ActiveGameSession;