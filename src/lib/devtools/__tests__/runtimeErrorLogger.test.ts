/**
 * @jest-environment jsdom
 */

import { runtimeErrorLogger, RuntimeErrorLogger } from '../runtimeErrorLogger';
import { ErrorSeverity, ErrorCategory } from '@/types/runtime-error.types';

describe('RuntimeErrorLogger', () => {
  let logger: RuntimeErrorLogger;

  beforeEach(() => {
    logger = new RuntimeErrorLogger();
    jest.clearAllMocks();
  });

  describe('logError', () => {
    it('should log a basic error with auto-generated ID', () => {
      const error = new Error('Test error');
      
      const errorId = logger.logError(error, ErrorSeverity.MEDIUM, ErrorCategory.REACT);
      
      expect(errorId).toBeDefined();
      expect(typeof errorId).toBe('string');
      
      const loggedError = logger.getError(errorId);
      expect(loggedError).toBeDefined();
      expect(loggedError?.message).toBe('Test error');
      expect(loggedError?.severity).toBe(ErrorSeverity.MEDIUM);
      expect(loggedError?.category).toBe(ErrorCategory.REACT);
      expect(loggedError?.count).toBe(1);
      expect(loggedError?.dismissed).toBe(false);
    });

    it('should increment count for duplicate errors', () => {
      const error1 = new Error('Duplicate error');
      const error2 = new Error('Duplicate error');
      
      const errorId1 = logger.logError(error1, ErrorSeverity.HIGH, ErrorCategory.NETWORK);
      const errorId2 = logger.logError(error2, ErrorSeverity.HIGH, ErrorCategory.NETWORK);
      
      // Should return same ID for duplicate errors
      expect(errorId1).toBe(errorId2);
      
      const loggedError = logger.getError(errorId1);
      expect(loggedError?.count).toBe(2);
    });

    it('should include stack trace when available', () => {
      const error = new Error('Error with stack');
      
      const errorId = logger.logError(error, ErrorSeverity.CRITICAL, ErrorCategory.STATE_MANAGEMENT);
      
      const loggedError = logger.getError(errorId);
      expect(loggedError?.stack).toBeDefined();
      expect(typeof loggedError?.stack).toBe('string');
    });

    it('should capture component context when provided', () => {
      const error = new Error('Component error');
      const componentContext = {
        componentName: 'TestComponent',
        componentStack: 'at TestComponent\n  at App',
        props: { test: 'value' },
        state: { loading: false }
      };
      
      const errorId = logger.logError(
        error, 
        ErrorSeverity.HIGH, 
        ErrorCategory.REACT,
        { componentContext }
      );
      
      const loggedError = logger.getError(errorId);
      expect(loggedError?.componentContext).toEqual(componentContext);
    });

    it('should capture state snapshot when in browser environment', () => {
      // Mock window location
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/test',
          pathname: '/test'
        },
        writable: true
      });

      const error = new Error('Browser error');
      
      const errorId = logger.logError(error, ErrorSeverity.MEDIUM, ErrorCategory.NAVIGATION);
      
      const loggedError = logger.getError(errorId);
      expect(loggedError?.stateSnapshot).toBeDefined();
      expect(loggedError?.stateSnapshot?.route).toBe('/test');
      expect(loggedError?.stateSnapshot?.url).toBe('http://localhost:3000/test');
    });
  });

  describe('getErrors', () => {
    it('should return all errors and apply sorting', () => {
      logger.logError(new Error('First'), ErrorSeverity.LOW, ErrorCategory.VALIDATION);
      logger.logError(new Error('Second'), ErrorSeverity.MEDIUM, ErrorCategory.NETWORK);
      logger.logError(new Error('Third'), ErrorSeverity.HIGH, ErrorCategory.AI_SERVICE);
      
      const errors = logger.getErrors();
      
      expect(errors).toHaveLength(3);
      
      // Check that all errors are present
      const errorMessages = errors.map(e => e.message);
      expect(errorMessages).toContain('First');
      expect(errorMessages).toContain('Second');
      expect(errorMessages).toContain('Third');
      
      // Check that sorting function is applied (newest timestamp first)
      const sortedByTime = errors.slice().sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      expect(errors).toEqual(sortedByTime);
    });

    it('should apply severity filter correctly', () => {
      logger.logError(new Error('Low'), ErrorSeverity.LOW, ErrorCategory.REACT);
      logger.logError(new Error('Medium'), ErrorSeverity.MEDIUM, ErrorCategory.REACT);
      logger.logError(new Error('High'), ErrorSeverity.HIGH, ErrorCategory.REACT);
      logger.logError(new Error('Critical'), ErrorSeverity.CRITICAL, ErrorCategory.REACT);
      
      const highSeverityErrors = logger.getErrors({
        severity: [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL]
      });
      
      expect(highSeverityErrors).toHaveLength(2);
      expect(highSeverityErrors.every(e => 
        e.severity === ErrorSeverity.HIGH || e.severity === ErrorSeverity.CRITICAL
      )).toBe(true);
    });

    it('should apply category filter correctly', () => {
      logger.logError(new Error('React error'), ErrorSeverity.MEDIUM, ErrorCategory.REACT);
      logger.logError(new Error('Network error'), ErrorSeverity.HIGH, ErrorCategory.NETWORK);
      logger.logError(new Error('AI error'), ErrorSeverity.LOW, ErrorCategory.AI_SERVICE);
      
      const networkErrors = logger.getErrors({
        category: [ErrorCategory.NETWORK]
      });
      
      expect(networkErrors).toHaveLength(1);
      expect(networkErrors[0].category).toBe(ErrorCategory.NETWORK);
    });

    it('should apply dismissed filter correctly', () => {
      const errorId1 = logger.logError(new Error('Active'), ErrorSeverity.MEDIUM, ErrorCategory.REACT);
      const errorId2 = logger.logError(new Error('Dismissed'), ErrorSeverity.HIGH, ErrorCategory.NETWORK);
      
      logger.dismissError(errorId2);
      
      const activeErrors = logger.getErrors({ dismissed: false });
      const dismissedErrors = logger.getErrors({ dismissed: true });
      
      expect(activeErrors).toHaveLength(1);
      expect(activeErrors[0].id).toBe(errorId1);
      expect(dismissedErrors).toHaveLength(1);
      expect(dismissedErrors[0].id).toBe(errorId2);
    });
  });

  describe('dismissError', () => {
    it('should mark error as dismissed', () => {
      const errorId = logger.logError(new Error('Test'), ErrorSeverity.MEDIUM, ErrorCategory.REACT);
      
      logger.dismissError(errorId);
      
      const error = logger.getError(errorId);
      expect(error?.dismissed).toBe(true);
    });

    it('should handle non-existent error ID gracefully', () => {
      expect(() => {
        logger.dismissError('non-existent-id');
      }).not.toThrow();
    });
  });

  describe('clearErrors', () => {
    it('should remove all errors', () => {
      logger.logError(new Error('Error 1'), ErrorSeverity.LOW, ErrorCategory.REACT);
      logger.logError(new Error('Error 2'), ErrorSeverity.MEDIUM, ErrorCategory.NETWORK);
      
      expect(logger.getErrors()).toHaveLength(2);
      
      logger.clearErrors();
      
      expect(logger.getErrors()).toHaveLength(0);
    });
  });

  describe('getStatistics', () => {
    it('should return correct error statistics', () => {
      logger.logError(new Error('Low React'), ErrorSeverity.LOW, ErrorCategory.REACT);
      logger.logError(new Error('Medium React'), ErrorSeverity.MEDIUM, ErrorCategory.REACT);
      logger.logError(new Error('High Network'), ErrorSeverity.HIGH, ErrorCategory.NETWORK);
      logger.logError(new Error('Critical AI'), ErrorSeverity.CRITICAL, ErrorCategory.AI_SERVICE);
      
      const stats = logger.getStatistics();
      
      expect(stats.total).toBe(4);
      expect(stats.bySeverity[ErrorSeverity.LOW]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.MEDIUM]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.HIGH]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.CRITICAL]).toBe(1);
      expect(stats.byCategory[ErrorCategory.REACT]).toBe(2);
      expect(stats.byCategory[ErrorCategory.NETWORK]).toBe(1);
      expect(stats.byCategory[ErrorCategory.AI_SERVICE]).toBe(1);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(runtimeErrorLogger).toBeInstanceOf(RuntimeErrorLogger);
    });
  });
});