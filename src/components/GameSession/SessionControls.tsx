'use client';

import React from 'react';

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
          <button
            data-testid="game-session-controls-restart"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            onClick={onRestart}
          >
            New Session
          </button>
        )}
        {onEndStory && (
          <button
            data-testid="game-session-controls-end-story"
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            onClick={onEndStory}
            title="End your story with an AI-generated epilogue"
          >
            End Story
          </button>
        )}
        <button
          data-testid="game-session-controls-end"
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          onClick={onEnd}
        >
          End Session
        </button>
      </div>
    </div>
  );
};

export default SessionControls;
