import {
  isRetryableError,
  getUserFriendlyError,
  createAPIErrorResponse,
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

  describe('createAPIErrorResponse', () => {
    // Mock NextResponse
    const mockNextResponse = {
      json: jest.fn((body: unknown, init?: { status?: number }) => ({
        body,
        status: init?.status || 200
      }))
    };

    beforeEach(() => {
      jest.clearAllMocks();
      // Mock the require call in createAPIErrorResponse
      jest.mock('next/server', () => ({
        NextResponse: mockNextResponse
      }));
    });

    it('should create error response from Error object', () => {
      const error = new Error('400 bad request: invalid data');
      const response = createAPIErrorResponse(error, 400);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          title: 'Validation Error',
          type: ErrorType.VALIDATION,
          retryable: false
        }),
        { status: 400 }
      );
    });

    it('should create error response from string message', () => {
      const response = createAPIErrorResponse('Network error occurred', 500);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          title: 'Connection Problem',
          type: ErrorType.NETWORK,
          retryable: true
        }),
        { status: 500 }
      );
    });

    it('should include optional details when provided', () => {
      const error = new Error('Service error');
      const details = 'Specific error details here';
      const response = createAPIErrorResponse(error, 500, details);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: 'Specific error details here'
        }),
        { status: 500 }
      );
    });

    it('should default to status 500 when not specified', () => {
      const error = new Error('Unknown error');
      const response = createAPIErrorResponse(error);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expect.any(Object),
        { status: 500 }
      );
    });

    it('should include actionLabel when available', () => {
      const error = new Error('429 rate limit exceeded');
      const response = createAPIErrorResponse(error, 429);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          actionLabel: 'Try Again Later',
          retryable: true
        }),
        { status: 429 }
      );
    });

    it('should handle authentication errors correctly', () => {
      const error = new Error('401 unauthorized');
      const response = createAPIErrorResponse(error, 401);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Authentication Error',
          type: ErrorType.AUTH,
          retryable: false
        }),
        { status: 401 }
      );
    });
  });
});