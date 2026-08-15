// src/lib/ai/presets.ts

import type { ProviderPreset } from '@/types/provider.types';

/**
 * Provider presets shown in the configuration wizard.
 *
 * Gemini, OpenRouter and OpenAI work end-to-end (`available: true`). The rest
 * are listed so players can see what's coming and so the schema is ready for
 * the remaining multi-provider work — they're marked unavailable and the UI
 * keeps them out of reach until someone runs a live check against each.
 *
 * Order is deliberate. Gemini leads because it's the longest-proven. OpenRouter
 * comes next because it's the only other option a player can reach without a
 * credit card, and one key there covers dozens of models. Everything below it
 * needs prepaid billing before it generates a single word.
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
    // Attribution only: OpenRouter uses these to list the app on its public
    // rankings, and a request without them succeeds exactly as it does with
    // them. `X-OpenRouter-Title` is the current name for the title header;
    // `X-Title` still works as a backwards-compatible alias, so it is not worth
    // sending both. The URL is written out rather than read from getSiteUrl()
    // because this module is imported by client components and that one is
    // server-only, where it would quietly resolve to localhost.
    customHeaders: {
      'HTTP-Referer': 'https://narraitor-six.vercel.app',
      'X-OpenRouter-Title': 'Narraitor',
    },
    // Images here means generation, not vision input, and generation stays on
    // Gemini. See supportsImages in providers/capabilities.ts, which is what
    // the validate-provider route reports back whatever a preset claims.
    capabilities: { text: true, images: false, streaming: true },
    helpUrl: 'https://openrouter.ai/keys',
    available: true,
    note: 'free tier, no card',
    privacyNote:
      'OpenRouter routes your prompts to whichever upstream model you pick, and each of those has its own data-retention terms. Their free models in particular may allow training on your prompts.',
  },
  {
    id: 'ollama',
    name: 'Ollama (self-hosted)',
    type: 'ollama',
    // Ollama serves an OpenAI-shaped route alongside its own /api/chat, which
    // is why this shares the openai-compatible adapter (see adapterRegistry).
    //
    // The endpoint is an example, not a destination. Every player's is
    // different, so this one exists to show the shape of the URL and to
    // pre-fill an editable field. Nothing keys off it: the endpoint-keyed
    // preset lookups below all return nothing for a hand-typed address, which
    // is the right answer here because this preset asks for no extra headers
    // and no renamed parameters.
    endpoint: 'https://ollama.example.com/v1/chat/completions',
    // Empty on purpose. A hosted service has a catalogue we can list; a machine
    // the player runs has only what they pulled onto it. Listing four popular
    // names would be wrong for most players and would also hide the text field
    // the wizard gives a preset with no models.
    models: [],
    // A suggestion to pre-fill that text field with, not a promise that it is
    // installed. Deliberately not a gemma id: capabilities.hasSystemRole folds
    // the system turn into the user turn for that family, so a gemma default
    // would quietly put every new Ollama player on the fallback prompt path.
    defaultModel: 'llama3.2',
    capabilities: { text: true, images: false, streaming: true },
    helpUrl: 'https://ollama.ai/download',
    requiresApiKey: false,
    // Stays false until somebody drives a real streamed turn through a real
    // Ollama, per the note at the top of this file.
    available: false,
    note: 'runs on your own machine',
    privacyNote:
      'Ollama runs on hardware you control, so your prompts and the story it writes never leave it. Note that the content rating travels as guidance in the prompt here, and many local models are trained without a refusal layer at all.',
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
    models: ['gpt-5.6-luna', 'gpt-5.6-terra', 'gpt-5.6-sol'],
    // Luna leads for the same reason gemini-2.5-flash does above: it is the
    // cheap fast tier, and a narrative turn is long output on a short prompt,
    // which is exactly where the price gap bites. Luna runs $0.20/$1.20 per
    // MTok against Terra's $2/$12 and Sol's $5/$30 - a tenfold difference on a
    // default nobody changes. Sol is the one to reach for if prose quality
    // disappoints.
    defaultModel: 'gpt-5.6-luna',
    // Neither of these is cosmetic. OpenAI rejects max_tokens outright on these
    // models rather than ignoring it, and locks temperature and top_p because
    // they are reasoning models running their own generate-and-select rounds.
    // Both produce a 400, and both were found by a real call, not by reading.
    maxOutputTokensParam: 'max_completion_tokens',
    hasFixedSamplingControls: true,
    // OpenAI's chat models take images as INPUT; they don't generate them, and
    // this flag has only ever meant generation here (providers/capabilities.ts).
    capabilities: { text: true, images: false, streaming: true },
    helpUrl: 'https://platform.openai.com/api-keys',
    available: true,
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
  {
    id: 'perplexity',
    name: 'Perplexity',
    type: 'openai-compatible',
    // Perplexity has two surfaces and only one of them belongs here. The
    // search-grounded `sonar-*` models answer on /v1/sonar in a shape that is
    // not OpenAI's, and their chat-completions form carries a published
    // shutdown date, the same fuse the OpenAI list above was corrected for.
    // The Gateway is the one Perplexity documents as a drop-in replacement for
    // an OpenAI integration, so it is the one an openai-compatible preset can
    // honestly point at. Note the /router segment: there is no bare
    // /chat/completions on this host.
    endpoint: 'https://api.perplexity.ai/router/v1/chat/completions',
    models: ['perplexity/kimi-k3', 'perplexity/glm-5.2', 'perplexity/deepseek-v4-flash-0731'],
    defaultModel: 'perplexity/kimi-k3',
    // Perplexity takes images as input and can return them as search results;
    // it generates none. Generation stays on Gemini (see providers/capabilities).
    capabilities: { text: true, images: false, streaming: true },
    helpUrl: 'https://console.perplexity.ai/group/keys',
    available: false,
    privacyNote:
      'Perplexity states that it keeps no record of prompts or responses sent to its chat completions API, and does not use them for training. It retains billing metrics only.',
  },
];

/** Look up a preset by its stable id. */
export const getPresetById = (id: string): ProviderPreset | undefined =>
  PROVIDER_PRESETS.find((preset) => preset.id === id);

