import { 
  isRetryableError, 
  getUserFriendlyError, 
  userFriendlyErrorMessage 
} from '../errorUtils';

describe('errorUtils', () => {
  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const error = new Error('Network error occurred');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for timeout errors', () => {
      const error = new Error('Request timeout');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for rate limit errors', () => {
      const error = new Error('429 rate limit exceeded');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for auth errors', () => {
      const error = new Error('401 unauthorized');
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('getUserFriendlyError', () => {
    it('should handle network errors', () => {
      const error = new Error('Network connection failed');
      const result = getUserFriendlyError(error);
      
      expect(result.title).toBe('Connection Problem');
      expect(result.retryable).toBe(true);
      expect(result.actionLabel).toBe('Try Again');
    });

    it('should handle timeout errors', () => {
      const error = new Error('Request timeout');
      const result = getUserFriendlyError(error);
      
      expect(result.title).toBe('Request Timed Out');
      expect(result.retryable).toBe(true);
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');
      const result = getUserFriendlyError(error);
      
      expect(result.title).toBe('Something Went Wrong');
      expect(result.actionLabel).toBe('Try Again');
    });
  });

  describe('userFriendlyErrorMessage', () => {
    it('should return just the message text', () => {
      const error = new Error('Network error');
      const message = userFriendlyErrorMessage(error);
      
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });
  });
});