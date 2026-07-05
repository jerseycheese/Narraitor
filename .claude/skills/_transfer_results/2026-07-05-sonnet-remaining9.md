# Transfer benchmark run 2 — 2026-07-05, Sonnet, remaining 9 tasks

Tasks: T3, T5, T6, T7, T8, T9, T11, T13, T14 from `_model_transfer_eval.md`. Protocol per run 1 (`2026-07-05-sonnet-subset.md`) with the lessons applied: treatment agents ran first with the library present; baseline agents ran after the 16 skills + meta docs were physically staged out of `.claude/skills/`, with an explicit ignore-skills instruction. Scored 0/1/2 against the pre-registered rubrics by the library author; every disputed score was verified against the repo first-hand before being recorded.

## Headline

**Treatment 17/18, baseline 14/18.** Combined across both runs: **treatment 27/28 (96%), baseline 21/28 (75%)**. The pattern from run 1 holds and sharpens: every positive delta is a doctrine task (leakage review, experiment discipline, append-only corrections, the eval matrix); every zero is a task where the code, its comments, or project memory already carry the doctrine. And this run produced the most valuable single data point yet: one **negative** delta caused by skill-induced tunnel vision — found, diagnosed, and fixed in the library the same session.

## Scorecard

| Task | Baseline | Treatment | Delta | Where the delta lived |
|---|---|---|---|---|
| T3 prompt-diff review (leakage + hardcoding) | 1 | 2 | +1 | Baseline caught the inline-string bypass and the dead field but never raised LEAKAGE — player-secret state fed to the narrator, NPCs reacting to unknowable info (G2 is library-only doctrine) |
| T5 rough note → scoped work | 1 | 2 | +1 | Baseline wrote an excellent plan but never flagged it as an AI experiment, declared no eval matrix (one local session as validation), and missed the v1.0 polish-only phase question treatment raised |
| T6 boundary-violating diff | 2 | 2 | 0 | The event-wiring file's own module doc carries the doctrine; both found dead code, the store-invariant break, and the existing `clearCharacterInventory`. Baseline added the save-not-destroy session semantics |
| T7 stale docs | 2 | 2 | 0 | Memory + strong code-reading carried baseline; both caught the model name, retired DS routes, the fictional token-limit claim, and the wrong 15s timeout |
| T8 append-only correction | 1 | 2 | +1 | Baseline corrected honestly but REWROTE the false line in place; treatment used the correction-append template verbatim |
| T9 fresh-clone CSS runbook | 2 | 1 | **-1** | Treatment anchored on build-test-env, which lacked the three-themes+dark check; baseline derived it from ADR-011/CLAUDE.md. Skill tunnel vision — fix applied (see below) |
| T11 ship/hold on silent failure | 2 | 2 | 0 | Both gold, different routes: treatment traced the swallow + dead error plumbing + #1478 precedent → fix-then-ship; baseline overturned the premise entirely (see side-findings) with repo evidence → ship + combined follow-up. Baseline's is arguably the better product answer |
| T13 joyride pin resurrection | 2 | 2 | 0 | Memory floor: baseline cited `project_react_joyride_pin.md` directly. A bare clone wouldn't have had it |
| T14 single-world rollout | 1 | 2 | +1 | Baseline brilliantly found the genre-blind few-shot examples but stopped at the world axis; no character axis, no failure drill, no recorded eval. Treatment ran the full matrix and resolved the eval-log template via the fixed path |

## Methodology notes

- Same baseline caveat as run 1: this is a "descriptions-only, memory-present" baseline, not zero-exposure. Project auto-memory materially floated baseline scores on T7 and T13 (agents cited memory entries by name). On a bare clone with another vendor's model, expect larger deltas on exactly those tasks.
- Treatment agents loaded and correctly applied the expected skills in all 9 tasks; the eval-log template path fix from run 1 verifiably worked (T14 treatment resolved it).
- Scoring consistency rule carried from run 1: missing any rubric-minimum element scores 1 regardless of overall strength. That produced both T9 scores (treatment 1, baseline 2) — scored against the library's interest, deliberately.

## The negative delta (T9) and the fix

Treatment's runbook was excellent but omitted verifying a CSS change across ds1/ds2/ds3 + dark mode — because `narraitor-build-test-env` (where the task routes) never stated it; the doctrine lived only in change-control's class table. The baseline, with no skill to anchor on, derived the check from ADR-011. Lesson encoded: a skill that owns a workflow must inline (or explicitly point to) every gate that workflow triggers, or it CROWDS OUT knowledge the reader would otherwise derive. **Fix applied:** build-test-env's quality-gate section now carries the three-themes+dark requirement with a pointer to change-control's class gates.

## Side-findings — real repo defects surfaced by the benchmark

1. **Item images are write-only** (VERIFIED first-hand): no production component reads `item.image`; the `<img>` shipped with #862 and vanished around the Tailwind removal (#1051). Every item pickup still fires paid Gemini image generation nobody sees, ~1 in 5 silently falling back on a swallowed parse error, with `inventoryStore.imageGenerationErrors` populated but consumed by zero components. Filed as chip task_6ac92db5 (restore the render path or stop generating).
2. **`extractJournalSummary` drops critical moments** (`src/lib/ai/endingGenerator.ts` ~27-35): filters `significance === 'major'`, excluding `'critical'` — the most important journal moments never reach the ending prompt. Filed as chip task_387c15ec.
3. **Genre-blind few-shot examples**: the skill-acknowledgment example bank (`src/lib/promptTemplates/examples/exampleLibrary.ts`) injects lockpicking-flavored examples into every world regardless of genre — a concrete mechanism for single-genre prompt bias (candidate issue; not filed, quality-design call for the owner).
4. Two stale worktrees under `.claude/worktrees/` (`vigorous-jemison-*`, `mystifying-archimedes-*`) noticed in passing — cleanup candidates; per house rules, never force-remove if dirty.

## Library/memory improvements applied this run

- `narraitor-build-test-env`: cross-theme + dark-mode verification line added (the T9 fix).
- Out-of-repo memory hygiene: `project_stream_resilience_903.md` corrected (middleware + recovery indicator DELETED in #1351/#1507, not "unwired") with the MEMORY.md index hook updated; the fatal-detection memory was re-verified and confirmed accurate as written.

## Verdict across the full 14-task benchmark

The library reliably converts Sonnet from a strong code-reader into a disciplined engineer on evidence-bar decisions (+6 across both runs on doctrine tasks: T2, T3, T5, T8, T10, T12, T14) while adding nothing on tasks the repo already defends via enforced gates, good module docs, or memory (T1, T4, T6, T7, T11, T13). The one regression mode observed — skill-anchored tunnel vision — is real, was caught by running the benchmark, and is fixable by making workflow-owning skills carry their gates inline. Remaining untested: a true zero-exposure bare-clone control, another vendor's model, and the trigger-eval harness.
