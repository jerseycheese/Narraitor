---
name: narraitor-ai-quality-discipline
description: The evidence bar for AI narrative quality in Narraitor. Use when judging whether a prompt or generation change "works", when someone says "the output reads better", "the AI handles it", "works on my world", or when evaluating narrative coherence, choices, endings, or any Gemini-generated behavior. Encodes why one good generation is a signal not evidence, and how to turn a hunch into a checked improvement.
---

# Narraitor AI quality discipline

## 1. Purpose
Prevent the most seductive failure in this project: judging stochastic AI behavior by a single sample. Generation quality claims need the same rigor as code claims — defined coverage, deliberate failure-path exercise, recorded results.

## 2. When to use
Any change to prompts, templates, context assembly, generation config, parsing/normalization, or any claim about narrative/choice/ending quality.

## 3. When not to use
- The generation pipeline is *erroring* (500s, timeouts, parse crashes) → `narraitor-debugging-playbook`.
- Registering/structuring a template → `narraitor-prompt-template-governance` (the lifecycle); this skill supplies its eval gate.

## 4. Inputs required
The exact change (template diff, config diff); a live dev server with a working provider key; at least two contrasting worlds and characters (create them if needed — that IS the work).

## 5. Procedure

**The core axioms:**
1. One good generation ≠ a reliable prompt. Gemini at temperature 0.7 varies per call; a good sample proves possibility, not tendency.
2. A passing unit test ≠ shippable UX. Unit tests pin parsing and template assembly; they cannot pin prose quality, pacing, or coherence.
3. Model output is not ground truth. It is confidently wrong exactly when it reads most fluent — verify claims the narrative makes about world/character state against the stores.
4. Coherence is an arc property. A turn can read well while contradicting the session — judge across a multi-turn arc (does it respect established lore facts, character attributes, prior decisions, inventory?).
5. "Reads better" is a hypothesis. It becomes a result only via the protocol below.

**The evaluation protocol (minimum bar for any behavior claim).** This section is the SINGLE HOME of the matrix minimums — sibling skills cite it rather than restate numbers; if another file disagrees with this section, this section wins:
```text
1. Fix the variable: change ONE thing (one template, one config value) per evaluation.
2. Coverage matrix: >= 2 contrasting worlds (different genre/tone) x >= 2 characters
   (one established with history, one fresh) — 3+ generations per cell.
3. Arc check: for narrative changes, play >= 3 consecutive turns in one cell;
   verify continuity against loreStore facts and prior segments.
4. Failure drill: exercise the non-happy path at least once —
   empty/malformed response handling (the parse/normalize layer), a slow response,
   and a missing/invalid key. MECHANISM, by failure type — they need different tools.
   There is NO in-app mock toggle; mock at the network boundary or below:
   - Slow / error / rate-limit / intermittent: intercept the route. In Playwright,
     tests/visual/utils/mockApi.ts already routes the AI endpoints and takes
     per-endpoint delays (narrativeDelayMs / choicesDelayMs / endingDelayMs); for a
     non-200 or an intermittent failure, add a `page.route` handler that fulfills with
     the status you want. In Jest, mock the src/lib/api wrapper the component calls.
   - Truly malformed/empty response BODY (the parse-error path — e.g. the item-image
     20%-parse-failure class): exercise at the parse layer with a unit fixture (a
     `Response` whose `.json()` throws). A routed mock still returns well-formed bytes,
     so it cannot reproduce this class.
   - Missing/invalid key: omit or corrupt the provider key (see diagnostics-and-tooling).
     Routes fall back on their own when no key resolves, so a keyless dev environment
     is itself a useful drill.
   Timeouts are layered: 30s server-side on generate/choices, 120s client-side in aiFetch.
5. Record: for each cell, verdict + one representative excerpt + what you compared against.
   Template: `.claude/skills/narraitor-prompt-template-governance/templates/eval-log.md`.
6. Verdict language: "improved on the evaluated matrix" — never "better" unqualified.
```

**Judging quality (what to actually look at):**
- Consistency: names, locations, inventory, attributes match store state; no retconning prior segments.
- Choice quality: choices are distinct, in-world, consequential — not three flavors of "continue".
- Tone adherence: matches the world's tone settings (they flow into safety settings and prompts — `parseContentRating` in `src/lib/ai/safety/contentRatingGuidance.ts`, then `getSafetySettingsForRating` in `src/lib/ai/providers/gemini/adapter.ts`).
- Ending integrity: endings resolve threads present in the session, not generic epilogues.
- Length/pacing: respects `desiredLength`; no runaway walls of text (maxOutputTokens caps exist per route).

## 6. Evidence required
The recorded matrix (step 5). A claim without a matrix is downgraded to "single-sample impression" and may not drive a ship decision.

## 7. Output artifact
An eval log (matrix + excerpts + verdict) attached to the issue/PR. For hold decisions, the log states which cell failed.

## 8. Common traps
- Bad behavior this prevents: a prompt tweak looks great in the fantasy test world, ships, and produces tonally absurd output in a player's noir detective world — the tweak baked fantasy assumptions into shared template text.
- Testing only on `/dev/*` harnesses: they bypass parts of the real loop. At least one matrix cell must run the real `/worlds/[id]/play` flow.
- Letting the model grade itself: "the output says it followed the tone" is not evidence; you compare output to store state and tone settings yourself.
- Fixing bad output by adding instructions ("do not repeat yourself") without re-running the matrix — instruction soup degrades other cells silently.
- Cost blindness: longer prompts/context raise latency + token cost per turn, and nothing trims the prompt back for you. When growing context, estimate the delta with `estimateTokenCount` (`src/lib/promptContext/tokenUtils.ts`) and read the real figure off the DevTools calibration panel, fed by `recordRequestCalibration` (`src/lib/ai/narrativeGenerator.calibration.ts`).

## 9. Related skills
`narraitor-prompt-template-governance` (lifecycle + registry rules) · `narraitor-diagnostics-and-tooling` (curl smokes, watching real payloads) · `narraitor-change-control` (what "reliable" may claim) · `narraitor-product-frontier` (automating this protocol is an open problem).

## 10. Provenance and maintenance

Re-verify volatile claims with:
- `grep -n "gemini-\|temperature\|maxOutputTokens" src/lib/ai/config.ts` (model + generation config)
- `grep -n "AI_REQUEST_TIMEOUT_MS" src/lib/ai/aiFetch.ts` (timeout ceiling)

Last generated: 2026-07-04 (develop @ 4bec88e6)
Known uncertainty:
- No golden-output corpus exists yet; regression comparison is manual against excerpts saved in prior eval logs (candidate tooling — see product-frontier F5). Do NOT use `src/lib/promptTemplates/examples/` for this — it is a few-shot library injected INTO prompts; editing it changes live behavior.
- The minimum matrix size (2x2x3) is expert-set doctrine, not yet owner-ratified — but it is BINDING until the owner explicitly relaxes it; uncertainty about ratification is not an exemption from the gate.
