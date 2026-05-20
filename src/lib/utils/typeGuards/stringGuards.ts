// src/lib/utils/typeGuards/stringGuards.ts

import { safeTrim, normalizeText, NORM_NAME } from '@/lib/utils';

// Utility functions
function isSafeString(value: unknown, maxLength: number = 200): value is string {
  return typeof value === 'string' && 
         value.length > 0 && 
         value.length <= maxLength;
}

export function sanitizeString(value: unknown, maxLength: number = 200): string | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  
  // First normalize the text to handle whitespace, quotes, and special characters
  let sanitized = normalizeText(value, NORM_NAME);
  
  // Remove dangerous characters (strip angle brackets to neutralize tags)
  sanitized = safeTrim(sanitized
    .replace(/[<>]/g, '') // Strip angle brackets
    .replace(/[&"']/g, '') // Remove dangerous characters
    .substring(0, maxLength));
    
  return sanitized.length > 0 ? sanitized : undefined;
}
