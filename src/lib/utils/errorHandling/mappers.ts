/**
 * Specific error mappers for different domains
 * Consolidates error handling patterns from storage, AI, and API layers
 */

import { ErrorContext, ErrorMapper } from './types';
import { createErrorContext } from './core';

/**
 * Storage error mapper - handles IndexedDB and storage-related errors
 */
export const storageErrorMapper: ErrorMapper = (error: Error): ErrorContext => {
  const errorName = error.name || '';

  switch (errorName) {
    case 'QuotaExceededError':
      return createErrorContext(
        {
          code: 'STORAGE_QUOTA_EXCEEDED',
          message: 'Storage quota exceeded',
          retryable: true,
          cause: error
        },
        {
          title: 'Storage Full',
          message: 'Storage quota exceeded. Please free up some space.',
          actionLabel: 'Try Again',
          retryable: true,
          shouldNotify: true
        },
        {
          canRecover: true,
          strategy: 'manual'
        },
        'storage'
      );

    case 'SecurityError':
      return createErrorContext(
        {
          code: 'STORAGE_SECURITY_ERROR',
          message: 'Storage access denied',
          retryable: false,
          cause: error
        },
        {
          title: 'Storage Unavailable',
          message: 'Storage is unavailable in private browsing mode.',
          retryable: false,
          shouldNotify: true
        },
        {
          canRecover: false
        },
        'storage'
      );

    case 'NetworkError':
      return createErrorContext(
        {
          code: 'STORAGE_NETWORK_ERROR',
          message: 'Network error accessing storage',
          retryable: true,
          cause: error
        },
        {
          title: 'Connection Problem',
          message: 'Network error while accessing storage. Please check your connection.',
          actionLabel: 'Try Again',
          retryable: true,
          shouldNotify: true
        },
        {
          canRecover: true,
          strategy: 'retry'
        },
        'storage'
      );

    case 'DataError':
      return createErrorContext(
        {
          code: 'STORAGE_DATA_CORRUPTED',
          message: 'Storage data is corrupted',
          retryable: true,
          cause: error
        },
        {
          title: 'Data Corrupted',
          message: 'Storage data is corrupted. Resetting to defaults.',
          actionLabel: 'Reset',
          retryable: true,
          shouldNotify: true
        },
        {
          canRecover: true,
          strategy: 'reset'
        },
        'storage'
      );

    default:
      return createErrorContext(
        {
          code: 'STORAGE_UNKNOWN_ERROR',
          message: error.message || 'Unknown storage error',
          retryable: false,
          cause: error
        },
        {
          title: 'Storage Error',
          message: 'An error occurred while accessing storage.',
          retryable: false,
          shouldNotify: true
        },
        {
          canRecover: false
        },
        'storage'
      );
  }
};

/**
 * AI service error mapper - handles AI API and processing errors
 */
