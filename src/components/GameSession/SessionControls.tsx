'use client';

import React from 'react';

interface SessionControlsProps {
  status: 'active' | 'paused' | 'ended';
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}

const SessionControls: React.FC<SessionControlsProps> = ({
  status,
  onPause,
  onResume,
  onEnd,
}) => {
  const isPaused = status === 'paused';
  
  return (
    <div className="mt-6 flex justify-between">
      <button
        data-testid="game-session-controls-pause"
        className={`px-4 py-2 rounded transition-colors ${
          isPaused
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-yellow-600 text-white hover:bg-yellow-700'
        }`}
        onClick={isPaused ? onResume : onPause}
        aria-pressed={isPaused}
      >
        {isPaused ? '▶️ Resume' : '⏸️ Pause'}
      </button>
      <button
        data-testid="game-session-controls-end"
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        onClick={onEnd}
      >
        End Session
      </button>
    </div>
  );
};

export default SessionControls;