// src/lib/ai/clientGeminiClient.ts

import { AIClient, AIGenerateOptions, AIResponse, AIImageResponse, NarrativeStreamEvent, NarrativeStreamDone } from './types';
import { userFriendlyError } from './userFriendlyErrors';
import { aiFetch } from './aiFetch';
import { SINGLE_ATTEMPT_TEXT_TIMEOUT_MS } from '@/lib/constants/aiTimeouts';

import Logger from '@/lib/utils/logger';
const logger = new Logger('ClientGeminiClient');

/**
 * Client-side proxy for Gemini API that routes through Next.js API routes
 * This ensures API keys are never exposed to the client
 */
export class ClientGeminiClient implements AIClient {
  private baseUrl: string;

  constructor() {
    // Use relative URLs so they work in both development and production
    this.baseUrl = '';
  }

  /**
   * POSTs to an API route and unwraps the JSON payload, normalizing the
   * shared error branches (rate limiting, HTTP errors, network failures)
   * into user-friendly messages.
   */
  private async postJson<T>(
    endpoint: string,
    body: unknown,
    logContext: string,
    options: AIGenerateOptions & { timeoutMs?: number } = {}
  ): Promise<T> {
    try {
      const response = await aiFetch(
        `${this.baseUrl}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: options.signal,
        },
        { timeoutMs: options.timeoutMs }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          throw new Error(errorData.error || 'Rate limit exceeded. Please try again later.');
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error(`ClientGeminiClient ${logContext} error:`, error);
      const friendlyMessage = userFriendlyError(error instanceof Error ? error : new Error('Unknown error'));
      throw new Error(friendlyMessage);
    }
  }

  private toAIResponse(data: { content: string; finishReason?: string; promptTokens?: number; completionTokens?: number }): AIResponse {
    return {
      content: data.content,
      finishReason: data.finishReason || 'STOP',
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
    };
  }

  /**
   * POSTs to an API route that streams newline-delimited JSON
   * (NarrativeStreamEvent — see /api/narrative/generate) and consumes it
   * progressively: each `delta` line is forwarded to the caller's onChunk as
   * it arrives, and the trailing `done` line becomes the resolved AIResponse.
   * Error handling mirrors postJson so callers see the same friendly
   * messages regardless of which path served the request.
   */
  private async postNdjsonStream(
    endpoint: string,
    body: unknown,
    logContext: string,
    options: AIGenerateOptions & { timeoutMs?: number } = {}
  ): Promise<AIResponse> {
    try {
      const response = await aiFetch(
        `${this.baseUrl}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: options.signal,
        },
        { timeoutMs: options.timeoutMs }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          throw new Error(errorData.error || 'Rate limit exceeded. Please try again later.');
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Streaming response had no body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalEvent: NarrativeStreamDone | null = null;

      const consumeLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const event = JSON.parse(trimmed) as NarrativeStreamEvent;
        if ('error' in event) {
          throw new Error(event.error);
        } else if ('done' in event) {
          finalEvent = event;
        } else {
          options.onChunk?.(event.delta);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          consumeLine(line);
        }
      }
      // The final line may not carry a trailing newline.
      consumeLine(buffer);

      if (!finalEvent) {
        throw new Error('Stream ended without a completion event');
      }

      return this.toAIResponse(finalEvent);
    } catch (error) {
      logger.error(`ClientGeminiClient ${logContext} error:`, error);
      const friendlyMessage = userFriendlyError(error instanceof Error ? error : new Error('Unknown error'));
      throw new Error(friendlyMessage);
    }
  }

  /**
   * Generate narrative content via the server-side API route. Choice
   * generation goes through generateChoices() — callers pick the endpoint
   * explicitly instead of this method inferring it from prompt content.
   *
   * Consumes the route's progressive stream (issue #1476): pass onChunk in
   * options to receive narrative prose as it's generated instead of only on
   * completion.
   */
  async generateContent(prompt: string, options?: AIGenerateOptions): Promise<AIResponse> {
    return this.postNdjsonStream(
      '/api/narrative/generate',
      { prompt, config: { temperature: 0.7, maxTokens: 2048 } },
      'generation',
      // The route makes a single 30s Gemini attempt (makeGeminiRequest), so
      // the wait ceiling is that budget + headroom, not the retry worst case.
      { signal: options?.signal, timeoutMs: SINGLE_ATTEMPT_TEXT_TIMEOUT_MS, onChunk: options?.onChunk }
    );
  }

  /**
   * Generate choices via server-side API route
   * This method is used specifically for choice generation
   */
  async generateChoices(prompt: string, options?: AIGenerateOptions): Promise<AIResponse> {
    const data = await this.postJson<{ content: string; finishReason?: string; promptTokens?: number; completionTokens?: number }>(
      '/api/narrative/choices',
      { prompt, config: { temperature: 0.7, maxTokens: 1024 } },
      'choice generation',
      { signal: options?.signal, timeoutMs: SINGLE_ATTEMPT_TEXT_TIMEOUT_MS }
    );
    return this.toAIResponse(data);
  }

  /**
   * Generate portrait image via existing server-side API route
   */
  async generateImage(prompt: string): Promise<AIImageResponse> {
    const data = await this.postJson<{ image: string; prompt: string }>(
      '/api/generate-portrait',
      { prompt },
      'image generation'
    );
    return {
      image: data.image,
      prompt: data.prompt,
    };
  }

  /**
   * Check if the AI service is available
   * This makes a lightweight request to verify the API routes are working
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Make a simple request to check if the API is responding
      const response = await aiFetch(`${this.baseUrl}/api/narrative/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'test',
          config: { maxTokens: 1 }
        })
      });

      // Any response (even errors) means the API route is available
      return response.status !== 404;
    } catch (error) {
      logger.error('ClientGeminiClient availability check failed:', error);
      return false;
    }
  }
}
