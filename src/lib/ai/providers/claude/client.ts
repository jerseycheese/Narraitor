// src/lib/ai/providers/claude/client.ts

import type { AIClient, AIGenerateOptions, AIResponse, AIServiceConfig } from '../../types';
import type { ProviderDescriptor, TextGenerationSpec } from '../types';
import { claudeAdapter } from './adapter';
import { generateProviderText } from '../core/request';
import { parseContentRating } from '../../safety/contentRatingGuidance';
import { getGenerationConfig } from '../../config';
import { isRetryableError } from '@/lib/utils/errorUtils';

/**
 * `AIClient` over Anthropic's native Messages API.
 *
 * A straight copy of `OpenAICompatibleClient`'s shape — retry policy and the
 * prompt-to-spec translation, with the wire format living entirely in
 * `claudeAdapter`. Sits beside `GeminiClient` and `OpenAICompatibleClient`
 * under the same interface, so everything that takes an `AIClient` works
 * against Claude without knowing that's what it holds.
 *
 * Text only. Claude has no image-generation endpoint, so `generateImage` is
 * simply absent rather than present and failing — image generation stays on
 * Gemini (see supportsImages in providers/capabilities.ts).
 */
export class ClaudeClient implements AIClient {
  private readonly descriptor: ProviderDescriptor;
  private readonly maxRetries: number;
  private readonly timeout: number;
  private readonly temperature: number;
  private readonly maxTokens: number;

  constructor(descriptor: ProviderDescriptor, config: Pick<AIServiceConfig, 'maxRetries' | 'timeout'>) {
    this.descriptor = descriptor;
    this.maxRetries = config.maxRetries;
    this.timeout = config.timeout;

    const generationConfig = getGenerationConfig();
    this.temperature = generationConfig.temperature ?? 0.7;
    this.maxTokens = generationConfig.maxOutputTokens ?? 2048;
  }

  /**
   * Same retry shape as GeminiClient and OpenAICompatibleClient: retry only
   * what's worth retrying, with exponential backoff, and surface the last
   * error otherwise.
   *
   * `options.onChunk` is never called — this client doesn't stream. The
   * streaming path for this provider runs through the API route's generic
   * core rather than through a client, same as the OpenAI-compatible one.
   */
  async generateContent(prompt: string, options?: AIGenerateOptions): Promise<AIResponse> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < this.maxRetries) {
      if (options?.signal?.aborted) {
        throw new Error('Request aborted');
      }

      try {
        const result = await generateProviderText(
          claudeAdapter,
          this.descriptor,
          this.buildSpec(prompt),
          this.timeout
        );
        return {
          content: result.content,
          finishReason: result.finishReason,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempts++;

        if (!isRetryableError(lastError) || attempts >= this.maxRetries) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
      }
    }

    throw lastError || new Error('Failed to generate content');
  }

  private buildSpec(prompt: string): TextGenerationSpec {
    return {
      prompt,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      contentRating: parseContentRating(prompt),
      stream: false,
    };
  }
}
