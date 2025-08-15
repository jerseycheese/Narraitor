/**
 * Global Error Handler Hook
 * 
 * Sets up global error handling to capture runtime errors that occur outside
 * of React components and logs them to the DevTools error tracking system.
 */

import { useEffect } from 'react';
import { runtimeErrorLogger } from '@/lib/devtools/runtimeErrorLogger';
import { ErrorSeverity, ErrorCategory } from '@/types/runtime-error.types';

/**
 * Hook that sets up global error handlers for the application
 */
export const useGlobalErrorHandler = () => {
  useEffect(() => {
    // Handle uncaught JavaScript errors
    const handleError = (event: ErrorEvent) => {
      runtimeErrorLogger.logError(
        event.error || event.message || 'Unknown error',
        ErrorSeverity.HIGH,
        ErrorCategory.UNKNOWN,
        {
          additionalData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            type: 'uncaught-error'
          }
        }
      );
    };

    // Handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      runtimeErrorLogger.logError(
        event.reason || 'Unhandled promise rejection',
        ErrorSeverity.MEDIUM,
        ErrorCategory.UNKNOWN,
        {
          additionalData: {
            reason: event.reason,
            type: 'unhandled-rejection'
          }
        }
      );
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);
};