/**
 * The extra headers the service at this endpoint asks for, from its preset.
 *
 * Keyed on the endpoint rather than on anything the caller declares about
 * itself, which is what stops one service's headers from riding along to
 * another, say a preset id claiming to be OpenRouter next to an endpoint
 * pointing somewhere else. An endpoint with no matching preset gets none, which
 * is the right answer: we have nothing to say about a service we don't ship,
 * and every header in play is optional anyway.
 *
 * Lives here rather than beside either caller because both the generation path
 * and the validation ping need the same answer — a preset whose service
 * requires a header must get it in the check that decides whether the key
 * works, not only once play starts.
 */
export const presetHeadersForEndpoint = (
  endpoint: string | undefined
): Record<string, string> | undefined => presetForEndpoint(endpoint)?.customHeaders;

/**
 * What the service at this endpoint calls the output-length cap, when it is not
 * the usual `max_tokens`.
 *
 * Endpoint-keyed for the same reason the headers are: it describes where the
 * request is going, not what the caller claims about itself. Undefined is the
 * common answer and means "the ordinary name" — the adapter supplies it — so a
 * descriptor only carries this field when a service has genuinely moved.
 */
export const presetMaxOutputTokensParamForEndpoint = (
  endpoint: string | undefined
): 'max_tokens' | 'max_completion_tokens' | undefined =>
  presetForEndpoint(endpoint)?.maxOutputTokensParam;

/**
 * Whether the service at this endpoint refuses to be told how to sample.
 *
 * Endpoint-keyed like the two above. Undefined means the ordinary case, where
 * temperature and top_p are ours to set.
 */
export const presetHasFixedSamplingControlsForEndpoint = (
  endpoint: string | undefined
): boolean | undefined => presetForEndpoint(endpoint)?.hasFixedSamplingControls;

/**
 * The preset whose endpoint this exactly is, if we ship one.
 *
 * Match is on the exact endpoint string, which is what a player who picked a
 * preset ends up with. A hand-typed variation misses and falls back to the
 * neutral defaults above.
 */
const presetForEndpoint = (endpoint: string | undefined): ProviderPreset | undefined =>
  endpoint ? PROVIDER_PRESETS.find((preset) => preset.endpoint === endpoint) : undefined;
