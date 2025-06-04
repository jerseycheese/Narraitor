'use client';

import React from 'react';

interface GameSessionLoadingProps {
  loadingMessage?: string;
}

const GameSessionLoading: React.FC<GameSessionLoadingProps> = ({
  loadingMessage = 'Loading game session...',
}) => {
  return (
    <div data-testid="game-session-loading" className="p-4" aria-live="polite" role="status">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-2">{loadingMessage}</p>
      </div>
    </div>
  );
};

export default GameSessionLoading;
