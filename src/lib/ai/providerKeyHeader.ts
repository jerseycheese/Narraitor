/**
 * Header carrying a player's bring-your-own API key from the browser to our own
 * API routes. The key is sent per request, used server-side for that one call,
 * and never logged or persisted. Shared by the client (request side) and the
 * server (resolution side) so the name can't drift.
 */
export const PROVIDER_API_KEY_HEADER = 'x-provider-api-key';

/**
 * Header carrying the model the player picked in their provider configuration.
 * It rides alongside the key rather than in each route's body so the routes'
 * request schemas stay about the generation, not about provider plumbing.
 */
export const PROVIDER_MODEL_HEADER = 'x-provider-model';

/**
 * Header carrying which kind of provider the key belongs to (see ProviderType).
 * Without it the server can only assume Gemini, which is how a key meant for
 * another service would end up being sent to Google.
 */
export const PROVIDER_TYPE_HEADER = 'x-provider-type';

/**
 * Header carrying the provider's chat-completions URL. Only meaningful for
 * OpenAI-compatible providers, which disagree on the path (`/v1/chat/completions`,
 * `/chat/completions`, or something custom) — so the full URL comes from the
 * player's configuration rather than being assembled server-side.
 *
 * SECURITY: this is an attacker-reachable URL that the *server* dereferences.
 * It is honoured only when the same request carries the caller's own key, and
 * only after passing the endpoint guard.
 */
export const PROVIDER_ENDPOINT_HEADER = 'x-provider-endpoint';
