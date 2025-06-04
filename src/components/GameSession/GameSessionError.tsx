'use client';

import React from 'react';
import { SectionError } from '@/components/ui/ErrorDisplay/ErrorDisplay';

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
      <SectionError 
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
