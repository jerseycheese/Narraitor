/**
 * Tests for error utility functions
 */

import {
  ErrorType,
  isRetryableError,
  getUserFriendlyError,
  createStoreError
} from '../errorUtils';

describe('errorUtils', () => {
  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const error = new Error('network connection failed');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for timeout errors', () => {
      const error = new Error('request timeout exceeded');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for 429 rate limit errors', () => {
      const error = new Error('429 too many requests');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for rate limit errors', () => {
      const error = new Error('rate limit exceeded');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for auth errors', () => {
      const error = new Error('401 unauthorized');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for validation errors', () => {
      const error = new Error('invalid input data');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for generic errors', () => {
      const error = new Error('something went wrong');
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('getUserFriendlyError', () => {
    it('should map network errors with generic message', () => {
      const error = new Error('network connection failed');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Connection Problem');
      expect(result.message).toBe('Unable to connect. Please check your internet connection.');
      expect(result.retryable).toBe(true);
      expect(result.type).toBe(ErrorType.NETWORK);
      expect(result.actionLabel).toBe('Try Again');
    });

    it('should map timeout errors with generic message', () => {
      const error = new Error('request timeout');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Request Timed Out');
      expect(result.message).toBe('The request is taking too long. Please try again.');
      expect(result.retryable).toBe(true);
      expect(result.type).toBe(ErrorType.NETWORK);
      expect(result.actionLabel).toBe('Try Again');
    });

    it('should map 429 rate limit errors with generic message', () => {
      const error = new Error('429 rate limit exceeded');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Too Many Requests');
      expect(result.message).toBe('Too many requests. Please wait a moment before trying again.');
      expect(result.retryable).toBe(true);
      expect(result.type).toBe(ErrorType.SERVICE);
      expect(result.actionLabel).toBe('Try Again Later');
    });

    it('should map rate limit text errors with generic message', () => {
      const error = new Error('rate limit exceeded');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Too Many Requests');
      expect(result.message).toBe('Too many requests. Please wait a moment before trying again.');
      expect(result.retryable).toBe(true);
      expect(result.type).toBe(ErrorType.SERVICE);
    });

    it('should map 401 auth errors with generic message', () => {
      const error = new Error('401 unauthorized');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Authentication Error');
      expect(result.message).toBe('Authentication failed. Please check your credentials.');
      expect(result.retryable).toBe(false);
      expect(result.type).toBe(ErrorType.AUTH);
    });

    it('should map unauthorized text errors with generic message', () => {
      const error = new Error('unauthorized access');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Authentication Error');
      expect(result.message).toBe('Authentication failed. Please check your credentials.');
      expect(result.retryable).toBe(false);
      expect(result.type).toBe(ErrorType.AUTH);
    });

    it('should map validation errors with generic message', () => {
      const error = new Error('validation failed: invalid email');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Validation Error');
      expect(result.message).toBe('The provided data is invalid. Please check your input and try again.');
      expect(result.retryable).toBe(false);
      expect(result.type).toBe(ErrorType.VALIDATION);
    });

    it('should map 400 bad request errors with generic message', () => {
      const error = new Error('400 bad request');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Validation Error');
      expect(result.message).toBe('The provided data is invalid. Please check your input and try again.');
      expect(result.retryable).toBe(false);
      expect(result.type).toBe(ErrorType.VALIDATION);
    });

    it('should map invalid errors with generic message', () => {
      const error = new Error('invalid data format');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Validation Error');
      expect(result.message).toBe('The provided data is invalid. Please check your input and try again.');
      expect(result.retryable).toBe(false);
      expect(result.type).toBe(ErrorType.VALIDATION);
    });

    it('should map malformed errors with generic message', () => {
      const error = new Error('malformed request');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Validation Error');
      expect(result.message).toBe('The provided data is invalid. Please check your input and try again.');
      expect(result.retryable).toBe(false);
      expect(result.type).toBe(ErrorType.VALIDATION);
    });

    it('should map unknown errors with generic message', () => {
      const error = new Error('something unexpected happened');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Something Went Wrong');
      expect(result.message).toBe("That didn't work.");
      expect(result.type).toBe(ErrorType.UNKNOWN);
      expect(result.actionLabel).toBe('Try Again');
    });

    it('should not expose raw error details in generic handler', () => {
      const error = new Error('/secret/path/file.ts: Database connection failed with internal error');
      const result = getUserFriendlyError(error);

      // Should not contain sensitive details
      expect(result.message).not.toContain('/secret/path');
      expect(result.message).not.toContain('Database');
      expect(result.message).not.toContain('internal error');
    });

    it('should determine retryability for unknown errors', () => {
      const retryableError = new Error('network issue occurred');
      const nonRetryableError = new Error('generic failure');

      expect(getUserFriendlyError(retryableError).retryable).toBe(true);
      expect(getUserFriendlyError(nonRetryableError).retryable).toBe(false);
    });
  });

  describe('getUserFriendlyError severity and suggestions', () => {
    it('should classify auth failures as critical', () => {
      const result = getUserFriendlyError(new Error('401 unauthorized'));
      expect(result.severity).toBe('critical');
      expect(result.suggestion).toBeTruthy();
    });

    it('should classify network errors as error severity', () => {
      const result = getUserFriendlyError(new Error('network connection failed'));
      expect(result.severity).toBe('error');
    });

    it('should classify timeout, rate-limit and validation as warning', () => {
      expect(getUserFriendlyError(new Error('request timeout')).severity).toBe('warning');
      expect(getUserFriendlyError(new Error('429 rate limit')).severity).toBe('warning');
      expect(getUserFriendlyError(new Error('invalid input')).severity).toBe('warning');
    });

    it('should default unknown errors to error severity', () => {
      expect(getUserFriendlyError(new Error('boom')).severity).toBe('error');
    });

    it('should include a plain-language suggestion for every mapped type', () => {
      const cases = [
        'network down',
        'request timeout',
        '429 rate limit',
        '401 unauthorized',
        'invalid input',
        'totally unexpected',
      ];

      for (const message of cases) {
        const result = getUserFriendlyError(new Error(message));
        expect(typeof result.suggestion).toBe('string');
        expect(result.suggestion!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('createStoreError', () => {
    it('should create error with default values', () => {
      const error = createStoreError('Not Found', 'The item could not be found');

      expect(error.title).toBe('Not Found');
      expect(error.message).toBe('The item could not be found');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.retryable).toBe(false);
      expect(error.severity).toBe('error');
    });

    it('should accept custom severity and suggestion', () => {
      const error = createStoreError(
        'Heads Up',
        'A minor issue occurred',
        ErrorType.VALIDATION,
        false,
        { severity: 'warning', suggestion: 'Double-check your input.' }
      );

      expect(error.severity).toBe('warning');
      expect(error.suggestion).toBe('Double-check your input.');
    });

    it('should create error with custom type', () => {
      const error = createStoreError(
        'Service Error',
        'The service is unavailable',
        ErrorType.SERVICE,
        true
      );

      expect(error.title).toBe('Service Error');
      expect(error.message).toBe('The service is unavailable');
      expect(error.type).toBe(ErrorType.SERVICE);
      expect(error.retryable).toBe(true);
    });

    it('should create error with network type', () => {
      const error = createStoreError(
        'Connection Failed',
        'Could not connect to server',
        ErrorType.NETWORK,
        true
      );

      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.retryable).toBe(true);
    });
  });

  // Note: createAPIErrorResponse now lives in its own module (it needs a
  // transport, and errorUtils stays a pure leaf) — see its colocated test.
});
