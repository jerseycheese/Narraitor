# Prompt/template eval log — #1681 repeated-phrasing guardrail

- Change: added `enhancePromptWithPhraseVariety` (`src/lib/ai/narrativeGenerator.phraseVariety.ts`), wired into `NarrativeGenerator.generateSegment`'s enhance chain. Pulls words that repeat (count >= 2) across `narrativeContext.recentSegments` and appends a short "already used, find another angle" list to the prompt. No-ops when nothing repeats (fresh session, or genuinely varied prose).
- Diff: PR for issue #1681, branch `issue-1681-vary-recent-phrasing`
- Date / evaluator: 2026-08-05, automated implementation session (no live provider key available in this environment)

## Coverage matrix

Not run. This environment has no configured Gemini provider key (`.env.local` absent — BYO-key architecture, see `project_byo_key_architecture` memory), so a live multi-turn generation matrix (2+ worlds x 2+ characters x 3+ runs per narraitor-ai-quality-discipline section 5) could not be executed here.

What **was** verified deterministically (unit + integration, `src/lib/ai/__tests__/narrativeGenerator.phraseVariety.test.ts`):
- `extractRepeatedPhrases` returns words that reappear across segments, excludes words that occur once, excludes common short words, caps output at 8 words, and returns `[]` for no/undefined segments.
- `enhancePromptWithPhraseVariety` appends the flagged-words section only when there's something to flag; returns the prompt unchanged otherwise.
- Integration: `NarrativeGenerator.generateSegment()` includes `RECENTLY OVERUSED WORDS` with the actual repeated words in the real prompt sent to the AI client when `recentSegments` shows reuse, and omits the section entirely on a fresh session.

This proves the mechanism assembles correctly. It does **not** prove the model actually varies its phrasing in response — that requires the live matrix below.

## Arc check (>= 3 consecutive turns, one cell)
Not run (no live key). Recommend as manual QA follow-up: play 3+ turns in a world prone to repetition (per the issue, a survival/action genre reads worst) and confirm flagged words stop recurring verbatim, and separately that regular vocabulary (character names, established locations) isn't accidentally suppressed.

## Failure drill
- Malformed/empty response path: unaffected — this change only alters the outbound prompt, not response parsing (`narrativeGenerator.response*.ts` untouched).
- Slow-response/timeout behavior: unaffected — no new AI calls added (extraction is local/synchronous, no extra round trip).
- Missing/invalid key: unaffected — `extractRepeatedPhrases` and `enhancePromptWithPhraseVariety` run before the `geminiClient.generateContent` call and never touch the client.

## Regression vs prior good outputs
No prior eval log exists for this prompt surface to regress against. `sceneTemplate.ts`'s existing generic "vary your sensory language" line (line ~130) is unchanged — this change adds a second, more concrete signal alongside it rather than replacing it, per the issue's stated preference for a concrete list over a vague instruction.

## Cost/latency
- Added at most ~8 short words plus a fixed instruction sentence (~40-60 tokens) per turn, gated behind a new `phrase-variety` budget component (`target: 100, max: 200` tokens — smallest tier alongside `item-instructions`/`examples`) in `DEFAULT_ALLOCATIONS` (`src/lib/promptContext/tokenBudgetManager.ts`). No extra AI round trip. Negligible relative to the ~80k total request budget.

## Review follow-up (Codex, PR #1684)
Codex flagged that the original version counted NPC/location names like any other repeated word, so a name mentioned twice (e.g. "Mara") could land in the `RECENTLY OVERUSED WORDS` list and conflict with the scene prompt's instruction to use NPC names naturally (`sceneTemplate.ts` NPC METADATA RULES). Fixed by excluding known entity names (world name, player character, NPC roster, other important entities - all already available on the `buildNarrativeContext` output used earlier in the same request) before counting repeats. Added `buildKnownNameTokens` plus unit/integration coverage asserting an NPC name mentioned twice is never flagged while unrelated repeated words still are.

## Verdict
- Mechanism verified via deterministic tests; behavioral "reads better" claim is NOT made — no live matrix was run. Per narraitor-ai-quality-discipline, this stays a "single-sample impression" pending a manual QA pass with a real provider key.
- Ship decision: shipping the mechanism (small, reversible, fail-open — no-ops when there's nothing to flag) with the live-quality check flagged as a follow-up manual QA item, not a blocking gate for this small-complexity issue. Recorded at: PR for issue #1681.
