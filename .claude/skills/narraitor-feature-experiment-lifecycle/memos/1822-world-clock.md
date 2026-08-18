# Ship/hold memo — World clock: a ledger of open threads the story has to spend

- Issue: #1822 (spike #1835 settled the design in the 2026-08-17 comment; PR #1869)
- Class: AI-behavior (prompt + extraction), behind the build-time flag `WORLD_CLOCK` (`NEXT_PUBLIC_FEATURE_WORLD_CLOCK`)
- Acceptance criteria (from the issue, in its words): "Every turn, something the player is not doing should change: an off-screen actor advances one step, a threat closes one increment, a deadline ticks, or a consequence the player already created comes due." Measured as the blind judge's "world moved on its own" count per block, with Momentum / Stakes / Agency per block against a flag-off control on the same build.
- Declared eval matrix (AI experiments): Harrowgate Mills fresh (Wren Calloway), 30 turns flag on vs 30 turns flag off; Camp Crystal Lake established (Jamie Holt, 15 turns flag off then 30 flag on in the same session); one blind judge per transcript on `narraitor-playtest-loop/rubric.md`; the ledger dump read by the orchestrator, never the judge. F2's 8-of-10 blind-read bar stays at campaign level (#1818), as the plan declared.

## Gate results

| Gate | Result | Artifact |
|---|---|---|
| Quality gate (test/type/lint/lint:css) | pass, after the rebase onto develop at `bfc8ff61`: jest 426 suites / 2960 tests exit 0; `tsc --noEmit` exit 0; eslint 0 errors (127 pre-existing warnings); stylelint exit 0 | PR #1869 checks |
| Class-specific gates (prompt governance G1-G3, G6, G7) | pass: input contract via `NarrativeContext.worldClock`, no leakage beyond the model's own summaries and turn arithmetic, scene JSON unchanged, extraction JSON gains one fail-open member, ~720 input tokens per turn at 3 threads, zero new AI calls, live loop both flag states | `.claude/skills/narraitor-prompt-template-governance/eval-logs/1822-world-clock.md` |
| Parity ladder rung reached | S3: real `/worlds/[id]/play` loop against live Gemini, both flag states, before and after the rebase | eval log, PR body table |
| Fresh-state walk (P8) | pass: Harrowgate created through the stores in a clean browser profile, `?fresh=true` session, seed at t1, ledger and stamps survive a hard refresh; Crystal Lake created fresh for this round | eval log matrix rows 3-4 |
| Eval matrix (AI) | improved on the evaluated matrix, with a filed failure mode. Harrowgate: world-moved 1/0/0 -> 4/4/4, Momentum 3/2/3 -> 3/4/2, Stakes 3/2/2 -> 3/3/2, Surprise 2/2/2 -> 4/3/2, Memory/Voice/Choice equal to control. Crystal Lake: Momentum 2 -> 4 -> 1, world-moved 3 -> 10 -> 12 (block 3's are one sound re-announced). | eval log; round 5 on #1818 |

## Decision

- **SHIP.** Flip `WORLD_CLOCK` to default on. The mechanism does what the issue asked in both cells at no added call cost, lifts Momentum, Stakes and Surprise in the first treated block of both cells, and does not degrade Memory, Voice or Choice against the flag-off control. The flag stays in the tree as the off switch.
- The half that does not yet work, threads coming due, is filed as #1872 (advance-by-restatement, overdue never lands, loose `dueByTurn`) and #1873 (empty seed on the established path). Both are prompt-side experiments behind the same flag and re-run the same two cells; neither changes the store, the orchestrator or the template seam.
- Why not hold: the failing behavior (last-block circling) is the baseline's failure too - the control judge's sharpest problem was "both announced deadlines never arrive" with the clock off. The clock delays the collapse and moves the headline metric; holding it keeps the worse state in front of every player while the fix for the tail is worked.

## Residual risk
- N=1 per arm, two cells, one judge each. The protocol's 2x2 matrix was run as 2 cells by the plan's declaration; the fresh/Crystal Lake and established/Harrowgate cells are unread.
- Late-block regression: Harrowgate block 3 Momentum 3 -> 2 against control on N=1. If #1872 does not recover the tail, revisit with a second Harrowgate pair.
- Advance-by-restatement produces a new memory-fault shape (an event re-delivered as news, three times in the Harrowgate arm) that the judge scored inside the same Memory 2 as control; it may read worse to a human player than to the rubric.
- Extraction fail-open on ~1 turn in 15 leaves the prompt one turn stale; not player-visible, not measured for drift over longer sessions.
- The seed's turn arithmetic ("end of next week" -> due turn 3) makes OVERDUE fire early and stop carrying information until #1872 lands.
- Unrelated defects surfaced by the round and filed, not fixed: #1870 (bare `{` passage), #1871 (genre placeholder location). The HTML metadata leak the Crystal Lake judge saw (t19-t28) is what develop's scene rule 5 (#1859) targets; this round ran on the pre-rebase build.
