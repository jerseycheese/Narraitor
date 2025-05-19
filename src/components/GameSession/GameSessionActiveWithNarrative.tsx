'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { NarrativeHistory } from '@/components/Narrative/NarrativeHistory';
import { NarrativeController } from '@/components/Narrative/NarrativeController';
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
  existingSegments,
  choices,
  triggerGeneration = false,
  selectedChoiceId,
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleNarrativeGenerated = (segment: NarrativeSegment) => {
    console.log('Narrative generated:', segment);
    setIsGenerating(false);
  };

  const handleChoiceSelected = (choiceId: string) => {
    setIsGenerating(true);
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
        {existingSegments ? (
          // Use NarrativeHistory if we have existing segments
          <NarrativeHistory
            segments={existingSegments}
            isLoading={isGenerating}
          />
        ) : (
          // Use NarrativeController for dynamic generation
          <NarrativeController
            worldId={worldId}
            sessionId={sessionId}
            triggerGeneration={triggerGeneration}
            choiceId={selectedChoiceId}
            onNarrativeGenerated={handleNarrativeGenerated}
          />
        )}
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