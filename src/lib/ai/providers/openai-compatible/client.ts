// src/lib/ai/providers/openai-compatible/client.ts

import type { AIClient, AIGenerateOptions, AIResponse, AIServiceConfig } from '../../types';
import type { ProviderDescriptor, TextGenerationSpec } from '../types';
import { openAICompatibleAdapter } from './adapter';
import { generateProviderText } from '../core/request';
import { parseContentRating } from '../../safety/contentRatingGuidance';
import { getGenerationConfig } from '../../config';
import { isRetryableError } from '@/lib/utils/errorUtils';

/**
 * `AIClient` over any OpenAI-compatible chat-completions endpoint.
 *
 * Sits beside `GeminiClient` under the same interface (`src/lib/ai/types.ts`),
 * so everything that takes an AIClient — the generators, the API routes —
 * works against either without knowing which one it holds. The wire format
 * lives entirely in the adapter; this class is retry policy and the
 * prompt-to-spec translation.
 *
 * Text only. Image generation is a separate endpoint shape on every provider
 * that has one, and stays on Gemini, so `generateImage` is simply
 * absent rather than present and failing.
 */
export class OpenAICompatibleClient implements AIClient {
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
   * Same retry shape as GeminiClient: retry only what's worth retrying, with
   * exponential backoff, and surface the last error otherwise.
   *
   * `options.onChunk` is never called — this client doesn't stream. The
   * interface allows that ("implementations that don't stream simply never call
   * it"), and the streaming path for this provider runs through the API route's
   * generic core rather than through a client.
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
          openAICompatibleAdapter,
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
