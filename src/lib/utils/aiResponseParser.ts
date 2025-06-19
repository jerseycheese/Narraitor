// src/lib/utils/aiResponseParser.ts

/**
 * Utility functions for parsing AI responses across different features
 */

export interface AIResponse {
  content?: string;
  tokenUsage?: number;
}

/**
 * Parse JSON from AI response with proper error handling
 */
export function parseAIJsonResponse<T>(response: AIResponse, errorMessage: string = 'Failed to parse AI response'): T {
  if (!response.content) {
    throw new Error('No content received from AI service');
  }

  try {
    return JSON.parse(response.content);
  } catch (parseError) {
    throw new Error(errorMessage);
  }
}

/**
 * Validate that a parsed object has required fields
 */
export function validateRequiredFields(
  obj: any, 
  requiredFields: string[], 
  objectName: string = 'object'
): void {
  for (const field of requiredFields) {
    if (!(field in obj)) {
      throw new Error(`Invalid ${objectName}: missing ${field}`);
    }
  }
}

/**
 * Validate array fields in parsed objects
 */
export function validateArrayFields(
  obj: any,
  arrayFields: string[],
  objectName: string = 'object'
): void {
  for (const field of arrayFields) {
    if (!Array.isArray(obj[field])) {
      throw new Error(`Invalid ${objectName}: ${field} must be an array`);
    }
  }
}

/**
 * Generic AI response handler with retry logic
 */
export async function handleAIRequest<T>(
  aiCall: () => Promise<AIResponse>,
  parser: (response: AIResponse) => T,
  maxRetries: number = 2
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await aiCall();
      return parser(response);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on parsing errors, only on network/AI errors
      if (lastError.message.includes('parse') || lastError.message.includes('Invalid')) {
        break;
      }
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError!;
}