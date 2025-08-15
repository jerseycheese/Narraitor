/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';
import { runtimeErrorLogger } from '@/lib/devtools/runtimeErrorLogger';
import { ErrorSeverity, ErrorCategory } from '@/types/runtime-error.types';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Mock the error logger
jest.mock('@/lib/devtools/runtimeErrorLogger', () => ({
  runtimeErrorLogger: {
    logError: jest.fn(() => 'error-id-123')
  }
}));

describe('ErrorBoundary', () => {
  const mockLogError = runtimeErrorLogger.logError as jest.MockedFunction<typeof runtimeErrorLogger.logError>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Suppress console.error during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(mockLogError).not.toHaveBeenCalled();
  });

  it('should log error and show fallback UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show fallback UI
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    expect(screen.getByText(/Test error/)).toBeInTheDocument();

    // Should log error to the runtime error logger
    expect(mockLogError).toHaveBeenCalledWith(
      expect.any(Error),
      ErrorSeverity.HIGH,
      ErrorCategory.REACT,
      expect.objectContaining({
        componentContext: expect.objectContaining({
          componentName: 'ThrowError',
          componentStack: expect.any(String)
        })
      })
    );
  });

  it('should provide component context information', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const logCall = mockLogError.mock.calls[0];
    const options = logCall[3];
    
    expect(options?.componentContext?.componentName).toBe('ThrowError');
    expect(options?.componentContext?.componentStack).toContain('ThrowError');
  });

  it('should handle missing error gracefully', () => {
    // This tests the edge case where error might be undefined
    const ErrorBoundaryComponent = ErrorBoundary as unknown as new (props: unknown) => ErrorBoundary;
    const instance = new ErrorBoundaryComponent({});
    
    instance.componentDidCatch(null, { componentStack: 'test stack' });
    
    expect(mockLogError).toHaveBeenCalledWith(
      'Unknown error occurred',
      ErrorSeverity.HIGH,
      ErrorCategory.REACT,
      expect.any(Object)
    );
  });

  it('should handle missing error info gracefully', () => {
    const ErrorBoundaryComponent = ErrorBoundary as unknown as new (props: unknown) => ErrorBoundary;
    const instance = new ErrorBoundaryComponent({});
    
    instance.componentDidCatch(new Error('Test'), null);
    
    expect(mockLogError).toHaveBeenCalledWith(
      expect.any(Error),
      ErrorSeverity.HIGH,
      ErrorCategory.REACT,
      expect.objectContaining({
        componentContext: expect.objectContaining({
          componentName: 'Unknown',
          componentStack: 'No component stack available'
        })
      })
    );
  });

  it('should show retry button that resets error state', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error should be shown
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    
    // Click retry button
    const retryButton = screen.getByText('Try again');
    retryButton.click();

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should show normal content again
    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();
  });
});