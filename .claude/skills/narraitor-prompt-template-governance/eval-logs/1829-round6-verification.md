# Prompt/template eval log - alignment ordering rotation + debugInfo wiring (#1829 round 6)

- Change under test: PR #1929, merged to develop at `be731d2c` (round 6 of #1829). Two fixes: (1)
  the alignment glossary's own listing order in `alignedChoiceTemplate` now rotates through 4
  permitted orders, keyed off `turnIndex = useNarrativeStore.getSessionDecisions(sessionId).length`
  - an uncapped decision count, not the 5-segment-capped `previousSegments.length` a Codex review
    caught in the first draft (see `choiceGenerator.prompt.ts`'s `getTurnIndex`); (2)
  `choiceGenerator.ts` now attaches `decision.debugInfo` (dev-mode gated, same pattern as the scene
  generator), including a new `rawResponse` field holding the model's unparsed response text.
- Diff under test: worktree `playtest-1829-round6-verify` off `origin/develop` at `be731d2c` (no
  drift since - `develop` had not moved when this run started).
- Date / evaluator: 2026-08-23/24, technical instrumentation read (no blind judge - this round
  reads store/prompt data directly, it does not score prose quality). Same purpose and non-scope
  as round 5: not a `narraitor-playtest-loop` taste campaign, no rubric.
- Mix quota: explicitly out of scope for round 6 per the issue's own scope comment - two different
  mechanisms (#1827, #1877) already failed to move it. Reported below for completeness only; a
  1-1-1 mix every turn is expected, not a new finding.

## Setup

Worktree `playtest-1829-round6-verify` off `origin/develop`, `.env.local` symlinked from the main
checkout, dev server on port 3327 (`Environments: .env.local` confirmed in the startup log).
Browser pane driven via a page-side autopilot posting progress/captures to a tiny receiver on
`localhost:8400` (the only origin the CSP allows besides `'self'`).

Unlike round 5 (which seeded the world/character directly through the stores), this round went
through the real wizards: world "Camp Crystal Lake" created via `/worlds/create` with an
AI-generated horror preset (PG-13, balanced tone), character "Jamie Reyes" created via
`/characters/create` with an explicit cautious-persona background and personality ("careful and
risk-averse... prefers to observe, check for danger, and avoid confrontation"). The autopilot's
option-picking heuristic mechanically matches the persona: prefer a LAWFUL option, then NEUTRAL,
then whatever's first - it never picks CHAOTIC. Session started clean:
`getSessionSegments(sid).length === 1` verified before the run began, no `?fresh=true` split.

One continuous 30-turn run, no restarts needed: 0 timeouts, 0 `generationError`s, 0 ending-offer
banners encountered (the story never proposed wrapping up inside 30 turns), 0 harness retries.

Raw captures: `~/.claude/projects/-Users-jackhaas-Projects-personal-narraitor/artifacts/`
- `1829-round6-verify-settled-segments.json` - all 31 segments (opening + 30 turns), re-read from
  the store after the run finished, including `metadata.worldClock` and `causedByDecisionId` per
  segment.
- `1829-round6-verify-settled-decisions.json` - all 31 decisions, re-read from the store after the
  run finished, including full `debugInfo` (`fullPrompt` + `rawResponse`) per decision. This is
  the authoritative source for reads 1-3 below.
- `1829-round6-verify-runlog.json` - the autopilot's inline turn-by-turn log and per-turn captures,
  taken during the run rather than after.

## Read 1: Alignment ordering histogram

Source: `decision.options[].alignment`, off the post-run settled decisions (all 30 player-facing
decisions after the opening scene). Confirmed the parser does not reorder options after parsing -
`choiceGenerator.parser.ts` has exactly one `.sort()` call and it's unrelated (skill-match
scoring); options are appended to the array in the order the model wrote them.

| Ordering (slot 1 / slot 2 / slot 3) | Round 6 count | Round 6 % | Round 5 (attempt 2) % |
|---|---|---|---|
| NEUTRAL / LAWFUL / CHAOTIC | 25 | 83.3% | 70.0% |
| LAWFUL / NEUTRAL / CHAOTIC | 3 | 10.0% | 13.3% |
| NEUTRAL / CHAOTIC / LAWFUL | 2 | 6.7% | 16.7% |

**Distinct orderings: 3 of the 4 permitted** (same count as round 5 - CHAOTIC/LAWFUL/NEUTRAL and
CHAOTIC/NEUTRAL/LAWFUL never appeared as the *option* order in either round, even though both
appear in the *glossary listing* order - see Read 3).

**Verdict on the ~60% ceiling: fails it, by more than round 5 did.** NEUTRAL/LAWFUL/CHAOTIC is
83.3% of this run's 30 turns, against round 5's 70.0%. This is the same dominant order both
rounds land on - not a new pattern the model found, the same one - just held more tightly this
time.

**Slot-predicts-tag:**

| Slot | Round 6 top tag | Round 6 % | Round 5 % |
|---|---|---|---|
| 1 | NEUTRAL | 90.0% (27/30) | 87% |
| 2 | LAWFUL | 83.3% (25/30) | 70% |
| 3 | CHAOTIC | 93.3% (28/30) | 83% |

Worse on every slot, not better. A player reading slot 3 as "the reckless one" is right 93.3% of
the time in this run, up from round 5's already-high 83%.

**Zero/two-chaotic-option turns:** 0/30, same as round 5's 0/30 and 0/9. Expected and out of
scope per the task - not treated as a regression, just noted for completeness. The mix stays a
strict one-lawful/one-neutral/one-chaotic split every single turn across both rounds' 69 combined
turns now measured (39 + 30), regardless of what the glossary rotation is doing.

## Read 2: `Alignment Mix:` line compliance

This is the read round 5 could not do - `choiceGenerator.ts` never attached `debugInfo` before
round 6, so the model's raw response text was unavailable. It's wired now.

**Result: 30/30 turns (100.0%) had a literal `Alignment Mix:` line in `debugInfo.rawResponse`
before parsing stripped it.** Example, turn 3:

> `Alignment Mix: NEUTRAL, LAWFUL, CHAOTIC - the unsettling sounds from the woods create a need
> for cautious action or a more direct, but risky, approach.`

The model follows the FORMAT instruction to state and justify the mix before writing options,
every turn, no exceptions, no malformed lines, no parser-fallback warnings tied to alignment
tags. High enough that "is the model emitting the line" is settled - the wiring gap round 5 flagged
is closed and the answer is yes. This says nothing about *why* the stated mix order and the actual
option order still converge on NEUTRAL/LAWFUL/CHAOTIC almost every time (Read 1) - the model states
a mix explicitly and then still tends to write it out in the same slot order regardless of what
that stated mix says or what order the glossary above it just showed.

## Read 3: Rotation correctness past turn 5

Source: `debugInfo.fullPrompt`'s `ALIGNMENT DEFINITIONS (a glossary, not a running order - see
CHOOSING THE MIX below):` section, read for turns 1, 5, 6, 10, 15, 20, 25, 30.

| Turn | Glossary listing order | Decisions-so-far (`turnIndex`) | `turnIndex % 4` |
|---|---|---|---|
| 1 | NEUTRAL, CHAOTIC, LAWFUL | 0 | 0 |
| 5 | NEUTRAL, CHAOTIC, LAWFUL | 4 | 0 |
| 6 | CHAOTIC, LAWFUL, NEUTRAL | 5 | 1 |
| 10 | CHAOTIC, LAWFUL, NEUTRAL | 9 | 1 |
| 15 | CHAOTIC, NEUTRAL, LAWFUL | 14 | 2 |
| 20 | LAWFUL, CHAOTIC, NEUTRAL | 19 | 3 |
| 25 | NEUTRAL, CHAOTIC, LAWFUL | 24 | 0 |
| 30 | CHAOTIC, LAWFUL, NEUTRAL | 29 | 1 |

Every value matches `ALIGNMENT_GLOSSARY_ORDERS[turnIndex % 4]` exactly, and the order keeps
changing well past turn 5 (T6, T10, T15, T20, T30 all land on different entries) - the exact
regression Codex caught in the first draft, where keying off the 5-capped `previousSegments.length`
would have frozen the glossary on one order for the rest of any run past turn 5. **Confirmed fixed
and live**, not just passing in the unit test. This is the one round-6 mechanism that does exactly
what it was built to do. It just doesn't move Read 1's number, because the option order the model
writes doesn't track the glossary's listing order - compare turn 1 (glossary NEUTRAL, CHAOTIC,
LAWFUL; options came out NEUTRAL, LAWFUL, CHAOTIC) or turn 20 (glossary LAWFUL, CHAOTIC, NEUTRAL;
options still NEUTRAL, LAWFUL, CHAOTIC).

## Read 4: debugInfo persists end to end

Read `window.useNarrativeStore.getState().decisions` directly in the browser after the full run
finished (not the immediate return value from any single call, and not the inline per-turn
capture taken during the run).

**Result: 31/31 decisions in the post-run store have `debugInfo.fullPrompt` and
`debugInfo.rawResponse` populated.** Zero decisions missing it. This confirms both whitelist-fix
call sites (`usePlayerChoices.ts`, `useActiveGameSessionActions.ts`) carry `debugInfo` through to
the persisted store in the real UI flow, not just in the unit tests that caught the original gap
before merge.

## Verdict

- **#1829: not fixed, keep issue open.** The rotation mechanism (Read 3) and the debugInfo/mix-line
  visibility gap (Read 2, Read 4) both work exactly as designed and are confirmed live. But the
  axis the issue is actually about - whether a player can predict the option order - did not
  improve. NEUTRAL/LAWFUL/CHAOTIC is 83.3% of this round's 30 turns, worse than round 5's 70.0%,
  and slot-predicts-tag is worse on every slot (90/83/93 vs round 5's 87/70/83). Two different
  levers now (#1877's glossary reorder, round 6's glossary rotation) have each been tried,
  measured, and left the actual option order at least as predictable as before - closer to the
  pre-#1877 baseline (96.7% dominant, 100% every slot) than to anything resembling unpredictable.
  Round 6 did not make real progress over round 5 on the ordering axis; on this run's numbers it
  moved backward. Commented on #1829 with these numbers, issue stays open.
- **Alignment Mix line and debugInfo wiring: confirmed shipped and working.** 100% compliance rate,
  31/31 decisions carry debugInfo post-run. This closes the specific instrumentation gap round 5
  flagged, independent of whether it moved the ordering number.
- **Mix quota (1-1-1 every turn): unchanged, as expected.** Out of scope for round 6 per the
  issue's own scope comment - not re-litigated here.
