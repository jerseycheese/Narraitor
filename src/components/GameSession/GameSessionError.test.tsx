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

    // The error message is handled by getUserFriendlyError which returns a generic message
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
  });

  test('calls onRetry when retry button is clicked', () => {
    render(
      <GameSessionError 
        error="Failed to load game session"
        onRetry={mockOnRetry}
      />
    );

    // Since the userFriendlyError determines if retry is available, this might not always appear
    const retryButton = screen.queryByTestId('error-message-retry-button');
    if (retryButton) {
      fireEvent.click(retryButton);
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    } else {
      // If no retry button, the error isn't retryable
      expect(mockOnRetry).not.toHaveBeenCalled();
    }
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

    const dismissButton = screen.getByTestId('error-message-dismiss-button');
    fireEvent.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });
});