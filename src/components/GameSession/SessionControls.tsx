'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface SessionControlsProps {
  onEnd: () => void;
  onRestart?: () => void;
  onEndStory?: () => void;
}

const SessionControls: React.FC<SessionControlsProps> = ({
  onEnd,
  onRestart,
  onEndStory,
}) => {
  return (
    <div>
      <div>
        {onRestart && (
          <Button
            data-testid="game-session-controls-restart"
            variant="default"
            onClick={onRestart}
          >
            New Session
          </Button>
        )}
        {onEndStory && (
          <Button
            data-testid="game-session-controls-end-story"
            variant="secondary"
            
            onClick={onEndStory}
            title="End your story with an AI-generated epilogue"
          >
            End Story
          </Button>
        )}
        <Button
          data-testid="game-session-controls-end"
          variant="destructive"
          onClick={onEnd}
        >
          End Session
        </Button>
      </div>
    </div>
  );
};

export default SessionControls;
