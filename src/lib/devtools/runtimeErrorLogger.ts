/**
 * Runtime Error Logger
 * 
 * Captures and manages runtime errors for DevTools display.
 * Provides filtering, statistics, and persistence capabilities.
 */

import { generateUniqueId } from '@/lib/utils/generateId';
import { 
  ErrorSeverity, 
  ErrorCategory, 
  type RuntimeError, 
  type ErrorFilter, 
  type ErrorStatistics,
  type ErrorComponentContext,
  type ErrorStateSnapshot
} from '@/types/runtime-error.types';

/**
 * Options for logging errors
 */
interface LogErrorOptions {
  componentContext?: ErrorComponentContext;
  additionalData?: Record<string, unknown>;
}

/**
 * Runtime error logger class
 */
class RuntimeErrorLogger {
  private errors: Map<string, RuntimeError> = new Map();
  private errorBySignature: Map<string, string> = new Map(); // signature -> errorId

  /**
   * Logs a runtime error with optional context
   */
  logError(
    error: Error | string,
    severity: ErrorSeverity,
    category: ErrorCategory,
    options: LogErrorOptions = {}
  ): string {
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;
    
    // Create a signature for duplicate detection
    const signature = this.createErrorSignature(message, severity, category);
    
    // Check if this error already exists
    const existingErrorId = this.errorBySignature.get(signature);
    if (existingErrorId) {
      const existingError = this.errors.get(existingErrorId);
      if (existingError) {
        existingError.count++;
        existingError.timestamp = new Date();
        return existingErrorId;
      }
    }

    // Create new error entry
    const errorId = generateUniqueId('error');
    const runtimeError: RuntimeError = {
      id: errorId,
      message,
      stack,
      severity,
      category,
      timestamp: new Date(),
      componentContext: options.componentContext,
      stateSnapshot: this.captureStateSnapshot(),
      additionalData: options.additionalData,
      dismissed: false,
      count: 1
    };

    this.errors.set(errorId, runtimeError);
    this.errorBySignature.set(signature, errorId);

    return errorId;
  }

  /**
   * Gets a specific error by ID
   */
  getError(errorId: string): RuntimeError | undefined {
    return this.errors.get(errorId);
  }

  /**
   * Gets all errors with optional filtering, sorted by timestamp (newest first)
   */
  getErrors(filter: ErrorFilter = {}): RuntimeError[] {
    let filteredErrors = Array.from(this.errors.values());

    // Apply severity filter
    if (filter.severity && filter.severity.length > 0) {
      filteredErrors = filteredErrors.filter(error => 
        filter.severity!.includes(error.severity)
      );
    }

    // Apply category filter
    if (filter.category && filter.category.length > 0) {
      filteredErrors = filteredErrors.filter(error => 
        filter.category!.includes(error.category)
      );
    }

    // Apply dismissed filter
    if (filter.dismissed !== undefined) {
      filteredErrors = filteredErrors.filter(error => 
        error.dismissed === filter.dismissed
      );
    }

    // Apply time range filter
    if (filter.timeRange) {
      filteredErrors = filteredErrors.filter(error => 
        error.timestamp >= filter.timeRange!.start &&
        error.timestamp <= filter.timeRange!.end
      );
    }

    // Apply search text filter
    if (filter.searchText && filter.searchText.trim()) {
      const searchText = filter.searchText.toLowerCase();
      filteredErrors = filteredErrors.filter(error => 
        error.message.toLowerCase().includes(searchText) ||
        error.componentContext?.componentName.toLowerCase().includes(searchText) ||
        error.stack?.toLowerCase().includes(searchText)
      );
    }

    // Sort by timestamp (newest first)
    return filteredErrors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Dismisses an error (marks it as dismissed)
   */
  dismissError(errorId: string): void {
    const error = this.errors.get(errorId);
    if (error) {
      error.dismissed = true;
    }
  }

  /**
   * Clears all errors
   */
  clearErrors(): void {
    this.errors.clear();
    this.errorBySignature.clear();
  }

  /**
   * Gets error statistics
   */
  getStatistics(): ErrorStatistics {
    const allErrors = Array.from(this.errors.values());
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const stats: ErrorStatistics = {
      total: allErrors.length,
      bySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0
      },
      byCategory: {
        [ErrorCategory.REACT]: 0,
        [ErrorCategory.NETWORK]: 0,
        [ErrorCategory.AI_SERVICE]: 0,
        [ErrorCategory.STATE_MANAGEMENT]: 0,
        [ErrorCategory.STORAGE]: 0,
        [ErrorCategory.NAVIGATION]: 0,
        [ErrorCategory.VALIDATION]: 0,
        [ErrorCategory.UNKNOWN]: 0
      },
      recentCount: 0
    };

    allErrors.forEach(error => {
      stats.bySeverity[error.severity]++;
      stats.byCategory[error.category]++;
      
      if (error.timestamp >= oneHourAgo) {
        stats.recentCount++;
      }
    });

    return stats;
  }

  /**
   * Creates a signature for error deduplication
   */
  private createErrorSignature(
    message: string, 
    severity: ErrorSeverity, 
    category: ErrorCategory
  ): string {
    return `${category}:${severity}:${message}`;
  }

  /**
   * Captures current application state snapshot
   */
  private captureStateSnapshot(): ErrorStateSnapshot | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }

    try {
      return {
        route: window.location.pathname,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        // Note: localStorage and sessionStorage capture could be added here
        // but we'll keep it minimal for now to avoid performance impact
      };
    } catch {
      // Fallback if state capture fails
      return {
        route: 'unknown',
        timestamp: new Date(),
        userAgent: 'unknown',
        url: 'unknown'
      };
    }
  }
}

// Export singleton instance
export const runtimeErrorLogger = new RuntimeErrorLogger();