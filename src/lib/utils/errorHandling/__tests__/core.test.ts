/**
 * Tests for core error handling functionality
 */

import {
  processError,
  createErrorContext,
  isRetryableError,
  extractErrorDetails,
  errorMapperRegistry
} from '../core';
import { ErrorMapper } from '../types';

describe('Error Handling Core', () => {
  beforeEach(() => {
    errorMapperRegistry.clear();
  });

  describe('processError', () => {
    it('should use registered mapper when pattern matches', () => {
      const testMapper: ErrorMapper = (error) => createErrorContext(
        { code: 'TEST_ERROR', message: error.message, retryable: true },
        { title: 'Test Error', message: 'Test message', retryable: true, shouldNotify: true },
        { canRecover: true },
        'unknown'
      );

      errorMapperRegistry.register(
        (error) => error.message.includes('test'),
        testMapper
      );

      const error = new Error('This is a test error');
      const result = processError(error);

      expect(result.code).toBe('TEST_ERROR');
      expect(result.userError.title).toBe('Test Error');
      expect(result.domain).toBe('unknown');
    });

    it('should use default mapper when no pattern matches', () => {
      const error = new Error('Unknown error');
      const result = processError(error);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.userError.title).toBe('Something Went Wrong');
      expect(result.domain).toBe('unknown');
      expect(result.retryable).toBe(false);
    });

    it('should include timestamp and cause in error context', () => {
      const originalError = new Error('Original error');
      const result = processError(originalError);

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.cause).toBe(originalError);
    });
  });

  describe('createErrorContext', () => {
    it('should create complete error context with all fields', () => {
      const result = createErrorContext(
        { code: 'TEST_CODE', message: 'Test message', retryable: true },
        { title: 'Test Title', message: 'User message', retryable: true, shouldNotify: false },
        { canRecover: true, strategy: 'retry' },
        'storage'
      );

      expect(result.code).toBe('TEST_CODE');
      expect(result.message).toBe('Test message');
      expect(result.retryable).toBe(true);
      expect(result.userError.title).toBe('Test Title');
      expect(result.userError.message).toBe('User message');
      expect(result.userError.shouldNotify).toBe(false);
      expect(result.recovery.canRecover).toBe(true);
      expect(result.recovery.strategy).toBe('retry');
      expect(result.domain).toBe('storage');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should use defaults for missing fields', () => {
      const result = createErrorContext({}, {});

      expect(result.code).toBe('GENERIC_ERROR');
      expect(result.message).toBe('An error occurred');
      expect(result.retryable).toBe(false);
      expect(result.userError.title).toBe('Error');
      expect(result.userError.message).toBe('An error occurred');
      expect(result.userError.shouldNotify).toBe(true);
      expect(result.recovery.canRecover).toBe(false);
      expect(result.domain).toBe('unknown');
    });
  });

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      const networkErrors = [
        new Error('Network error occurred'),
        new Error('Connection timeout'),
        new Error('Fetch failed'),
        new Error('Connection refused')
      ];

      networkErrors.forEach(error => {
        expect(isRetryableError(error)).toBe(true);
      });
    });

    it('should identify rate limit errors as retryable', () => {
      const rateLimitErrors = [
        new Error('429 Too Many Requests'),
        new Error('Rate limit exceeded'),
        new Error('Too many requests')
      ];

      rateLimitErrors.forEach(error => {
        expect(isRetryableError(error)).toBe(true);
      });
    });

    it('should identify server errors as retryable', () => {
      const serverErrors = [
        new Error('500 Internal Server Error'),
        new Error('502 Bad Gateway'),
        new Error('503 Service Unavailable'),
        new Error('504 Gateway Timeout')
      ];

      serverErrors.forEach(error => {
        expect(isRetryableError(error)).toBe(true);
      });
    });

    it('should identify auth errors as non-retryable', () => {
      const authErrors = [
        new Error('401 Unauthorized'),
        new Error('403 Forbidden'),
        new Error('Invalid API key'),
        new Error('Validation failed')
      ];

      authErrors.forEach(error => {
        expect(isRetryableError(error)).toBe(false);
      });
    });

    it('should default unknown errors to non-retryable', () => {
      const unknownError = new Error('Some random error');
      expect(isRetryableError(unknownError)).toBe(false);
    });
  });

  describe('extractErrorDetails', () => {
    it('should extract basic error properties', () => {
      const error = new Error('Test error');
      error.name = 'TestError';
      
      const details = extractErrorDetails(error);

      expect(details.name).toBe('TestError');
      expect(details.message).toBe('Test error');
      expect(details.stack).toBeDefined();
    });

    it('should extract additional properties from custom errors', () => {
      const customError = Object.assign(new Error('Custom error'), {
        code: 'CUSTOM_CODE',
        status: 500,
        cause: new Error('Root cause')
      });

      const details = extractErrorDetails(customError);

      expect(details.code).toBe('CUSTOM_CODE');
      expect(details.status).toBe(500);
      expect(details.cause).toBeInstanceOf(Error);
    });
  });
});