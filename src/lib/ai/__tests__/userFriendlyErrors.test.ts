import { getUserFriendlyError } from '../userFriendlyErrors';

describe('getUserFriendlyError', () => {
  test('should map network error to user-friendly message', () => {
    const error = new Error('Network error');
    const result = getUserFriendlyError(error);
    
    expect(result).toEqual({
      title: 'Connection Problem',
      message: 'Unable to connect to the AI service. Please check your internet connection.',
      actionLabel: 'Try Again',
      retryable: true
    });
  });

  test('should map timeout error to user-friendly message', () => {
    const error = new Error('Request timeout');
    const result = getUserFriendlyError(error);
    
    expect(result).toEqual({
      title: 'Request Timed Out',
      message: 'The AI service is taking too long to respond. Please try again.',
      actionLabel: 'Try Again',
      retryable: true
    });
  });

  test('should map rate limit error to user-friendly message', () => {
    const error = new Error('429 rate limit exceeded');
    const result = getUserFriendlyError(error);
    
    expect(result).toEqual({
      title: 'Too Many Requests',
      message: 'You have made too many requests. Please wait a moment before trying again.',
      actionLabel: 'Try Again Later',
      retryable: true
    });
  });

  test('should map authentication error to user-friendly message', () => {
    const error = new Error('401 unauthorized');
    const result = getUserFriendlyError(error);
    
    expect(result).toEqual({
      title: 'Authentication Error',
      message: 'Unable to authenticate with the AI service. Please check your API key.',
      retryable: false
    });
  });

  test('should map unknown error to generic message', () => {
    const error = new Error('Unknown error occurred');
    const result = getUserFriendlyError(error);
    
    expect(result).toEqual({
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Please try again.',
      actionLabel: 'Try Again',
      retryable: false
    });
  });
});
