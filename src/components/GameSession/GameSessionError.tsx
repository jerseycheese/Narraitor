'use client';

import React from 'react';
import ErrorMessage from '@/lib/components/ErrorMessage';

interface GameSessionErrorProps {
  error: string;
  onRetry: () => void;
  onDismiss?: () => void;
}

const GameSessionError: React.FC<GameSessionErrorProps> = ({
  error,
  onRetry,
  onDismiss,
}) => {
  return (
    <div data-testid="game-session-error">
      <ErrorMessage 
        error={new Error(error)}
        onRetry={onRetry}
        onDismiss={onDismiss || (() => {})}
      />
    </div>
  );
};

export default GameSessionError;