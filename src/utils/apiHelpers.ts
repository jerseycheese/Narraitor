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
    throw err;
  }
}
