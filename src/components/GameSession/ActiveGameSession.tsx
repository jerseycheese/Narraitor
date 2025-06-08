'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { NarrativeController } from '@/components/Narrative/NarrativeController';
import { NarrativeHistoryManager } from '@/components/Narrative/NarrativeHistoryManager';
import { Decision, NarrativeSegment } from '@/types/narrative.types';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import { ChoiceSelector } from '@/components/shared/ChoiceSelector';
import { generateUniqueId } from '@/lib/utils/generateId';
import CharacterSummary from './CharacterSummary';
import { EndingScreen } from './EndingScreen';
import DeleteConfirmationDialog from '../DeleteConfirmationDialog/DeleteConfirmationDialog';
import type { EndingType } from '@/types/narrative.types';
import { LoadingState } from '@/components/ui/LoadingState';

interface ActiveGameSessionProps {
  worldId: string;
  sessionId: string;
  world?: World;
  status?: 'active' | 'paused' | 'ended';
  onChoiceSelected: (choiceId: string) => void;
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
  const choiceGenerationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Ending suggestion state
  const [showEndingSuggestion, setShowEndingSuggestion] = React.useState(false);
  const [endingSuggestionReason, setEndingSuggestionReason] = React.useState('');
  const [suggestedEndingType, setSuggestedEndingType] = React.useState<EndingType>('story-complete');
  
  // Manual end story confirmation
  const [showEndConfirmation, setShowEndConfirmation] = React.useState(false);
  
  // Get character ID from session store
  const characterId = useSessionStore(state => state.characterId);
  
  // Get character details
  const character = useCharacterStore(state => 
    state.characters[characterId || '']
  );
  
  // Get narrative store for ending functionality
  const { currentEnding, isGeneratingEnding, generateEnding, isSessionEnded } = useNarrativeStore();
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
        const { useNarrativeStore } = await import('@/state/narrativeStore');
        
        // Only proceed if still mounted
        if (!isMounted) return;
        
        // Check if we already have segments for this session
        const existingSegments = useNarrativeStore.getState().getSessionSegments(sessionId);
        const hasInitialScene = existingSegments.some(seg => 
          seg.type === 'scene' && 
          (seg.metadata?.location === 'Starting Location' || 
           seg.metadata?.location === 'Frontier Town')
        );
        
