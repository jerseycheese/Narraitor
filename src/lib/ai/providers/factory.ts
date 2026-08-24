// src/lib/ai/providers/factory.ts

import type { AIClient } from '../types';
import type { ProviderDescriptor } from './types';
import { OpenAICompatibleClient } from './openai-compatible/client';
import { GeminiClient } from '../geminiClient';
import { getAIConfig, getDefaultConfig } from '../config';
import { applyGeminiPromptOverrides } from './promptOverrides';

/**
 * Builds the AI client for a resolved provider.
 *
 * The distinction from `defaultGeminiClient.ts` is the point of this module:
 * that one takes a key and always ends at Gemini. This one branches on the
 * player's configuration, which is the only thing that knows which provider is
 * actually active.
 *
 * Server-side only — every branch holds a plaintext key and makes direct
 * upstream calls. Browser callers go through the API routes.
 */
export function createProviderClient(descriptor: ProviderDescriptor): AIClient {
  if (descriptor.type === 'gemini') {
    const config = getDefaultConfig(descriptor.apiKey, descriptor.model);
    const client = new GeminiClient({
      ...config,
      generationConfig: {
        ...config.generationConfig,
        temperature: descriptor.temperatureOverride ?? config.generationConfig?.temperature,
        topP: descriptor.topPOverride ?? config.generationConfig?.topP,
        maxOutputTokens: descriptor.maxTokensOverride ?? config.generationConfig?.maxOutputTokens,
      },
    });

    if (!descriptor.customSafetyPromptOverride && !descriptor.customSystemPromptOverride) {
      return client;
    }

    return {
      generateContent(prompt: string) {
        return client.generateContent(applyGeminiPromptOverrides(prompt, descriptor));
      },
    };
  }

  const { maxRetries, timeout } = getAIConfig();
  return new OpenAICompatibleClient(descriptor, { maxRetries, timeout });
}
