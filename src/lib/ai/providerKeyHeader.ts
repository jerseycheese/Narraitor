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