        // Check for existing decisions in the store
        const existingDecisions = useNarrativeStore.getState().getSessionDecisions(sessionId);
        
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
          setIsGenerating(false);
        }
      } catch {
        // Error setting up narrative, continue with initialization
        setInitialized(true);
        setIsGenerating(false);
      }
    };
    
    // Check existing narrative and set up if needed
    setupNarrative();
    
    return () => {
      // Mark component as unmounted to prevent state updates after unmounting
      isMounted = false;
      
      // Clear any pending choice generation timeout
      if (choiceGenerationTimeoutRef.current) {
        clearTimeout(choiceGenerationTimeoutRef.current);
        choiceGenerationTimeoutRef.current = null;
      }
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
    // Use a ref to track this timeout so we can clear it if AI choices arrive
    const timeoutId = setTimeout(() => {
      // If we're still generating choices after 15 seconds, create fallback choices
      setIsGeneratingChoices(prev => {
        if (prev && !currentDecision) {
          const fallbackId = `decision-timeout-${Date.now()}`;
          const fallbackDecision: Decision = {
            id: fallbackId,
            prompt: "What will you do?",
            options: [
              { id: `option-${fallbackId}-1`, text: "Investigate further", alignment: 'neutral' },
              { id: `option-${fallbackId}-2`, text: "Talk to nearby characters", alignment: 'lawful' },
              { id: `option-${fallbackId}-3`, text: "Move to a new location", alignment: 'neutral' }
            ],
            decisionWeight: 'minor',
            contextSummary: 'Waiting for player action (timeout fallback).'
          };
          
          setCurrentDecision(fallbackDecision);
          return false; // Stop generating
        }
        return prev;
      });
    }, 15000); // 15 second timeout (increased from 10)
    
    // Store timeout ID for potential cleanup
    choiceGenerationTimeoutRef.current = timeoutId;
  };

  const handleChoiceSelected = (choiceId: string) => {
    // Check if session has ended - if so, prevent further generation
    if (isSessionEnded(sessionId)) {
      return;
    }
    
    // Player choice was selected
    setIsGenerating(true);
    setIsGeneratingChoices(true); // Start generating new choices
    setLocalSelectedChoiceId(choiceId);
    setShouldTriggerGeneration(true); // Trigger narrative generation
    
    // If we have a current decision, update its selected option
    if (currentDecision) {
      useNarrativeStore.getState().selectDecisionOption(currentDecision.id, choiceId);
    }
    
    // Clear current decision to prevent showing stale choices during generation
    setCurrentDecision(null);
    
    onChoiceSelected(choiceId);
  };

  const handleCustomSubmit = (customText: string) => {
    // Check if session has ended - if so, prevent further generation
    if (isSessionEnded(sessionId)) {
      return;
    }
    
    // Handle custom player input
    const customChoiceId = generateUniqueId('custom');
    
    // Create a custom decision option and add it to the current decision in the store
    if (currentDecision) {
      const customOption = {
        id: customChoiceId,
        text: customText,
        isCustomInput: true,
        customText: customText
      };
      
      // Update the decision in the store with the new custom option and select it
      useNarrativeStore.getState().updateDecision(currentDecision.id, {
        options: [...currentDecision.options, customOption],
        selectedOptionId: customChoiceId
      });
    }
    
    // Clear current decision to prevent showing stale choices during generation
    setCurrentDecision(null);
    
    // Trigger narrative generation with the custom choice
    setIsGenerating(true);
    setIsGeneratingChoices(true); // Start generating new choices
    setLocalSelectedChoiceId(customChoiceId);
    setShouldTriggerGeneration(true);
    
    onChoiceSelected(customChoiceId);
  };
  
  // Handle newly generated player choices
  const handleChoicesGenerated = (decision: Decision) => {
    if (!decision || !decision.options || decision.options.length === 0) {
      // Invalid decision received, stop generation
      setIsGeneratingChoices(false);
      return;
    }
    
    // Clear the fallback timeout since we have real AI choices
    if (choiceGenerationTimeoutRef.current) {
      clearTimeout(choiceGenerationTimeoutRef.current);
      choiceGenerationTimeoutRef.current = null;
    }
    
    // Force update with a new object reference to ensure React detects the change
    const decisionCopy: Decision = {
      id: decision.id,
      prompt: decision.prompt,
      options: [...decision.options],
      selectedOptionId: decision.selectedOptionId,
      decisionWeight: decision.decisionWeight,
      contextSummary: decision.contextSummary,
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
    useSessionStore.getState().setPlayerChoices(playerChoices);
  };
  
  // Handle ending story functionality with confirmation
  const handleEndStory = async () => {
    if (!characterId || !world) return;
    
    try {
      await generateEnding('player-choice', {
        sessionId,
        characterId,
        worldId: world.id
      });
    } catch (error) {
      console.error('Failed to generate ending:', error);
    }
  };
  
  // Handle ending suggestion from AI
  const handleEndingSuggested = (reason: string, endingType: EndingType) => {
    setEndingSuggestionReason(reason);
    setSuggestedEndingType(endingType);
    setShowEndingSuggestion(true);
  };
  
  // Accept AI ending suggestion
  const handleAcceptEndingSuggestion = async () => {
    setShowEndingSuggestion(false);
    if (!characterId || !world) return;
    
    try {
      await generateEnding(suggestedEndingType, {
        sessionId,
        characterId,
        worldId: world.id
      });
    } catch (error) {
      console.error('Failed to generate ending:', error);
    }
  };
  
  // Reject AI ending suggestion
  const handleRejectEndingSuggestion = () => {
    setShowEndingSuggestion(false);
  };
  
  // Handle manual end story button click
  const handleEndStoryClick = () => {
    setShowEndConfirmation(true);
  };
  
  // Confirm manual end story
  const handleConfirmEndStory = () => {
    setShowEndConfirmation(false);
    handleEndStory();
  };

  // If we have an ending, show the ending screen instead
  if (currentEnding) {
    return <EndingScreen />;
  }
  
  // If generating ending, show loading state
  if (isGeneratingEnding) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingState message="Writing your story's ending..." />
      </div>
    );
  }

  return (
    <div data-testid="game-session-active" role="region" aria-label="Game session">
      {/* Character Summary Panel */}
      {character && (
        <div className="mb-6">
          <CharacterSummary character={character} />
        </div>
      )}
      
      {/* Two-column layout for larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:grid-rows-[max-content]">
        {/* Story Column */}
        <div className="lg:row-span-1 lg:self-stretch">
          {/* Use NarrativeHistoryManager to display narrative content without generation logic */}
          <NarrativeHistoryManager
            key={`display-${controllerKey}`}
            sessionId={sessionId}
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
              onEndingSuggested={handleEndingSuggested}
              generateChoices={true}
            />
          </div>
        </div>

        {/* Choices Column */}
        <div className="lg:row-span-1 lg:self-stretch">
          {/* Show AI-generated choices, loading state, or fallback */}
          {currentDecision ? (
            <div className="player-choices-container">
              <ChoiceSelector
                decision={currentDecision}
                onSelect={handleChoiceSelected}
                onCustomSubmit={handleCustomSubmit}
                enableCustomInput={true}
                isDisabled={status !== 'active' || isGenerating || isSessionEnded(sessionId)}
              />
            </div>
          ) : isGeneratingChoices ? (
            <div className="player-choices-container">
              <LoadingState message="Thinking up some options..." />
            </div>
          ) : choices && choices.length > 0 ? (
            <div className="player-choices-container">
              <ChoiceSelector
                choices={choices}
                onSelect={handleChoiceSelected}
                onCustomSubmit={handleCustomSubmit}
                enableCustomInput={true}
                isDisabled={status !== 'active' || isGenerating || isSessionEnded(sessionId)}
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
                    const latestDecision = useNarrativeStore.getState().getLatestDecision(sessionId);
                    if (latestDecision) {
                      setCurrentDecision(latestDecision);
                    } else {
                      
                      // Create fallback choices manually
                      const fallbackId = `decision-fallback-${Date.now()}`;
                      const fallbackDecision: Decision = {
                        id: fallbackId,
                        prompt: "What will you do?",
                        options: [
                          { id: `option-${fallbackId}-1`, text: "Investigate further", alignment: 'neutral' },
                          { id: `option-${fallbackId}-2`, text: "Talk to nearby characters", alignment: 'lawful' },
                          { id: `option-${fallbackId}-3`, text: "Move to a new location", alignment: 'neutral' }
                        ],
                        decisionWeight: 'minor',
                        contextSummary: 'Manual fallback choices created.'
                      };
                      
                      // Save to store for future reference
                      useNarrativeStore.getState().addDecision(sessionId, {
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
                      useSessionStore.getState().setPlayerChoices(playerChoices);
                    }
                  }}
                >
                  Generate Fallback Choices
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {onEnd && (
        <div className="mt-6 flex justify-end gap-2">
          <button
            data-testid="game-session-new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer"
            onClick={() => {
              // Save current session and clear narrative
              useSessionStore.getState().endSession();
              useNarrativeStore.getState().clearSessionSegments(sessionId);
              
              // Reload the page to start fresh
              window.location.reload();
            }}
          >
            Start New Session
          </button>
          <button
            data-testid="game-session-end-story"
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors cursor-pointer"
            onClick={handleEndStoryClick}
            disabled={isGeneratingEnding || isSessionEnded(sessionId)}
            title="End your story with an AI-generated epilogue"
          >
            {isGeneratingEnding ? 'Generating...' : 'End Story'}
          </button>
          <button
            data-testid="game-session-end"
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors cursor-pointer"
            onClick={onEnd}
          >
            End Session
          </button>
        </div>
      )}

      {/* Ending Suggestion Dialog */}
      <DeleteConfirmationDialog
        isOpen={showEndingSuggestion}
        onConfirm={handleAcceptEndingSuggestion}
        onClose={handleRejectEndingSuggestion}
        title="Story Ending Suggested"
        description="The AI has detected that your story might be ready to conclude."
        itemName={endingSuggestionReason}
        confirmButtonText="Generate Ending"
        cancelButtonText="Continue Playing"
      />

      {/* Manual End Story Confirmation */}
      <DeleteConfirmationDialog
        isOpen={showEndConfirmation}
        onConfirm={handleConfirmEndStory}
        onClose={() => setShowEndConfirmation(false)}
        title="End Story"
        description="Are you sure you want to end your story? This will write a final ending based on your current progress and cannot be undone."
        itemName=""
        confirmButtonText="End Story"
        cancelButtonText="Cancel"
      />
    </div>
  );
};

export default ActiveGameSession;
