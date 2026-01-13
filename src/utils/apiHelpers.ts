// Shared utilities for API routes

import { NextRequest, NextResponse } from 'next/server';
import { globalRateLimiter, RateLimiter, type RateLimitResult } from './rateLimiter';

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
 * Returns both the rate limit result and a NextResponse if rate limit is exceeded
 */
export function handleRateLimiting(request: NextRequest): {
  response: NextResponse | null;
  result: RateLimitResult;
} {
  const clientIP = getClientIP(request);
  const rateLimitResult = globalRateLimiter.checkLimit(clientIP);

  if (!rateLimitResult.allowed) {
    return {
      response: NextResponse.json(
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
      ),
      result: rateLimitResult
    };
  }

  return { response: null, result: rateLimitResult };
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
 * Uses the existing rate limit result to avoid double-counting
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': '50',
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
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
      return pgSettings;
    case 'r':
      // R-rated: Permissive for sexual content.
      const rSettings = [
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
      ];
      return rSettings;
    case 'nc-17':
      // NC-17: Highly permissive, no blocking on sexual content or harassment.
      const nc17Settings = [
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
      ];
      return nc17Settings;
    default:
      // Default: Medium filtering for safety
      const defaultSettings = [
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
      ];

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

/**
 * Response structure for Gemini text generation
 */
export interface GeminiTextResponse {
  content: string;
  finishReason?: string;
  promptTokens?: number;
  completionTokens?: number;
  error?: string;
  details?: string;
  code?: string;
}

/**
 * Options for Gemini text generation
 */
export interface GeminiTextOptions {
  maxTokens?: number;
  temperature?: number;
  errorContext?: string; // For logging context (e.g., 'Narrative generation', 'Choice generation')
}

/**
 * Process a complete Gemini text generation request
 * Handles rate limiting, validation, API call, and response parsing
 */
export async function processGeminiTextRequest(
  request: NextRequest,
  options: GeminiTextOptions = {}
): Promise<Response> {
  const {
    maxTokens = 1024,
    temperature = 0.7,
    errorContext = 'Generation'
  } = options;

  // Lazy import to avoid circular dependency
  const { createAPIErrorResponse } = await import('../lib/utils/errorUtils');

  try {
    // Rate limiting
    const { response: rateLimitResponse, result: rateLimitResult } = handleRateLimiting(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Validate request
    const requestData = await validateAIRequest(request);
    if (!requestData) {
      return createAPIErrorResponse(
        new Error('400 bad request: prompt is required'),
        400
      );
    }

    // Validate API key
    const apiKey = validateAPIKey();
    if (!apiKey) {
      return createAPIErrorResponse(
        new Error('Service configuration error: API key not configured'),
        500
      );
    }

    // Call Google's Gemini API from the server using secure header authentication
    const response = await makeGeminiRequest(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      apiKey,
      {
        contents: [{
          parts: [{ text: requestData.prompt }]
        }],
        generationConfig: {
          temperature: requestData.config?.temperature || temperature,
          topP: 1.0,
          topK: 40,
          maxOutputTokens: requestData.config?.maxTokens || maxTokens
        },
        safetySettings: getSafetySettingsFromPrompt(requestData.prompt)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });

      // Create appropriate error based on status code
      const apiError = response.status === 429
        ? new Error('429 rate limit exceeded')
        : response.status === 401
        ? new Error('401 unauthorized')
        : new Error(`Service error: ${response.status} ${response.statusText}`);

      return createAPIErrorResponse(apiError, response.status, errorText);
    }

    const data = await response.json();

    // Extract content from response
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      console.error('API Response structure issue:', {
        hasCandidates: !!data.candidates,
        candidatesLength: data.candidates?.length,
        hasFirstCandidate: !!data.candidates?.[0],
        hasContent: !!data.candidates?.[0]?.content,
        hasParts: !!data.candidates?.[0]?.content?.parts
      });

      return createAPIErrorResponse(
        new Error('Service error: malformed API response'),
        500,
        'Missing candidates, content, or parts in response'
      );
    }

    const content = data.candidates[0].content.parts[0]?.text || '';
    const finishReason = data.candidates[0].finishReason || 'STOP';

    // Extract token usage if available
    const promptTokens = data.usageMetadata?.promptTokenCount || undefined;
    const completionTokens = data.usageMetadata?.candidatesTokenCount || undefined;

    const responseData: GeminiTextResponse = {
      content,
      finishReason,
      promptTokens,
      completionTokens
    };

    return NextResponse.json(responseData, {
      headers: createRateLimitHeaders(rateLimitResult)
    });

  } catch (error) {
    console.error(`${errorContext} error:`, error);

    return createAPIErrorResponse(
      error instanceof Error ? error : new Error('Unknown error occurred'),
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
