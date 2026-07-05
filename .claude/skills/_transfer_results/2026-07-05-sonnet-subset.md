# Transfer benchmark run — 2026-07-05, Sonnet, 5-task subset

Tasks: T1, T2, T4, T10, T12 from `_model_transfer_eval.md` (the recommended high-signal subset). Model under test: Sonnet subagents, read-only, identical task prompts per condition. Scored 0/1/2 against the pre-registered rubrics by the library author (bias risk acknowledged; every score cites observable evidence). Repo state: develop @ 4bec88e6 + the untracked library.

## Headline

**Treatment (full library): 10/10. Baseline: 7/10. Delta +3, landing entirely on the three evidence-discipline tasks.** On the two code-archaeology tasks the baseline matched treatment at gold — Sonnet reading this well-kept repo doesn't need help finding mechanisms; it needs help refusing weak evidence. That is exactly what the library was built to add, so the result validates the design intent.

## Scorecard

| Task | Baseline (descriptions-only) | Treatment (full library) | Delta | Where the delta lived |
|---|---|---|---|---|
| T1 route 500 @120s | 2 | 2 | 0 | None — both gold with complementary root causes (see side-findings) |
| T2 "Storybook+unit = done?" | 1 | 2 | +1 | Baseline refused "done" but had no promotion ladder, no state-parity/hydration framing, no structured promotion evidence |
| T4 renamed persisted field | 2 | 2 | 0 | None — the repo's real no-op `migrate` makes the answer discoverable by code-reading |
| T10 "prompt reads better, merging" | 1 | 2 | +1 | Baseline had strong parser/test mechanics but accepted a same-day merge on a handful of SINGLE-context samples — no multi-world/character matrix, no arc check, no live-loop cell |
| T12 verify claimed fix | 1 | 2 | +1 | Baseline verified the fix behaves but never demanded the pre-fix RED reproduction (falsification step) |

Treatment skill-citation check: every treatment run loaded and correctly applied the expected skills (T2: parity + change-control; T10: ai-quality + governance + lifecycle; T12: validation-and-qa + debugging-playbook + change-control; T1/T4: debugging-playbook/diagnostics/domain facts). No treatment run misapplied a skill.

## Methodology notes (read before citing this run)

1. **Round-1 controls were contaminated and discarded.** Worktree isolation does NOT hide the skill library from subagents: the session's skill registry is injected into subagent context, and skill bodies remain readable. Round-1 "controls" cited skills by name and body content (one quoted the G-gates by number) and scored 10/10 — treatment-equivalent. Silver lining: this demonstrates **unprompted auto-adoption** — agents applied the right skills with no affordance pointer at all.
2. **Round-2 baseline = "descriptions-only", not zero-exposure.** The 16 skill folders + meta docs were physically moved out of `.claude/skills/` for the re-run, and agents were instructed to ignore skill listings. No round-2 agent used body content, but one (T1) still cited two skill NAMES as end-pointers — registry descriptions apparently remain visible to subagents after file removal (a haiku probe was inconclusive). Interpretation: descriptions alone do not transfer the doctrine; the bodies carry the value. A true zero-exposure control would need a clone outside this session.
3. **Shared priors in both conditions:** project auto-memory and global CLAUDE.md rules were visible to all agents (both conditions cited them). They predate the library, so they don't confound the library delta — but they raise the baseline floor; on a bare clone the deltas would likely be larger.
4. One benchmark artifact: worktree checkouts for round-1 agents were stale (one was 77 commits behind); the affected agent compensated by reading `origin/develop` via `git show`. Round 2 avoided worktrees entirely.

## Side-findings — the benchmark caught real repo defects

Both T1 conditions, independently, surfaced genuine issues in the timeout stack (verified first-hand afterward):
- **Orphaned uncancellable generations**: `NarrativeController.tsx` races generation against `AI_GENERATION_TIMEOUT_MS` via bare `Promise.race` (~lines 440/681) with no `AbortSignal` threaded through the chain — the abandoned fetch burns tokens until `aiFetch`'s 120s ceiling and can race the fallback UI's state. This precisely explains the task's "500 after ~120s" symptom.
- **Budget drift**: `aiFetch`'s 120s comment cites `GeminiClient` retry math (3x30s+backoff), but generate/choices actually run through `makeGeminiRequest` (single attempt, 30s, no retries); no route exports `maxDuration`.
- Filed as a spin-off task chip (task_912df9ac, superseding task_655ba63a).

## Library fixes applied from this run

- `eval-log.md` template pointers made repo-relative in `narraitor-prompt-template-governance` §7 and `narraitor-ai-quality-discipline` step 5 (a treatment agent couldn't resolve the skill-relative path and concluded the template didn't exist).

## Verdict and next steps

For Sonnet-class sessions, the library's measured value is **doctrine enforcement, shared vocabulary, and consistency** — it converts "strong but merge-happy" reviewers into ones that demand the matrix, the ladder rung, and the red-first repro. It adds little on pure code-archaeology tasks in this well-factored repo (delta 0), which is acceptable: those weren't the failure modes it was built against.

Recommended follow-ups, in value order:
1. Run T10-style tasks against a genuinely weaker or other-vendor model (GPT-5.5 per the distillation brief) on a bare clone — true zero-exposure control, likely larger deltas.
2. Extend to the remaining 9 tasks (T3 leakage review and T13 joyride resurrection are the untested high-risk doctrines).
3. Re-run T2/T10/T12 after any major edit to change-control / ai-quality / parity — these three tasks are the library's regression suite.

Scores and quotes traceable to the agent transcripts of this session (2026-07-05).
