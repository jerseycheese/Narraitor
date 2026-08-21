---
name: narraitor-product-frontier
description: Narraitor's open frontier problems and how to attack them in THIS repo - long-arc story memory and coherence, consequence tracking, progressive streaming, replayability, and automated prompt evaluation. Use when asked "what's next", "what would make this state of the art", when scoping ambitious AI-narrative work, or to check whether a big idea already has an epic, an asset, or a failed attempt.
---

# Product frontier

## 1. Purpose
Name the problems that would move Narraitor past the state of the art, what the repo already has toward each, the first three concrete steps, and the falsifiable "you have a result when…" bar — so ambition lands as scoped work instead of vibes.

## 2. When to use
Post-1.0 planning; "make the story smarter/deeper" requests; evaluating whether a research-y idea fits this codebase.

## 3. When not to use
- v1.0 gate work → `narraitor-hardest-problem-campaign`. Routine features → `narraitor-feature-experiment-lifecycle` (frontier work still ships THROUGH that lifecycle).

## 4. Inputs required
Current epic map (`gh issue list --label epic --state open`) — frontier work must reconcile with existing epics, not duplicate them.

## 5. Procedure — the frontier problems

**F1. Long-arc story memory & coherence.** *Falls short today:* context is a fixed window over recent segments + lore facts, capped at assembly rather than by any budget; long sessions lose early threads; coherence is enforced by prompt instructions + a deterministic continuity guardrail with ONE corrective AI call (fail-open). *Assets:* loreStore (facts + dedup/merge + audit log), continuityStore, `narrative/summarize` + `story-checkpoint` routes, the `src/lib/promptContext/` assembly path (measurement only — no allocator). *First steps:* (1) instrument how often the guardrail fires and on what, across 3 long sessions; (2) measure what falls out of the context window in a 30+ turn arc; (3) prototype checkpoint-summary layering into context assembly behind a feature flag. *Result when:* on a scripted 30-turn arc, a plot fact from turns 1–5 is correctly referenced at turn 30 in >=4/5 runs across 2 worlds, vs a measured baseline.

**F2. Consequence tracking that players feel.** *Falls short:* choices carry alignment/trust metadata (#468 shipped) and world-state impacts exist (`narrativeStore.worldStateImpacts.ts`), but long-range payoff of early choices is weak. *Assets:* decisions with metadata, goalStore + goalExtractor, journal. *First steps:* (1) trace one real decision's data end-to-end; (2) define 3 concrete consequence archetypes (unlocked path, changed NPC stance, resource shift) and where each is injected into context; (3) eval per ai-quality-discipline matrix. *Result when:* a blind reader identifies which of two turn-20 transcripts followed choice A vs B, >=8/10 sessions.

**F3. Progressive streaming of prose (#1476 — open).** *Falls short:* 5–8s pop-in per turn. *Assets:* `BUFFERED_STREAMING` feature flag stub; per-route thin handlers make a streaming route addable. *Warning:* the old streamResilience middleware is DELETED (archaeology E7) — start fresh; SSE/chunked through Next 15 route handlers, client accumulates into narrativeStore. *First steps:* (1) spike a streaming variant of `narrative/generate` behind the flag; (2) keep the parse/normalize contract by streaming display-text only, committing the parsed segment at end; (3) fail-open to the non-streaming path. *Result when:* first tokens visible <2s at p50 with zero parse-contract regressions on the eval matrix.

**F4. Replayability.** *Falls short:* one session per world/character is the norm; endings exist but divergence isn't surfaced. *Assets:* endedSessions, endings, decisions with alignment axes, journal. *First steps:* (1) define what makes replay meaningfully different (divergent openings from tone/lore recombination?); (2) surface a "your story so far differed by…" recap from decision metadata; (3) playtest with fresh worlds. *Result when:* two playthroughs of the same world/character pair produce arcs a reader judges materially different, and the player can see why.

**F5. Automated prompt evaluation (the missing harness).** *Falls short:* the ai-quality-discipline matrix is manual; no golden corpus. *Assets:* template registry with typed context (fixtures are constructible), examples/ dir, `/dev/*` harness patterns, MSW canned shapes. *First steps:* (1) commit a fixture set (2 worlds x 2 characters as store-shape JSON); (2) a script that renders every registered template against fixtures and snapshots the PROMPTS (deterministic — catches template regressions without AI calls); (3) only then consider LLM-judged output scoring. *Result when:* a template edit that changes assembled prompts fails a deterministic check in CI.

## 6. Evidence required
Frontier claims obey the same bar: baselines measured before improvements claimed; results stated against the falsifiable criteria above.

## 7. Output artifact
A scoped epic/issue per the experiment lifecycle, citing which frontier problem, which assets, and the result criterion adopted.

## 8. Common traps
- Bad behavior this prevents: pitching a "memory system" rewrite that duplicates loreStore + checkpoint routes because nobody inventoried the assets first.
- Building F5's LLM-judge before its deterministic prompt-snapshot layer (judge drift will eat you).
- Landing frontier infra unwired "for later" — archaeology E7 says wire it or don't build it.
- Ignoring token cost: every context-growing idea pays per-turn (F1/F2 especially).

## 9. Related skills
`narraitor-feature-experiment-lifecycle` (the delivery path) · `narraitor-ai-quality-discipline` (evaluation) · `narraitor-failure-archaeology` (E7 streaming, settled battles) · `narraitor-domain-reference` (the assets).

## 10. Provenance and maintenance

Re-verify volatile claims with:
- `gh issue view 1476 --json state,title` (streaming still open?)
- `ls src/state/continuityStore.ts src/lib/promptContext/promptCalibration.ts` (assets intact)

Last generated: 2026-07-04 (develop @ 4bec88e6)
Known uncertainty:
- "Beyond state of the art" per the owner is provisionally long-arc coherence/consequences (from project memory) — owner-confirmation-needed on F-priority order.
- F1's guardrail behavior (fire rate, single corrective call) is memory+code-structure derived; instrument before building on it.
