/**
 * AI Monitoring Helpers
 * 
 * Utilities for capturing and monitoring AI service requests/responses
 * Integrates with the DevTools AI monitoring functionality
 */

import type { AIMonitoringEntry } from '@/types/aiMonitoring';

/**
 * AI monitoring instance for client-side usage
 * This will be initialized when DevTools is available
 */
let monitoringStore: {
  addEntry: (entry: Omit<AIMonitoringEntry, 'id' | 'timestamp'>) => string;
  completeEntry: (id: string, response: AIMonitoringEntry['response'], performance: Partial<AIMonitoringEntry['performance']>) => void;
  errorEntry: (id: string, error: AIMonitoringEntry['error'], performance: Partial<AIMonitoringEntry['performance']>) => void;
} | null = null;

/**
 * Initialize the monitoring store reference
 * Called by DevTools when the monitoring store is available
 */
export function initializeAIMonitoring(store: NonNullable<typeof monitoringStore>): void {
  monitoringStore = store;
}

/**
 * Check if AI monitoring is available and enabled
 */
export function isAIMonitoringEnabled(): boolean {
  // Only enable monitoring if in development mode AND running on a development hostname
  const isDevEnv = process.env.NODE_ENV === 'development';
  let isDevHost = false;
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const devHosts = ['localhost', '127.0.0.1', '[::1]'];
    isDevHost = devHosts.includes(window.location.hostname) || window.location.hostname.startsWith('192.168.');
  }
  return monitoringStore !== null && isDevEnv && (isDevHost || typeof window === 'undefined');
}

interface GeminiPayload {
  contents?: Array<{
    parts?: Array<{
      text?: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
  safetySettings?: unknown;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}

/**
 * Create a monitored version of makeGeminiRequest that captures request/response data
 * This wraps the original function to add monitoring capabilities
 */
export function createMonitoredGeminiRequest(
  originalMakeRequest: (endpoint: string, apiKey: string, payload: object, timeoutMs?: number) => Promise<Response>
) {
  return async function monitoredMakeGeminiRequest(
    endpoint: string,
    apiKey: string,
    payload: GeminiPayload,
    timeoutMs: number = 30000
  ): Promise<Response> {
    // If monitoring is not enabled, use original function
    if (!isAIMonitoringEnabled()) {
      return originalMakeRequest(endpoint, apiKey, payload, timeoutMs);
    }
    
    const startTime = Date.now();
    
    // Extract monitoring data from request
    const monitoringEntry: Omit<AIMonitoringEntry, 'id' | 'timestamp'> = {
      endpoint,
      method: 'POST',
      request: {
        prompt: extractPromptFromPayload(payload),
        config: extractConfigFromPayload(payload),
        safetySettings: payload.safetySettings
      },
      performance: {
        startTime
      },
      status: 'pending'
    };
    
    // Add entry to monitoring store
    if (!monitoringStore) throw new Error("AI Monitoring store is not initialized.");
    const entryId = monitoringStore.addEntry(monitoringEntry);
    
    try {
      // Make the actual request
      const response = await originalMakeRequest(endpoint, apiKey, payload, timeoutMs);
      const endTime = Date.now();
      
      // Clone response to read it without consuming the stream
      const responseClone = response.clone();
      
      try {
        // Try to parse response data for monitoring
        const responseData = await responseClone.json() as GeminiResponse;
        
        // Extract monitoring data from response
        const monitoringResponse: AIMonitoringEntry['response'] = {
          content: extractContentFromResponse(responseData),
          finishReason: responseData.candidates?.[0]?.finishReason || 'UNKNOWN',
          tokenUsage: {
            promptTokens: responseData.usageMetadata?.promptTokenCount,
            completionTokens: responseData.usageMetadata?.candidatesTokenCount,
            totalTokens: (responseData.usageMetadata?.promptTokenCount || 0) + 
                        (responseData.usageMetadata?.candidatesTokenCount || 0)
          },
          statusCode: response.status
        };
        
        // Update monitoring entry with success data
        if (monitoringStore) {
          monitoringStore.completeEntry(entryId, monitoringResponse, {
            endTime,
            duration: endTime - startTime
          });
        }
      } catch {
        // If we can't parse the response, still record the completion
        if (monitoringStore) {
          monitoringStore.completeEntry(entryId, {
            content: '[Unable to parse response]',
            finishReason: 'PARSE_ERROR',
            statusCode: response.status
          }, {
            endTime,
            duration: endTime - startTime
          });
        }
      }
      
      return response;
      
    } catch (error) {
      const endTime = Date.now();
      
      // Extract error information for monitoring
      const monitoringError: AIMonitoringEntry['error'] = {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : 'UnknownError',
        retryable: isRetryableError(error),
        details: error instanceof Error ? error.stack : String(error)
      };
      
      // Update monitoring entry with error data
      if (monitoringStore) {
        monitoringStore.errorEntry(entryId, monitoringError, {
          endTime,
          duration: endTime - startTime
        });
      }
      
      // Re-throw the original error
      throw error;
    }
  };
}

/**
 * Extract prompt text from Gemini API payload
 */
function extractPromptFromPayload(payload: GeminiPayload): string {
  try {
    return payload.contents?.[0]?.parts?.[0]?.text || '[Unable to extract prompt]';
  } catch {
    return '[Unable to extract prompt]';
  }
}

/**
 * Extract generation config from Gemini API payload
 */
function extractConfigFromPayload(payload: GeminiPayload): AIMonitoringEntry['request']['config'] | undefined {
  const config = payload.generationConfig;
  if (!config) return undefined;
  
  return {
    temperature: config.temperature,
    maxTokens: config.maxOutputTokens,
    topP: config.topP,
    topK: config.topK
  };
}

/**
 * Extract content from Gemini API response
 */
function extractContentFromResponse(responseData: GeminiResponse): string {
  try {
    return responseData.candidates?.[0]?.content?.parts?.[0]?.text || '[No content generated]';
  } catch {
    return '[Unable to extract content]';
  }
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const message = error.message.toLowerCase();
  
  // Network errors are usually retryable
  if (message.includes('network') || message.includes('timeout') || message.includes('fetch')) {
    return true;
  }
  
  // Specific error names that are retryable
  if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    return true;
  }
  
  return false;
}