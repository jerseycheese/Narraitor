// src/lib/ai/safety/contentRatingGuidance.ts

/**
 * Content rating handling that survives leaving Gemini.
 *
 * Gemini takes a `safetySettings` array and applies thresholds server-side.
 * Nothing in the OpenAI-compatible standard has an equivalent, so on those
 * providers the world's content rating can only be *asked for* in the prompt.
 * This module keeps both halves in one place: the rating parsed out of a
 * prompt, and the plain-language guidance injected for providers that have no
 * native control.
 *
 * The distinction matters to the player, not just to the code: on Gemini a
 * rating is a request to a filter, and everywhere else it is a request to the
 * model. The provider config UI says so in those words (see
 * `describeContentRatingEnforcement`), because a player writing to an R-rated
 * world deserves to know which one they are getting.
 */

export const CONTENT_RATINGS = ['g', 'pg', 'pg-13', 'r', 'nc-17'] as const;

export type ContentRating = (typeof CONTENT_RATINGS)[number];

/**
 * Recover the world's content rating from a built prompt.
 *
 * The rating isn't passed alongside the prompt anywhere in the request path —
 * the generators bake it into a "<RATING>-RATED CONTENT GUIDELINES" heading —
 * so both the Gemini safety-settings path and the guidance path read it back
 * out of the prompt text. Returns null when no heading is present, which every
 * caller treats as "apply the most conservative default".
 */
export function parseContentRating(prompt: string): ContentRating | null {
  const match = prompt.match(/((?:PG-13|NC-17|[A-Z]+))(?:-RATED)? CONTENT GUIDELINES/i);
  const candidate = match?.[1]?.toLowerCase();
  return CONTENT_RATINGS.find((rating) => rating === candidate) ?? null;
}

/**
 * Prompt language per rating, for providers with no safety-settings equivalent.
 *
 * Written as direction to a writer rather than as a filter specification,
 * because that is all it can be: a model that declines to write the scene will
 * decline regardless of what this says, and a model that has no moderation
 * layer will follow the direction. Neither outcome is enforcement.
 */
const RATING_GUIDANCE: Record<ContentRating, string> = {
  g: 'Write for a general audience of all ages. No violence, no frightening imagery, no profanity, no sexual content.',
  pg: 'Write for a broad audience. Mild peril and mild conflict are fine; keep violence bloodless, profanity absent, and sexual content off the page.',
  'pg-13': 'Write for a teenage audience and up. Moderate violence, mild profanity, and romantic tension are fine; keep graphic injury and explicit sexual content off the page.',
  r: 'Write for an adult audience. Graphic violence, strong profanity, and frank sexual themes are all in scope; keep explicit sexual acts implied rather than described.',
  'nc-17': 'Write for an adult audience with no content restrictions. Graphic violence, strong profanity, and explicit sexual content are all in scope when the scene calls for them.',
};

/** The default applied when a prompt carries no rating heading. */
const DEFAULT_GUIDANCE_RATING: ContentRating = 'pg-13';

/**
 * System-prompt guidance expressing a content rating for providers that cannot
 * enforce one. A null rating falls back to the conservative default rather than
 * to no guidance at all — silence would read to the model as "anything goes",
 * which is the opposite of what an unrated world should get.
 */
export function getContentRatingGuidance(rating: ContentRating | null): string {
  return RATING_GUIDANCE[rating ?? DEFAULT_GUIDANCE_RATING];
}

/**
 * One sentence for the provider config UI describing what a content rating
 * actually does on this provider. `nativeSafetySettings` comes from the
 * capabilities registry.
 *
 * Deliberately does not oversell the Gemini side either. Google's own docs now
 * put the default block threshold at "Off" for current models, and the
 * non-adjustable core-harm layer is not reachable by any setting, so even the
 * native path is a filter configuration rather than a guarantee.
 */
export function describeContentRatingEnforcement(nativeSafetySettings: boolean): string {
  return nativeSafetySettings
    ? "Your world's content rating is sent to Google as a safety-filter setting. The provider still applies its own core safety layer, which no setting turns off."
    : "This provider has no safety-filter setting, so your world's content rating is sent as guidance in the prompt. It asks the model to write to that rating — it does not enforce one, and the provider may still refuse content of its own accord.";
}
