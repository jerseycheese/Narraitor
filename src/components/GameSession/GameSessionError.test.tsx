import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GameSessionError from './GameSessionError';

describe('GameSessionError', () => {
  const mockOnRetry = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders error message', () => {
    render(
      <GameSessionError 
        error="Failed to load game session"
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('Game Session Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load game session')).toBeInTheDocument();
  });

  test('calls onRetry when retry button is clicked', () => {
    render(
      <GameSessionError 
        error="Failed to load game session"
        onRetry={mockOnRetry}
      />
    );

    const retryButton = screen.getByRole('button', { name: /Try Again/ });
    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  test('renders dismiss button when onDismiss is provided', () => {
    render(
      <GameSessionError 
        error="Failed to load game session"
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    const dismissButton = screen.getByRole('button', { name: /Dismiss/ });
    expect(dismissButton).toBeInTheDocument();
  });

  test('calls onDismiss when dismiss button is clicked', () => {
    render(
      <GameSessionError 
        error="Failed to load game session"
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );

    const dismissButton = screen.getByRole('button', { name: /Dismiss/ });
    fireEvent.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });
});
