/**
 * Browser stand-in for `@lenml/tokenizer-gemini`, swapped in by the client-side
 * webpack alias in next.config.ts and by the matching alias in
 * .storybook/main.cjs.
 *
 * The real package carries an 11 MB BPE merge table. Webpack emitted the whole
 * thing into the client build, and the `next/dynamic` GameSession import pulled
 * it down at the start of every real session, so players were paying 11 MB to
 * count tokens for a prompt they immediately hand to the server.
 *
 * The exact vocabulary now stays server-side. What the browser gets instead is
 * a deliberately low characters-per-token divisor: the only consumer that acts
 * on the number is `applyBudget`, and an estimate that runs high makes it
 * truncate a shade early rather than let an oversized section through. English
 * narrative prose sits nearer four characters per token, so this leaves roughly
 * 15% headroom. Dense scripts and emoji still count for more tokens than any
 * character ratio predicts — exact enforcement belongs on the server, where
 * routes assemble prompts against the real tokenizer.
 *
 * Callers only read `.length` off the result.
 */
const CONSERVATIVE_CHARS_PER_TOKEN = 3.5;

export function fromPreTrained() {
  return {
    encode(text: string, _options?: { add_special_tokens?: boolean }): number[] {
      if (!text) return [];
      return new Array(Math.ceil(text.length / CONSERVATIVE_CHARS_PER_TOKEN));
    },
  };
}
