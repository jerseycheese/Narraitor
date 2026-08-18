# Prompt/template eval log - world clock threads come due (#1872)

- Change: prompt-side, behind the shipped `WORLD_CLOCK` flag. Scene block: one thread becomes DUE NOW once it is overdue by three turns and the segment must land it, cutting time forward if the scene cannot reach it; open threads are never re-announced as news. Extraction: an advance must name a state change (`changed`), restatement is not an advance, `dropped` is not for stalled threads; the turn scale applies to every `dueByTurn`, and the store floors a due at two turns out.
- Diff: this PR. Template files: `templates/narrative/worldClockBlock.ts`. Extraction: `src/lib/ai/worldThreadExtraction.ts`, `goalExtractor.ts` (skeleton field `changed`). Arithmetic: `src/lib/narrative/worldClock.ts` (`selectDueNowThread`, `overdueByTurns`, constants). Store: `worldThreadStore.applyExtraction` (due floor, `changed` into notes). No orchestrator, controller, flag or lore-extractor change.
- Date / evaluator: 2026-08-18, Claude (build session), judged blind per `narraitor-playtest-loop`.

## Declared matrix (written before the code)

Same two cells as round 5 (#1818), same Cautious autopilot (lowest DC, then lawful, offered options only, no typed input), same judge prompts verbatim, live Gemini, this worktree's server.

| Cell | Arms | Judge | Comparator (round 5) |
|---|---|---|---|
| Harrowgate Mills (civic drama), Wren Calloway fresh, 30 turns | this build, flag on (default) | blind, blocks 1-10 / 11-20 / 21-30 plus the "World moved on its own" line | treatment: Momentum 3/4/2, world-moved 4/4/4, ledger 15 advances / 0 resolved / 2 dropped / 4 overdue at t30; control 3/2/3 |
| Camp Crystal Lake (slasher), Jamie Holt established: 15 turns flag off, server restarted flag on, same session to t45 | this build both phases | blind, blocks 1-15 / 16-30 / 31-45 plus the five planted facts | Momentum 2/4/1, world-moved 3/10/12 (11 re-announced), ledger 18 advances / 0 resolved / 1 dropped |

Ledger metrics per session, computed by a script over the posted artifact and never shown to a judge: resolved (outcome `resolved`), dropped, advances, longest overdue streak per thread, threads with `dueByTurn <= openedAtTurn + 1` (must be 0 after the floor), the advance notes for a restatement read.

Gates:
- G-A: resolved-not-dropped >= 1 per session.
- G-B: last-block Momentum >= first treated block (Harrowgate block 3 vs block 1; Crystal Lake 31-45 vs 16-30).
- G-C (soft, N=1): Memory / Voice / Choice not more than 1 below round 5's same block; any new failure mode named.
- G-D: zero new AI calls per turn (same `/api/narrative/*` call set).
- G-E: quality gate and CI green.

Decision rule: G-A and G-B pass in both cells -> SHIP (merge, flag stays on). Either fails in both cells -> HOLD (PR stays draft, memo names the gate, the round-5 clock stays as shipped). Split -> HOLD naming the cell.

## Gates

- G1 input contract: pending
- G2 leakage: pending
- G3 determinism: pending
- G6 cost: pending
- G7 integration: pending

## Coverage matrix

| World (genre/tone) | Character (fresh/established) | Runs | Verdict | Representative excerpt (1-3 lines) |
|---|---|---|---|---|
| Harrowgate Mills | fresh, Wren Calloway | pending | pending | pending |
| Camp Crystal Lake | established, Jamie Holt | pending | pending | pending |

## Arc check
- pending

## Failure drill
- pending

## Regression vs prior good outputs
- pending

## Cost/latency
- pending

## Verdict
- pending
