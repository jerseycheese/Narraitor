/**
 * Feature flags, read from NEXT_PUBLIC_* env vars.
 *
 * This file is the one place a flag's default lives. `.env.example` carries a
 * commented override line for every flag so an operator can find one without
 * reading `src/lib/`. Add a flag in both places, or the example file lies.
 *
 * Env access stays literal on purpose: Next.js inlines `process.env.NEXT_PUBLIC_*`
 * at build time, so a dynamic lookup keyed off a variable would read undefined
 * in the browser.
 */
const FEATURE_FLAG_DEFAULTS = {
  // Client-side typewriter reveal over an already-complete response.
  // Real token streaming from /api/narrative/generate now
  // covers the same "text should arrive progressively" goal for the live
  // play surface, so this defaults off — playing both back to back would
  // double the reveal instead of speeding it up. Kept as an opt-in fallback
  // for embeds/environments where the real stream's onChunk never fires.
  BUFFERED_STREAMING: false,
  PROGRESSIVE_DISCLOSURE: true,
  // The world clock feeds the scene prompt a ledger of open story threads, so
  // it changes what the model writes. On since the round-5 ship memo
  // (narraitor-feature-experiment-lifecycle/memos/1822-world-clock.md); the
  // env var is the kill switch.
  WORLD_CLOCK: true,
  // The world can take something from the character: the post-segment
  // extraction records a cost (a condition written to the character, an item
  // loss attributed to the thread that took it) and the scene prompt carries
  // the character's conditions. Off until the playtest declared in
  // narraitor-prompt-template-governance/eval-logs/1882-world-cost.md measures it.
  WORLD_COST: false,
  // Renders the world's founding description in the per-turn scene prompt.
  // Measured and shipped in issue #1865: keeps world-specific contextual pressure
  // (e.g. deadlines, stakes) alive across 20+ turns without prompt amnesia or looping.
  // See narraitor-prompt-template-governance/eval-logs/1865-world-description-in-scene.md.
  WORLD_DESCRIPTION_IN_SCENE: true,
  // Guards against the engine backfilling a conversation that never happened.
  // The player naming a prior private exchange with a rostered NPC
  // turns co-presence already on the segments into an assertable fact, which
  // reaches the contract, the deterministic detector, and the lore extractor.
  // On by default: the whole path is gated on a rare turn, and off means a
  // byte-identical prompt and no extra calls.
  UNRECORDED_EXCHANGE_GUARD: true,
  // Feeds delivered commitments into the live aligned-choice prompt as a short
  // already-settled block. Off by default until live evaluation passes.
  SETTLED_COMMITMENT_CHOICES: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAG_DEFAULTS;

/**
 * A default-off flag turns on only for the exact string "true"; a default-on
 * flag turns off only for the exact string "false". Anything else (unset,
 * "TRUE", "1", junk) keeps the default.
 */
const resolve = (value: string | undefined, defaultValue: boolean): boolean =>
  defaultValue ? value !== 'false' : value === 'true';

const getFeatureFlags = (): Record<FeatureFlag, boolean> => ({
  BUFFERED_STREAMING: resolve(
    process.env.NEXT_PUBLIC_FEATURE_BUFFERED_STREAMING,
    FEATURE_FLAG_DEFAULTS.BUFFERED_STREAMING
  ),
  PROGRESSIVE_DISCLOSURE: resolve(
    process.env.NEXT_PUBLIC_FEATURE_PROGRESSIVE_DISCLOSURE,
    FEATURE_FLAG_DEFAULTS.PROGRESSIVE_DISCLOSURE
  ),
  WORLD_CLOCK: resolve(
    process.env.NEXT_PUBLIC_FEATURE_WORLD_CLOCK,
    FEATURE_FLAG_DEFAULTS.WORLD_CLOCK
  ),
  WORLD_COST: resolve(
    process.env.NEXT_PUBLIC_FEATURE_WORLD_COST,
    FEATURE_FLAG_DEFAULTS.WORLD_COST
  ),
  WORLD_DESCRIPTION_IN_SCENE: resolve(
    process.env.NEXT_PUBLIC_FEATURE_WORLD_DESCRIPTION_IN_SCENE,
    FEATURE_FLAG_DEFAULTS.WORLD_DESCRIPTION_IN_SCENE
  ),
  UNRECORDED_EXCHANGE_GUARD: resolve(
    process.env.NEXT_PUBLIC_FEATURE_UNRECORDED_EXCHANGE_GUARD,
    FEATURE_FLAG_DEFAULTS.UNRECORDED_EXCHANGE_GUARD
  ),
  SETTLED_COMMITMENT_CHOICES: resolve(
    process.env.NEXT_PUBLIC_FEATURE_SETTLED_COMMITMENT_CHOICES,
    FEATURE_FLAG_DEFAULTS.SETTLED_COMMITMENT_CHOICES
  ),
});

export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  return getFeatureFlags()[flag];
};
