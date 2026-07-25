'use client';

import React from 'react';
import { LoadingState } from '@/components/ui/LoadingState/LoadingState';

interface GameSessionLoadingProps {
  loadingMessage?: string;
}

const GameSessionLoading: React.FC<GameSessionLoadingProps> = ({
  loadingMessage = 'Loading your game...',
}) => {
  return (
    <div data-testid="game-session-loading" className="component-loading-center">
      <LoadingState
        message={loadingMessage}
        size="md"
      />
    </div>
  );
};

export default GameSessionLoading;
