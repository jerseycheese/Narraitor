// Shared utilities for API routes

import { NextRequest, NextResponse } from 'next/server';
import { globalRateLimiter, RateLimiter } from './rateLimiter';

/**
 * Get client IP address from request headers
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers that might contain the real IP
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-client-ip') ||
    'unknown'
  );
}

/**
 * Handle rate limiting for API requests
 * Returns a NextResponse if rate limit is exceeded, null if allowed
 */
export function handleRateLimiting(request: NextRequest): NextResponse | null {
  const clientIP = getClientIP(request);
  const rateLimitResult = globalRateLimiter.checkLimit(clientIP);
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { 
        error: RateLimiter.getErrorMessage(rateLimitResult.resetTime),
        code: 'RATE_LIMIT_EXCEEDED'
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '50',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
        }
      }
    );
  }
  
  return null;
}

/**
 * Validate basic request structure for AI endpoints
 */
export async function validateAIRequest(request: NextRequest): Promise<{
  prompt: string;
  config?: {
    maxTokens?: number;
    temperature?: number;
  };
} | null> {
  try {
    const body = await request.json();
    
    if (!body.prompt) {
      throw new Error('Prompt is required');
    }
    
    return body;
  } catch {
    return null;
  }
}

/**
 * Get and validate API key
 */
export function validateAPIKey(): string | null {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'MOCK_API_KEY') {
    return null;
  }
  
  return apiKey;
}

/**
 * Create rate limit headers for successful responses
 */
export function createRateLimitHeaders(clientIP: string): Record<string, string> {
  const rateLimitResult = globalRateLimiter.checkLimit(clientIP);
  
  return {
    'X-RateLimit-Limit': '50',
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
  };
}

/**
 * Extract tone settings from prompt and return appropriate safety settings
 */
export function getSafetySettingsFromPrompt(prompt: string): Array<{
  category: string;
  threshold: string;
}> {
  // Look for tone settings in the prompt - handle both simple ratings (G, PG, R) and compound ratings (PG-13, NC-17)
  const contentRatingMatch = prompt.match(/((?:PG-13|NC-17|[A-Z]+))-RATED CONTENT GUIDELINES/i);
  const contentRating = contentRatingMatch?.[1]?.toLowerCase() || '';

  // Debug information available in development mode only
  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 API SAFETY SETTINGS DEBUG:', {
      promptLength: prompt.length,
      foundContentRating: contentRating || '(none detected)',
      extractionPattern: 'Looking for "[RATING]-RATED CONTENT GUIDELINES"',
      rawMatch: contentRatingMatch?.[0] || '(no match)'
    });
  }

  // Map content ratings to safety thresholds
  switch (contentRating) {
    case 'g':
      // G-rated: Block medium and above content
      const gSettings = [
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
      ];
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 APPLIED SAFETY SETTINGS:', { contentRating: 'G', threshold: 'BLOCK_MEDIUM_AND_ABOVE', settingsApplied: '4 categories' });
      }
      return gSettings;
    case 'pg':
    case 'pg-13':
      // PG/PG-13: Block only high content
      const pgSettings = [
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
      ];
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 APPLIED SAFETY SETTINGS:', { contentRating: contentRating.toUpperCase(), threshold: 'BLOCK_ONLY_HIGH', settingsApplied: '4 categories' });
      }
      return pgSettings;
    case 'r':
      // R-rated: Permissive for sexual content.
      const rSettings = [
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
      ];
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 APPLIED SAFETY SETTINGS:', {
          contentRating: 'R',
          threshold: 'Custom (BLOCK_NONE for explicit)',
          settingsApplied: '4 categories'
        });
      }
      return rSettings;
    case 'nc-17':
      // NC-17: Highly permissive, no blocking on sexual content or harassment.
      const nc17Settings = [
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
      ];
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 APPLIED SAFETY SETTINGS:', {
          contentRating: 'NC-17',
          threshold: 'Custom (BLOCK_NONE for explicit and harassment)',
          settingsApplied: '4 categories'
        });
      }
      return nc17Settings;
    default:
      // Default: Medium filtering for safety
      const defaultSettings = [
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
      ];
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 APPLIED SAFETY SETTINGS:', {
          contentRating: `fallback-default (detected: ${contentRating || 'none'})`,
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          settingsApplied: '4 categories'
        });
      }
      
      return defaultSettings;
  }
}


/**
 * Make secure request to Gemini API using header authentication
 * Includes AbortController for timeout handling
 */
export async function makeGeminiRequest(
  endpoint: string,
  apiKey: string,
  payload: object,
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    
    // Enhanced error handling for common scenarios
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      if (err.message.includes('network') || err.message.includes('fetch')) {
        throw new Error('Network error - please check your connection');
      }
    }
    
    throw err;
  }
}
