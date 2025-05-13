// src/lib/ai/userFriendlyErrors.ts

import { isRetryableError } from './errors';

export interface UserFriendlyError {
  title: string;
  message: string;
  actionLabel?: string;
  retryable: boolean;
}

/**
 * Maps technical errors to user-friendly messages
 * @param error - The error to map
 * @returns User-friendly error object
 */
export function getUserFriendlyError(error: Error): UserFriendlyError {
  const message = error.message.toLowerCase();

  // Network errors
  if (message.includes('network')) {
    return {
      title: 'Connection Problem',
      message: 'Unable to connect to the AI service. Please check your internet connection.',
      actionLabel: 'Try Again',
      retryable: true
    };
  }

  // Timeout errors
  if (message.includes('timeout')) {
    return {
      title: 'Request Timed Out', 
      message: 'The AI service is taking too long to respond. Please try again.',
      actionLabel: 'Try Again',
      retryable: true
    };
  }

  // Rate limit errors
  if (message.includes('429') || message.includes('rate limit')) {
    return {
      title: 'Too Many Requests',
      message: 'You have made too many requests. Please wait a moment before trying again.',
      actionLabel: 'Try Again Later',
      retryable: true
    };
  }

  // Authentication errors
  if (message.includes('401') || message.includes('unauthorized')) {
    return {
      title: 'Authentication Error',
      message: 'Unable to authenticate with the AI service. Please check your API key.',
      retryable: false
    };
  }

  // Default for unknown errors
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    actionLabel: 'Try Again',
    retryable: isRetryableError(error)
  };
}
