/**
 * Tests for error utility functions
 */

import {
  ErrorType,
  isRetryableError,
  getUserFriendlyError,
  createStoreError,
  createAPIErrorResponse
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
    it('should map network errors correctly', () => {
      const error = new Error('network connection failed');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Connection Problem');
      expect(result.message).toContain('Unable to connect');
      expect(result.message).toContain('network connection failed');
      expect(result.retryable).toBe(true);
      expect(result.type).toBe(ErrorType.NETWORK);
      expect(result.actionLabel).toBe('Try Again');
    });

    it('should map timeout errors correctly', () => {
      const error = new Error('request timeout');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Request Timed Out');
      expect(result.message).toContain('timed out');
      expect(result.message).toContain('request timeout');
      expect(result.retryable).toBe(true);
      expect(result.type).toBe(ErrorType.NETWORK);
      expect(result.actionLabel).toBe('Try Again');
    });

    it('should map 429 rate limit errors correctly', () => {
      const error = new Error('429 rate limit exceeded');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Too Many Requests');
      expect(result.message).toContain('Rate limit');
      expect(result.message).toContain('429 rate limit exceeded');
      expect(result.retryable).toBe(true);
      expect(result.type).toBe(ErrorType.SERVICE);
      expect(result.actionLabel).toBe('Try Again Later');
    });

    it('should map rate limit text errors correctly', () => {
      const error = new Error('rate limit exceeded');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Too Many Requests');
      expect(result.message).toContain('rate limit exceeded');
      expect(result.retryable).toBe(true);
      expect(result.type).toBe(ErrorType.SERVICE);
    });

    it('should map 401 auth errors correctly', () => {
      const error = new Error('401 unauthorized');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Authentication Error');
      expect(result.message).toContain('Authentication failed');
      expect(result.message).toContain('401 unauthorized');
      expect(result.retryable).toBe(false);
      expect(result.type).toBe(ErrorType.AUTH);
    });

    it('should map unauthorized text errors correctly', () => {
      const error = new Error('unauthorized access');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Authentication Error');
      expect(result.message).toContain('unauthorized access');
      expect(result.retryable).toBe(false);
      expect(result.type).toBe(ErrorType.AUTH);
    });

    it('should map validation errors correctly', () => {
      const error = new Error('validation failed: invalid email');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Validation Error');
      expect(result.message).toContain('Invalid data');
      expect(result.message).toContain('validation failed');
      expect(result.retryable).toBe(false);
      expect(result.type).toBe(ErrorType.VALIDATION);
    });

    it('should map 400 bad request errors correctly', () => {
      const error = new Error('400 bad request');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Validation Error');
      expect(result.message).toContain('400 bad request');
      expect(result.retryable).toBe(false);
      expect(result.type).toBe(ErrorType.VALIDATION);
    });

    it('should map invalid errors correctly', () => {
      const error = new Error('invalid data format');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Validation Error');
      expect(result.message).toContain('invalid data format');
      expect(result.retryable).toBe(false);
      expect(result.type).toBe(ErrorType.VALIDATION);
    });

    it('should map malformed errors correctly', () => {
      const error = new Error('malformed request');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Validation Error');
      expect(result.message).toContain('malformed request');
      expect(result.retryable).toBe(false);
      expect(result.type).toBe(ErrorType.VALIDATION);
    });

    it('should map unknown errors with default message', () => {
      const error = new Error('something unexpected happened');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Something Went Wrong');
      expect(result.message).toContain('Error');
      expect(result.message).toContain('something unexpected happened');
      expect(result.type).toBe(ErrorType.UNKNOWN);
      expect(result.actionLabel).toBe('Try Again');
    });

    it('should determine retryability for unknown errors', () => {
      const retryableError = new Error('network issue occurred');
      const nonRetryableError = new Error('generic failure');

      expect(getUserFriendlyError(retryableError).retryable).toBe(true);
      expect(getUserFriendlyError(nonRetryableError).retryable).toBe(false);
    });
  });

  describe('createStoreError', () => {
    it('should create error with default values', () => {
      const error = createStoreError('Not Found', 'The item could not be found');

      expect(error.title).toBe('Not Found');
      expect(error.message).toBe('The item could not be found');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.retryable).toBe(false);
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

  // Note: createAPIErrorResponse tests are skipped because they require Next.js server environment
  // The function is a thin wrapper around NextResponse.json() and is better tested via integration tests
  // The core error mapping logic is already tested via getUserFriendlyError() tests above
});
