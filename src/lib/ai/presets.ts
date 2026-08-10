// src/lib/ai/presets.ts

import type { ProviderPreset } from '@/types/provider.types';

/**
 * Provider presets shown in the configuration wizard.
 *
 * Only Google Gemini works end-to-end in this release (`available: true`). The
 * others are listed so players can see what's coming and so the schema is ready
 * for the post-1.0 multi-provider work — they're marked unavailable and the UI
 * keeps them out of reach for now.
 *
 * Order is deliberate. Gemini leads because it's the only one that works today.
 * OpenRouter comes next because it's the only other option a player can reach
 * without a credit card, and one key there covers dozens of models. Everything
 * below it needs prepaid billing before it generates a single word.
 */
export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    type: 'gemini',
    endpoint: 'https://generativelanguage.googleapis.com',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
    defaultModel: 'gemini-2.5-flash',
    capabilities: { text: true, images: true, streaming: true },
    helpUrl: 'https://aistudio.google.com/apikey',
    available: true,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    type: 'openai-compatible',
    // TODO(#895): re-check this model list when the provider goes live. OpenRouter's
    // zero-cost ":free" ids rotate every few weeks, so none are pinned here.
    models: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.5-flash'],
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'openai/gpt-4o',
    capabilities: { text: true, images: true, streaming: true },
    helpUrl: 'https://openrouter.ai/keys',
    available: false,
    note: 'free tier, no card',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'openai-compatible',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o',
    capabilities: { text: true, images: true, streaming: true },
    helpUrl: 'https://platform.openai.com/api-keys',
    available: false,
  },
  {
    id: 'deepseek',
    name: 'Deepseek',
    type: 'openai-compatible',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    capabilities: { text: true, images: false, streaming: true },
    helpUrl: 'https://platform.deepseek.com/api_keys',
    available: false,
  },
  {
    id: 'mistral',
    name: 'Mistral',
    type: 'openai-compatible',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    models: ['mistral-large-latest', 'mistral-small-latest'],
    defaultModel: 'mistral-large-latest',
    capabilities: { text: true, images: false, streaming: true },
    helpUrl: 'https://console.mistral.ai/api-keys',
    available: false,
  },
  {
    id: 'together',
    name: 'Together AI',
    type: 'openai-compatible',
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    capabilities: { text: true, images: false, streaming: true },
    helpUrl: 'https://api.together.xyz/settings/api-keys',
    available: false,
  },
  {
    id: 'groq',
    name: 'Groq',
    type: 'openai-compatible',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    defaultModel: 'llama-3.3-70b-versatile',
    capabilities: { text: true, images: false, streaming: true },
    helpUrl: 'https://console.groq.com/keys',
    available: false,
  },
];

/** Look up a preset by its stable id. */
export const getPresetById = (id: string): ProviderPreset | undefined =>
  PROVIDER_PRESETS.find((preset) => preset.id === id);
