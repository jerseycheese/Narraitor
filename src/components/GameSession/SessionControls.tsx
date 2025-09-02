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
    <div className="mt-6 flex gap-2 justify-end">
      <div className="flex gap-2">
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
            className="bg-blue-700 hover:bg-blue-700 text-white"
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
