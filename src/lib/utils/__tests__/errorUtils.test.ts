import { 
  isRetryableError, 
  getUserFriendlyError, 
  userFriendlyErrorMessage,
  ErrorType 
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

    it('should handle validation errors', () => {
      const error = new Error('400 bad request: invalid data');
      const result = getUserFriendlyError(error);
      
      expect(result.title).toBe('Validation Error');
      expect(result.retryable).toBe(false);
      expect(result.type).toBe(ErrorType.VALIDATION);
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

  describe('ErrorType categorization', () => {
    it('should include type property for network errors', () => {
      const error = new Error('Network connection failed');
      const result = getUserFriendlyError(error);
      
      expect(result.type).toBe(ErrorType.NETWORK);
    });

    it('should include type property for authentication errors', () => {
      const error = new Error('401 unauthorized');
      const result = getUserFriendlyError(error);
      
      expect(result.type).toBe(ErrorType.AUTH);
    });

    it('should include type property for validation errors', () => {
      const error = new Error('Validation failed: invalid input');
      const result = getUserFriendlyError(error);
      
      expect(result.type).toBe(ErrorType.VALIDATION);
      expect(result.retryable).toBe(false);
    });

    it('should include type property for rate limit errors', () => {
      const error = new Error('Rate limit exceeded');
      const result = getUserFriendlyError(error);
      
      expect(result.type).toBe(ErrorType.SERVICE);
    });

    it('should include type property for unknown errors', () => {
      const error = new Error('Something strange happened');
      const result = getUserFriendlyError(error);
      
      expect(result.type).toBe(ErrorType.UNKNOWN);
    });

    it('should allow conditional error handling based on type', () => {
      const networkError = new Error('Network timeout');
      const authError = new Error('401 unauthorized');
      
      const networkResult = getUserFriendlyError(networkError);
      const authResult = getUserFriendlyError(authError);
      
      // Conditional handling based on error type
      if (networkResult.type === ErrorType.NETWORK) {
        expect(networkResult.retryable).toBe(true);
      }
      
      if (authResult.type === ErrorType.AUTH) {
        expect(authResult.retryable).toBe(false);
      }
    });
  });
});