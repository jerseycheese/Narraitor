/**
 * Tests for AI-specific user-friendly error handling
 */

import { getUserFriendlyError, userFriendlyError } from '../userFriendlyErrors';
import { ErrorType } from '@/lib/utils/errorUtils';

describe('userFriendlyErrors (AI-specific)', () => {
  describe('getUserFriendlyError', () => {
    it('should provide AI-specific context with sanitized error for network errors', () => {
      const error = new Error('network connection failed');
      const result = getUserFriendlyError(error);

      expect(result.message).toContain('AI service');
      expect(result.message).toContain('network connection failed');
      expect(result.type).toBe(ErrorType.NETWORK);
      expect(result.retryable).toBe(true);
    });

    it('should provide AI-specific context with sanitized error for timeout errors', () => {
      const error = new Error('request timeout');
      const result = getUserFriendlyError(error);

      expect(result.message).toContain('AI service');
      expect(result.message).toContain('timed out');
      expect(result.message).toContain('request timeout');
      expect(result.type).toBe(ErrorType.NETWORK);
      expect(result.retryable).toBe(true);
    });

    it('should provide AI-specific context with sanitized error for rate limit errors', () => {
      const error = new Error('429 rate limit');
      const result = getUserFriendlyError(error);

      expect(result.message).toContain('rate limit');
      expect(result.message).toContain('429 rate limit');
      expect(result.type).toBe(ErrorType.SERVICE);
      expect(result.retryable).toBe(true);
    });

    it('should provide AI-specific context with sanitized error for auth errors', () => {
      const error = new Error('401 unauthorized');
      const result = getUserFriendlyError(error);

      expect(result.message).toContain('authentication');
      expect(result.message).toContain('401 unauthorized');
      expect(result.type).toBe(ErrorType.AUTH);
      expect(result.retryable).toBe(false);
    });

    it('should sanitize file paths from error messages', () => {
      const error = new Error('network error at /usr/local/lib/node_modules/package.js');
      const result = getUserFriendlyError(error);

      expect(result.message).not.toContain('/usr/local');
      expect(result.message).toContain('[path]');
    });

    it('should truncate very long error messages', () => {
      const longError = 'A'.repeat(300);
      const error = new Error(`network error: ${longError}`);

      const result = getUserFriendlyError(error);

      expect(result.message.length).toBeLessThan(250); // Base message + truncated detail
      expect(result.message).toContain('...');
    });

    it('should handle rate limit text variations with sanitization', () => {
      const error = new Error('rate limit exceeded');
      const result = getUserFriendlyError(error);

      expect(result.message).toContain('rate limit');
      expect(result.message).toContain('rate limit exceeded');
      expect(result.retryable).toBe(true);
    });

    it('should fall back to base error handler for unknown errors', () => {
      const error = new Error('unexpected error');
      const result = getUserFriendlyError(error);

      expect(result.title).toBe('Something Went Wrong');
      expect(result.type).toBe(ErrorType.UNKNOWN);
    });

    it('should preserve error structure from base handler', () => {
      const error = new Error('validation failed');
      const result = getUserFriendlyError(error);

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('retryable');
      expect(result).toHaveProperty('type');
    });
  });

  describe('userFriendlyError', () => {
    it('should return just the message string for network errors', () => {
      const error = new Error('network failure');
      const message = userFriendlyError(error);

      expect(typeof message).toBe('string');
      expect(message).toContain('AI service');
      expect(message).toContain('network failure');
    });

    it('should return just the message string for timeout errors', () => {
      const error = new Error('timeout occurred');
      const message = userFriendlyError(error);

      expect(typeof message).toBe('string');
      expect(message).toContain('timeout');
      expect(message).toContain('timeout occurred');
    });

    it('should return just the message string for rate limit errors', () => {
      const error = new Error('429 rate limit');
      const message = userFriendlyError(error);

      expect(typeof message).toBe('string');
      expect(message).toContain('rate limit');
      expect(message).toContain('429 rate limit');
    });

    it('should return just the message string for auth errors', () => {
      const error = new Error('401 unauthorized');
      const message = userFriendlyError(error);

      expect(typeof message).toBe('string');
      expect(message).toContain('authentication');
      expect(message).toContain('401 unauthorized');
    });

    it('should return just the message string for unknown errors', () => {
      const error = new Error('something went wrong');
      const message = userFriendlyError(error);

      expect(typeof message).toBe('string');
      expect(message).toContain('something went wrong');
      expect(message.length).toBeGreaterThan(0);
    });
  });
});
