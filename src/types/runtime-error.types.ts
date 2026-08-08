/**
 * Runtime Error Types
 * 
 * Type definitions for runtime error capture and display in DevTools.
 * These types support error reporting with context information.
 */

/**
 * Severity levels for runtime errors
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Categories for different types of runtime errors
 */
export enum ErrorCategory {
  REACT = 'react',
  NETWORK = 'network',
  AI_SERVICE = 'ai_service',
  STATE_MANAGEMENT = 'state_management',
  STORAGE = 'storage',
  NAVIGATION = 'navigation',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

/**
 * Component context information when an error occurs
 */
export interface ErrorComponentContext {
  componentName: string;
  componentStack: string;
  props?: Record<string, unknown>;
  state?: Record<string, unknown>;
}

/**
 * Application state snapshot when error occurs
 */
export interface ErrorStateSnapshot {
  route: string;
  timestamp: Date;
  userAgent: string;
  localStorage?: Record<string, unknown>;
  sessionStorage?: Record<string, unknown>;
  url: string;
}

/**
 * Complete runtime error entry
 */
export interface RuntimeError {
  id: string;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: Date;
  componentContext?: ErrorComponentContext;
  stateSnapshot?: ErrorStateSnapshot;
  additionalData?: Record<string, unknown>;
  dismissed: boolean;
  count: number; // Number of times this error has occurred
}

/**
 * Error filter options for DevTools display
 */
export interface ErrorFilter {
  severity?: ErrorSeverity[];
  category?: ErrorCategory[];
  dismissed?: boolean;
  timeRange?: {
    start: Date;
    end: Date;
  };
  searchText?: string;
}

/**
 * Error statistics for DevTools summary
 */
export interface ErrorStatistics {
  total: number;
  bySeverity: Record<ErrorSeverity, number>;
  byCategory: Record<ErrorCategory, number>;
  recentCount: number; // Errors in last hour
}