export const aiErrorMapper: ErrorMapper = (error: Error): ErrorContext => {
  const message = error.message.toLowerCase();

  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return createErrorContext(
      {
        code: 'AI_NETWORK_ERROR',
        message: 'Network error connecting to AI service',
        retryable: true,
        cause: error
      },
      {
        title: 'Connection Problem',
        message: 'Unable to connect to the AI service. Please check your internet connection.',
        actionLabel: 'Try Again',
        retryable: true,
        shouldNotify: true
      },
      {
        canRecover: true,
        strategy: 'retry'
      },
      'ai'
    );
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('aborted')) {
    return createErrorContext(
      {
        code: 'AI_TIMEOUT_ERROR',
        message: 'AI service request timed out',
        retryable: true,
        cause: error
      },
      {
        title: 'Request Timed Out',
        message: 'The AI service is taking too long to respond. Please try again.',
        actionLabel: 'Try Again',
        retryable: true,
        shouldNotify: true
      },
      {
        canRecover: true,
        strategy: 'retry'
      },
      'ai'
    );
  }

  // Rate limit errors
  if (message.includes('429') || message.includes('rate limit') || message.includes('too many requests')) {
    return createErrorContext(
      {
        code: 'AI_RATE_LIMIT_ERROR',
        message: 'AI service rate limit exceeded',
        retryable: true,
        cause: error
      },
      {
        title: 'Too Many Requests',
        message: 'You have made too many requests. Please wait a moment before trying again.',
        actionLabel: 'Try Again Later',
        retryable: true,
        shouldNotify: true
      },
      {
        canRecover: true,
        strategy: 'retry'
      },
      'ai'
    );
  }

  // Authentication errors
  if (message.includes('401') || message.includes('unauthorized') || message.includes('invalid api key')) {
    return createErrorContext(
      {
        code: 'AI_AUTH_ERROR',
        message: 'AI service authentication failed',
        retryable: false,
        cause: error
      },
      {
        title: 'Authentication Error',
        message: 'Unable to authenticate with the AI service. Please check your API key.',
        retryable: false,
        shouldNotify: true
      },
      {
        canRecover: false
      },
      'ai'
    );
  }

  // Content filtering or safety errors
  if (message.includes('safety') || message.includes('content filter') || message.includes('blocked')) {
    return createErrorContext(
      {
        code: 'AI_CONTENT_FILTERED',
        message: 'Content was filtered by AI safety systems',
        retryable: false,
        cause: error
      },
      {
        title: 'Content Filtered',
        message: 'The request was blocked by AI safety filters. Please try rephrasing.',
        actionLabel: 'Try Different Input',
        retryable: false,
        shouldNotify: true
      },
      {
        canRecover: true,
        strategy: 'manual'
      },
      'ai'
    );
  }

  // Default AI error
  return createErrorContext(
    {
      code: 'AI_UNKNOWN_ERROR',
      message: error.message || 'Unknown AI service error',
      retryable: true,
      cause: error
    },
    {
      title: 'AI Service Error',
      message: 'An unexpected error occurred with the AI service. Please try again.',
      actionLabel: 'Try Again',
      retryable: true,
      shouldNotify: true
    },
    {
      canRecover: true,
      strategy: 'retry'
    },
    'ai'
  );
};

/**
 * Network error mapper - handles general network and API errors
 */
export const networkErrorMapper: ErrorMapper = (error: Error): ErrorContext => {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch failed')) {
    return createErrorContext(
      {
        code: 'NETWORK_CONNECTION_ERROR',
        message: 'Network connection failed',
        retryable: true,
        cause: error
      },
      {
        title: 'Connection Problem',
        message: 'Unable to connect to the server. Please check your internet connection.',
        actionLabel: 'Try Again',
        retryable: true,
        shouldNotify: true
      },
      {
        canRecover: true,
        strategy: 'retry'
      },
      'network'
    );
  }

  if (message.includes('timeout')) {
    return createErrorContext(
      {
        code: 'NETWORK_TIMEOUT_ERROR',
        message: 'Network request timed out',
        retryable: true,
        cause: error
      },
      {
        title: 'Request Timed Out',
        message: 'The server is taking too long to respond. Please try again.',
        actionLabel: 'Try Again',
        retryable: true,
        shouldNotify: true
      },
      {
        canRecover: true,
        strategy: 'retry'
      },
      'network'
    );
  }

  return createErrorContext(
    {
      code: 'NETWORK_UNKNOWN_ERROR',
      message: error.message || 'Unknown network error',
      retryable: true,
      cause: error
    },
    {
      title: 'Network Error',
      message: 'A network error occurred. Please try again.',
      actionLabel: 'Try Again',
      retryable: true,
      shouldNotify: true
    },
    {
      canRecover: true,
      strategy: 'retry'
    },
    'network'
  );
};

/**
 * Validation error mapper - handles validation and input errors
 */
export const validationErrorMapper: ErrorMapper = (error: Error): ErrorContext => {
  return createErrorContext(
    {
      code: 'VALIDATION_ERROR',
      message: error.message || 'Validation failed',
      retryable: false,
      cause: error
    },
    {
      title: 'Invalid Input',
      message: error.message || 'Please check your input and try again.',
      actionLabel: 'Fix Input',
      retryable: false,
      shouldNotify: true
    },
    {
      canRecover: true,
      strategy: 'manual'
    },
    'validation'
  );
};