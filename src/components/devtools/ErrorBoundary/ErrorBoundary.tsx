'use client';

import React, { Component, ReactNode } from 'react';
import { runtimeErrorLogger } from '@/lib/devtools/runtimeErrorLogger';
import { ErrorSeverity, ErrorCategory } from '@/types/runtime-error.types';
import { Button } from '@/components/ui/button';

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

/**
 * Error boundary component that captures React errors and logs them to DevTools
 * 
 * This component wraps child components and catches any JavaScript errors
 * that occur during rendering, in lifecycle methods, and in constructors
 * of the whole tree below them.
 * 
 * When an error is caught:
 * 1. The error is logged to the runtime error logger
 * 2. Component context information is captured
 * 3. A fallback UI is displayed
 * 4. Users can retry to reset the error state
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Static method called when an error is thrown during rendering
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  /**
   * Called when an error is caught by the boundary
   */
  componentDidCatch(error: Error | null, errorInfo: React.ErrorInfo | null) {
    // Extract component information from error
    const componentName = this.extractComponentName(errorInfo?.componentStack || undefined);
    const componentStack = errorInfo?.componentStack || 'No component stack available';

    // Log the error to the runtime error logger
    const errorId = runtimeErrorLogger.logError(
      error || 'Unknown error occurred',
      ErrorSeverity.HIGH,
      ErrorCategory.REACT,
      {
        componentContext: {
          componentName,
          componentStack,
          // Additional component info could be added here
        },
        additionalData: {
          errorInfo: errorInfo || 'No error info available'
        }
      }
    );

    // Update state with the error ID
    this.setState({ errorId });
  }

  /**
   * Extracts the component name from the component stack
   */
  private extractComponentName(componentStack?: string): string {
    if (!componentStack) {
      return 'Unknown';
    }

    // Extract the first component name from the stack
    const lines = componentStack.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('in ') || trimmedLine.startsWith('at ')) {
        const match = trimmedLine.match(/(?:in|at)\s+(\w+)/);
        if (match && match[1]) {
          return match[1];
        }
      }
    }

    return 'Unknown';
  }

  /**
   * Resets the error state to retry rendering
   */
  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-32 p-6 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-red-800">
              Something went wrong
            </h3>
            <p className="text-red-600 text-sm max-w-md">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {this.state.errorId && (
              <p className="text-xs text-red-500 font-mono">
                Error ID: {this.state.errorId}
              </p>
            )}
            <Button
              onClick={this.handleRetry}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              Try again
            </Button>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}