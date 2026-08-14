// src/lib/ai/providers/factory.ts

import type { AIClient } from '../types';
import type { ProviderDescriptor } from './types';
import { OpenAICompatibleClient } from './openai-compatible/client';
import { GeminiClient } from '../geminiClient';
import { getAIConfig, getDefaultConfig } from '../config';

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
    return new GeminiClient(getDefaultConfig(descriptor.apiKey, descriptor.model));
  }

  const { maxRetries, timeout } = getAIConfig();
  return new OpenAICompatibleClient(descriptor, { maxRetries, timeout });
}
