// src/lib/ai/providers/adapterRegistry.ts

import type { ProviderType } from '@/types/provider.types';
import type { ProviderAdapter } from './types';
import { geminiAdapter } from './gemini/adapter';
import { openAICompatibleAdapter } from './openai-compatible/adapter';
import { claudeAdapter } from './claude/adapter';

/**
 * Which wire format each provider type speaks.
 *
 * Kept separate from `factory.ts` so that request-path code (`resolveProvider`)
 * can ask "can we talk to this type?" without pulling the Gemini SDK and the
 * client classes in behind it.
 *
 * Ollama exposes an OpenAI-compatible chat-completions route, so it shares that
 * adapter. Claude gets its own: Anthropic's native Messages API is not
 * OpenAI-shaped (a top-level `system` field, typed content blocks in the
 * response), so handing it the OpenAI adapter would fail at the wire in a way
 * that reads as a bug rather than as "not supported yet". Reaching Claude
 * models through OpenRouter still works as before — that is an
 * `openai-compatible` provider and unaffected by this entry.
 */
const ADAPTERS: Partial<Record<ProviderType, ProviderAdapter>> = {
  gemini: geminiAdapter,
  'openai-compatible': openAICompatibleAdapter,
  ollama: openAICompatibleAdapter,
  claude: claudeAdapter,
};

/** The adapter for a provider type, or null when we can't talk to it yet. */
export function getProviderAdapter(type: ProviderType): ProviderAdapter | null {
  return ADAPTERS[type] ?? null;
}

/** Whether a provider type can be used for text generation at all. */
export function isProviderSupported(type: ProviderType): boolean {
  return getProviderAdapter(type) !== null;
}

/**
 * The adapter for a provider type, falling back to Gemini.
 *
 * Callers on the request path use this: a descriptor that reached them has
 * already been through `resolveProvider`, which only lets supported types past,
 * so the fallback is belt-and-braces rather than an expected branch.
 */
export function requireProviderAdapter(type: ProviderType): ProviderAdapter {
  return getProviderAdapter(type) ?? geminiAdapter;
}
