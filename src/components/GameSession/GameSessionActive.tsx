'use client';

import React from 'react';
import { World } from '@/types/world.types';
import { ChoiceSelector } from '@/components/shared/ChoiceSelector';
import SessionControls from './SessionControls';

interface GameSessionActiveProps {
  narrative: {
    text: string;
    choices?: Array<{
      id: string;
      text: string;
      isSelected?: boolean;
    }>;
  };
  onChoiceSelected: (choiceId: string) => void;
  world?: World;
  currentSceneId?: string;
  status?: 'active' | 'paused' | 'ended';
  onPause?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
}

const GameSessionActive: React.FC<GameSessionActiveProps> = ({
  narrative,
  onChoiceSelected,
  world,
  currentSceneId,
  status = 'active',
  onPause,
  onResume,
  onEnd,
}) => {
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
        <h2 className="text-xl font-bold mb-2">Current Scene</h2>
        {currentSceneId && <p>Scene ID: {currentSceneId}</p>}
        <div aria-live="polite">
          <p className="italic text-gray-600 mt-2">{narrative.text}</p>
        </div>
      </div>

      {narrative.choices && narrative.choices.length > 0 && (
        <ChoiceSelector
          choices={narrative.choices}
          onSelect={onChoiceSelected}
          isDisabled={status !== 'active'}
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

export default GameSessionActive;