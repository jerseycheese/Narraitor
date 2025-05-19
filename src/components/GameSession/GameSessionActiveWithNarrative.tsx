'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { NarrativeController } from '@/components/Narrative/NarrativeController';
import { NarrativeHistoryManager } from '@/components/Narrative/NarrativeHistoryManager';
import { NarrativeSegment } from '@/types/narrative.types';
import PlayerChoices from './PlayerChoices';
import SessionControls from './SessionControls';

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
  const controllerKey = React.useMemo(() => `controller-${sessionId}`, [sessionId]);
  
  // Initialize the narrative on first load
  React.useEffect(() => {
    console.log(`[GameSessionActive] Session ID: ${sessionId}, WorldID: ${worldId}, Controller Key: ${controllerKey}`);
    
    // Set initial loading state and force initial generation
    setIsGenerating(true);
    
    // Set a timeout to handle the initial narrative generation
    const timer = setTimeout(() => {
      console.log(`[GameSessionActive] Initial narrative generation timer fired`);
      setInitialized(true);
    }, 2000); // Give enough time for the narrative to be generated
    
    return () => clearTimeout(timer);
  }, [sessionId, worldId, controllerKey]);

  const handleNarrativeGenerated = (segment: NarrativeSegment) => {
    console.log(`[GameSessionActive] Narrative generated for session ${sessionId}:`, segment);
    setIsGenerating(false);
  };

  const handleChoiceSelected = (choiceId: string) => {
    console.log(`[GameSessionActive] Choice selected: ${choiceId}`);
    setIsGenerating(true);
    setGeneration(prev => prev + 1);  // Increment generation counter
    onChoiceSelected(choiceId);
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
        {/* Use NarrativeHistoryManager instead of NarrativeController to fix duplication issues */}
        <NarrativeHistoryManager
          key={controllerKey}
          sessionId={sessionId}
        />
        
        {/* Hidden controller just to generate content - always show it but hide from view */}
        <div style={{ display: 'none' }}>
          <NarrativeController
            key={`generator-${controllerKey}`}
            worldId={worldId}
            sessionId={sessionId}
            triggerGeneration={triggerGeneration || !initialized} // Force generation if not initialized
            choiceId={selectedChoiceId}
            onNarrativeGenerated={handleNarrativeGenerated}
          />
        </div>
      </div>

      {choices && choices.length > 0 && (
        <PlayerChoices
          choices={choices}
          onChoiceSelected={handleChoiceSelected}
          isDisabled={status !== 'active' || isGenerating}
        />
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

export default GameSessionActiveWithNarrative;