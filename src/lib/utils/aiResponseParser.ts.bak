// src/lib/utils/aiResponseParser.ts

/**
 * Utility functions for parsing AI responses across different features
 */

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