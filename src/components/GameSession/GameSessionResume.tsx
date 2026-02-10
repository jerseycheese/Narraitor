'use client';

import React from 'react';
import { SavedSessionInfo } from '@/types/game.types';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';

interface GameSessionResumeProps {
  savedSession: SavedSessionInfo;
  onResume: () => void;
  onNewGame: () => void;
}

const GameSessionResume: React.FC<GameSessionResumeProps> = ({
  savedSession,
  onResume,
  onNewGame,
}) => {
  const formattedDate = formatDateTime(savedSession.lastPlayed);

  return (
    <div data-testid="game-session-resume" >
      <div>
        <h2>Continue Your Story?</h2>
        
        <div>
          <p>Last played: {formattedDate}</p>
          <p>Progress: {savedSession.narrativeCount} scenes</p>
        </div>
        
        <div>
          <Button
            onClick={onResume}
            
            data-testid="resume-session-button"
            variant="default"
          >
            Continue Adventure
          </Button>
          
          <Button
            onClick={onNewGame}
            
            data-testid="new-session-button"
            variant="default"
          >
            Start New Adventure
          </Button>
        </div>
        
        <p>
          Starting a new adventure will save your current progress
        </p>
      </div>
    </div>
  );
};

export default GameSessionResume;
