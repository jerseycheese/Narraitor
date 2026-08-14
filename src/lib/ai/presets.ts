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
 *
 * TODO(#895): flip a preset to `available: true` only after
 * scripts/verify-openai-compatible-stream.mjs passes against it with a real
 * key. Nothing in CI can make that call, so `available` is a claim about a
 * live check somebody ran, not about the code compiling.
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
    privacyNote:
      "Google's free tier allows your prompts and the model's output to be used to improve their models, and reviewed by human raters. Their paid tiers do not. If you are writing anything personal, use a paid-tier key.",
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    type: 'openai-compatible',
    // Each id below was checked against OpenRouter's live catalogue
    // (https://openrouter.ai/api/v1/models), which is the only thing that knows
    // what is actually servable. The catalogue keeps retired slugs resolvable
    // with an empty `endpoints` array, so "the id still exists" and "something
    // will answer it" are different questions.
    //
    // No zero-cost ":free" id is pinned here: OpenRouter documents that free
    // availability changes frequently, so any one named here would rot.
    models: ['openai/gpt-4o', 'anthropic/claude-sonnet-5', 'google/gemini-2.5-flash'],
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'openai/gpt-4o',
    // Images here means generation, not vision input, and generation stays on
    // Gemini. See supportsImages in providers/capabilities.ts, which is what
    // the validate-provider route reports back whatever a preset claims.
    capabilities: { text: true, images: false, streaming: true },
    helpUrl: 'https://openrouter.ai/keys',
    available: false,
    note: 'free tier, no card',
    privacyNote:
      'OpenRouter routes your prompts to whichever upstream model you pick, and each of those has its own data-retention terms. Their free models in particular may allow training on your prompts.',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'openai-compatible',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    // The list this replaced was three models OpenAI has since moved off:
    // gpt-4-turbo and gpt-3.5-turbo both carry a published shutdown date on
    // the deprecations page, and gpt-4o has quietly left the models index. A
    // preset is a menu a player picks from, so a shutdown date on two of three
    // entries is a bug with a fuse on it rather than a cosmetic one.
    models: ['gpt-5.6-terra', 'gpt-5.6-sol', 'gpt-5.6-luna'],
    defaultModel: 'gpt-5.6-terra',
    // OpenAI's chat models take images as INPUT; they don't generate them, and
    // this flag has only ever meant generation here (providers/capabilities.ts).
    capabilities: { text: true, images: false, streaming: true },
    helpUrl: 'https://platform.openai.com/api-keys',
    available: false,
    privacyNote:
      'OpenAI states that API inputs and outputs are not used to train their models by default, and are retained for up to 30 days for abuse monitoring.',
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
    privacyNote:
      'Deepseek stores API data on servers in China and reserves the right to use it to improve their services. Check their current terms before sending anything personal.',
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
