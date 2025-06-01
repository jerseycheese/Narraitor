// src/utils/rateLimiter.ts

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

// Rate limiting constants
const DEV_MAX_REQUESTS = 500; // Lenient limit for development/testing
const PROD_MAX_REQUESTS = 50; // Strict limit for production
const DEV_WINDOW_MS = 10 * 60 * 1000; // 10 minutes for development/testing
const PROD_WINDOW_MS = 60 * 60 * 1000; // 1 hour for production

/**
 * Simple in-memory rate limiter for API routes
 * Limits requests per IP address within a time window
 */
export class RateLimiter {
  private requests = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  /**
   * @param maxRequests Optional override for max requests. If not provided, uses environment-aware defaults
   * @param windowMs Optional override for time window in milliseconds. If not provided, uses environment-aware defaults
   * @throws {Error} When maxRequests is provided but is zero or negative
   * @throws {Error} When windowMs is provided but is zero or negative
   */
  constructor(maxRequests?: number, windowMs?: number) {
    // Validate input parameters
    if (maxRequests !== undefined && maxRequests <= 0) {
      throw new Error('maxRequests must be a positive number');
    }
    if (windowMs !== undefined && windowMs <= 0) {
      throw new Error('windowMs must be a positive number');
    }

    // Use more lenient limits in development and test environments
    const isDevelopmentOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    
    this.maxRequests = maxRequests ?? (isDevelopmentOrTest ? DEV_MAX_REQUESTS : PROD_MAX_REQUESTS);
    this.windowMs = windowMs ?? (isDevelopmentOrTest ? DEV_WINDOW_MS : PROD_WINDOW_MS);
  }

  /**
   * Check if a request is within rate limit
   * @param identifier Usually IP address
   * @returns Rate limit result
   */
  checkLimit(identifier: string): RateLimitResult {
    const now = Date.now();
    const entry = this.requests.get(identifier);
    
    // Clean up old entries periodically
    this.cleanup(now);

    if (!entry || now - entry.windowStart > this.windowMs) {
      // First request in window or window has expired
      this.requests.set(identifier, {
        count: 1,
        windowStart: now
      });
      
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs
      };
    }

    if (entry.count >= this.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.windowStart + this.windowMs
      };
    }

    // Increment count and allow request
    entry.count++;
    this.requests.set(identifier, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.windowStart + this.windowMs
    };
  }

  /**
   * Reset rate limit for an identifier
   * @param identifier Usually IP address
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clean up expired entries to prevent memory leaks
   * @param now Current timestamp
   */
  private cleanup(now: number): void {
    // Only clean up occasionally to avoid performance impact
    if (Math.random() > 0.1) return;

    for (const [key, entry] of this.requests.entries()) {
      if (now - entry.windowStart > this.windowMs) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Get friendly error message for rate limiting
   * @param resetTime When the rate limit resets
   * @returns User-friendly error message
   */
  static getErrorMessage(resetTime: number): string {
    const minutesUntilReset = Math.ceil((resetTime - Date.now()) / (60 * 1000));
    
    if (minutesUntilReset <= 1) {
      return "Rate limit exceeded. Please try again in a minute.";
    } else if (minutesUntilReset <= 60) {
      return `Rate limit exceeded. Please try again in ${minutesUntilReset} minutes.`;
    } else {
      const hoursUntilReset = Math.ceil(minutesUntilReset / 60);
      return `Rate limit exceeded. Please try again in ${hoursUntilReset} hour${hoursUntilReset > 1 ? 's' : ''}.`;
    }
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter();