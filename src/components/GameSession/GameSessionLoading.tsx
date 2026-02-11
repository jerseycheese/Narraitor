'use client';

import React from 'react';
import { LoadingState } from '@/components/ui/LoadingState/LoadingState';
import { GAME_SESSION_STABLE_COLUMN_HEIGHT } from './layoutStability';

interface GameSessionLoadingProps {
  loadingMessage?: string;
}

const GameSessionLoading: React.FC<GameSessionLoadingProps> = ({
  loadingMessage = 'Loading your game...',
}) => {
  return (
    <div
      data-testid="game-session-loading"
      style={{ minHeight: GAME_SESSION_STABLE_COLUMN_HEIGHT }}
    >
      <LoadingState
        message={loadingMessage}
        size="md"
        theme="light"
        centered={true}
      />
    </div>
  );
};

export default GameSessionLoading;
