'use client';

import React from 'react';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

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
      <ErrorDisplay
        variant="section"
        title="Game Session Error"
        message={error}
        severity="error"
        showRetry
        onRetry={onRetry}
        showDismiss={!!onDismiss}
        onDismiss={onDismiss}
      />
    </div>
  );
};

export default GameSessionError;
