// src/lib/utils/aiResponseParser.ts

/**
 * Utility functions for parsing AI responses across different features
 * Enhanced with type guard validation for runtime type safety
 */

import { ValidationResult } from '@/lib/utils/validationUtils';

export interface AIResponse {
  content?: string;
  tokenUsage?: number;
}

/**
 * Attempt to repair truncated or malformed JSON
 */
function attemptJsonRepair(jsonStr: string): string {
  let repaired = jsonStr.trim();
  
  // Count braces and brackets to detect truncation
  const openBraces = (repaired.match(/\{/g) || []).length;
  const closeBraces = (repaired.match(/\}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;
  
  // If we have unmatched opening braces/brackets, try to close them
  if (openBraces > closeBraces || openBrackets > closeBrackets) {
    // Remove trailing incomplete elements (like unclosed strings or arrays)
    // Look for patterns that suggest truncation
    repaired = repaired.replace(/,\s*$/, ''); // Remove trailing comma
    repaired = repaired.replace(/,\s*[^,}]+$/, ''); // Remove incomplete last element
    repaired = repaired.replace(/:\s*[^,}]*$/, ': ""'); // Complete incomplete value with empty string
    
    // Close unmatched brackets
    const missingCloseBrackets = openBrackets - closeBrackets;
    const missingCloseBraces = openBraces - closeBraces;
    
    for (let i = 0; i < missingCloseBrackets; i++) {
      repaired += ']';
    }
    for (let i = 0; i < missingCloseBraces; i++) {
      repaired += '}';
    }
  }
  
  return repaired;
}

/**
 * Parse JSON from AI response with proper error handling and markdown code block support
 */
export function parseAIJsonResponse<T>(response: AIResponse, errorMessage: string = 'Failed to parse AI response'): T {
  if (!response.content) {
    throw new Error('No content received from AI service');
  }

  try {
    // First try to parse directly
    return JSON.parse(response.content);
  } catch {
    try {
      // Fallback to extract JSON from response if not pure JSON
      // Look for JSON wrapped in markdown code blocks
      const codeBlockMatch = response.content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        return JSON.parse(codeBlockMatch[1]);
      } else {
        // Look for JSON object anywhere in the content
        // Use a more flexible regex that allows nested objects
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          // Try to parse the JSON, but if it fails due to truncation, attempt to fix it
          let jsonStr = jsonMatch[0];
          try {
            return JSON.parse(jsonStr);
          } catch {
            // If JSON appears to be truncated, try to complete it
            jsonStr = attemptJsonRepair(jsonStr);
            return JSON.parse(jsonStr);
          }
        } else {
          throw new Error('No valid JSON found in response');
        }
      }
    } catch (parseError) {
      const originalError = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      throw new Error(`${errorMessage}. Original error: ${originalError}. Content: ${response.content?.substring(0, 100)}...`);
    }
  }
}

/**
 * Validate that a parsed object has required fields
 */
export function validateRequiredFields(
  obj: unknown, 
  requiredFields: string[], 
  objectName: string = 'object'
): void {
  const typedObj = obj as Record<string, unknown>;
  for (const field of requiredFields) {
    if (!(field in typedObj)) {
      throw new Error(`Invalid ${objectName}: missing ${field}`);
    }
  }
}

/**
 * Validate array fields in parsed objects
 */
export function validateArrayFields(
  obj: Record<string, unknown>,
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
 * Enhanced validation using type guards for runtime type safety
 */
export function validateWithTypeGuard<T>(
  data: unknown,
  validator: (data: unknown) => ValidationResult,
  objectName: string = 'object',
  fallbackData?: T
): T {
  const validation = validator(data);
  
  if (!validation.valid) {
    const errorMessage = `Invalid ${objectName}: ${validation.errors[0]}`;
    
    if (fallbackData) {
      console.warn(`${errorMessage}, using fallback data`);
      return fallbackData;
    }
    
    throw new Error(errorMessage);
  }
  
  return data as T;
}

/**
 * Parse and validate AI JSON response with type guard integration
 */
export function parseAndValidateAIResponse<T>(
  response: AIResponse,
  validator: (data: unknown) => ValidationResult,
  objectName: string = 'AI response',
  fallbackData?: T
): T {
  const parsed = parseAIJsonResponse<unknown>(response, `Failed to parse ${objectName}`);
  return validateWithTypeGuard(parsed, validator, objectName, fallbackData);
}

/**
 * Validate array elements using type guards
 */
export function validateArrayElements<T>(
  array: unknown[],
  validator: (data: unknown) => ValidationResult,
  objectName: string = 'array element',
  removeInvalid: boolean = false
): T[] {
  const results: T[] = [];
  
  for (let i = 0; i < array.length; i++) {
    const element = array[i];
    const validation = validator(element);
    
    if (validation.valid) {
      results.push(element as T);
    } else {
      const errorMessage = `Invalid ${objectName} at index ${i}: ${validation.errors[0]}`;
      
      if (removeInvalid) {
        console.warn(`${errorMessage}, removing from array`);
        continue; // Skip invalid element
      } else {
        throw new Error(errorMessage);
      }
    }
  }
  
  return results;
}

/**
 * Enhanced field validation with type checking
 */
export function validateTypedFields(
  obj: unknown,
  fieldValidations: Array<{
    field: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    validator?: (value: unknown) => ValidationResult;
  }>,
  objectName: string = 'object'
): void {
  if (!obj || typeof obj !== 'object') {
    throw new Error(`Invalid ${objectName}: must be an object`);
  }
  
  const typedObj = obj as Record<string, unknown>;
  
  for (const validation of fieldValidations) {
    const { field, type, required = true, validator } = validation;
    const value = typedObj[field];
    
    // Check if required field is missing
    if (required && (value === undefined || value === null)) {
      throw new Error(`Invalid ${objectName}: missing required field '${field}'`);
    }
    
    // Skip validation if field is optional and not present
    if (!required && (value === undefined || value === null)) {
      continue;
    }
    
    // Validate field type
    let typeValid = false;
    switch (type) {
      case 'string':
        typeValid = typeof value === 'string';
        break;
      case 'number':
        typeValid = typeof value === 'number' && !isNaN(value);
        break;
      case 'boolean':
        typeValid = typeof value === 'boolean';
        break;
      case 'array':
        typeValid = Array.isArray(value);
        break;
      case 'object':
        typeValid = typeof value === 'object' && value !== null && !Array.isArray(value);
        break;
    }
    
    if (!typeValid) {
      throw new Error(`Invalid ${objectName}: field '${field}' must be of type ${type}`);
    }
    
    // Run custom validator if provided
    if (validator) {
      const validationResult = validator(value);
      if (!validationResult.valid) {
        throw new Error(`Invalid ${objectName}: field '${field}' validation failed - ${validationResult.errors[0]}`);
      }
    }
  }
}

/**
 * Generic AI response handler with retry logic and validation
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