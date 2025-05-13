import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage from '../ErrorMessage';

describe('ErrorMessage', () => {
  const mockOnRetry = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render error message with retryable error', () => {
    const error = new Error('Network error');
    
    render(
      <ErrorMessage 
        error={error}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );
    
    expect(screen.getByTestId('error-message-container')).toBeInTheDocument();
    expect(screen.getByTestId('error-message-title')).toHaveTextContent('Connection Problem');
    expect(screen.getByTestId('error-message-text')).toHaveTextContent('Unable to connect to the AI service');
    expect(screen.getByTestId('error-message-retry-button')).toBeInTheDocument();
    expect(screen.getByTestId('error-message-dismiss-button')).toBeInTheDocument();
  });

  test('should render error message with non-retryable error', () => {
    const error = new Error('401 unauthorized');
    
    render(
      <ErrorMessage 
        error={error}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );
    
    expect(screen.getByTestId('error-message-container')).toBeInTheDocument();
    expect(screen.getByTestId('error-message-title')).toHaveTextContent('Authentication Error');
    expect(screen.queryByTestId('error-message-retry-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('error-message-dismiss-button')).toBeInTheDocument();
  });

  test('should not render when error is null', () => {
    render(
      <ErrorMessage 
        error={null}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );
    
    expect(screen.queryByTestId('error-message-container')).not.toBeInTheDocument();
  });

  test('should call onRetry when retry button is clicked', () => {
    const error = new Error('Network error');
    
    render(
      <ErrorMessage 
        error={error}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );
    
    fireEvent.click(screen.getByTestId('error-message-retry-button'));
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  test('should call onDismiss when dismiss button is clicked', () => {
    const error = new Error('Network error');
    
    render(
      <ErrorMessage 
        error={error}
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );
    
    fireEvent.click(screen.getByTestId('error-message-dismiss-button'));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });
});
