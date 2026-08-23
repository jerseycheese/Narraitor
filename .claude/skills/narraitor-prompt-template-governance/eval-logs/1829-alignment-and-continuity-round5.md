# Prompt/template eval log - alignment ordering + continuity instrumentation (#1829 round 5)

- Change under test: three PRs merged to develop 2026-08-18 on unmeasured or partially-measured
  prompt changes. #1829 (issue open): the alignment glossary in `choiceTypeTemplates.ts` now
  runs NEUTRAL, CHAOTIC, LAWFUL (not the numbered-slot order), a mix must be stated on an
  `Alignment Mix:` line before any option is written, and a chaotic option must be one a bold
  player would take. #1843 (closed): the AI-suggested ending offer gates on an `unresolvedThreats`
  census read off the ending-detection response. #1868 (closed): a continuity contract whose only
  content is `recentDecisions` no longer gets discarded, so `Recent decision:` should reach the
  prompt from turn 1.
- Diff under test: develop at `92ed25b1` (branch point for worktree
  `playtest-1829-alignment-round5`).
- Date / evaluator: 2026-08-23, technical instrumentation read (no blind judge - this round reads
  store/prompt data directly, it does not score prose quality).
- Purpose note: this is not a `narraitor-playtest-loop` taste campaign. It is a single
  instrumented 30-turn live-Gemini session read for four specific technical facts. No rubric, no
  blind judge, no coverage-matrix claim.

## Setup

Worktree `playtest-1829-alignment-round5` off `origin/develop`, `.env.local` symlinked from the
main checkout, dev server on port 3273 (`Environments: .env.local` confirmed in the startup log),
Browser pane driven via a page-side autopilot posting progress/captures to a tiny receiver on
`localhost:8400` (the only origin the CSP allows besides `'self'`). World and character were
seeded directly through `useWorldStore`/`useCharacterStore` (Camp Crystal Lake horror preset,
cautious persona) rather than the wizards, since this round tests instrumentation, not the wizard
flow. Every `?fresh=true` load was navigated twice and `getSessionSegments(sid).length === 1`
verified before starting, per the harness's cold-start gotcha.

**Attempt 1** (Camp Crystal Lake, character Robin Vance) hit a hard fatal ending at turn 9 (critical
failure -> death, no "Continue Playing" recoverable offer, just an Epilogue screen) - this is the
known "natural-1-on-critical" risk documented from round 12, not a harness bug. Its 9 turns are
kept as a partial supplementary sample but are not the primary read.

**Attempt 2** (new world/character, Casey Doyle, same persona and build) ran the full 30 turns
clean: 0 timeouts, 0 `generationError`s, 0 harness retries needed after the button-timing fix
below. This is the primary dataset for all four reads.

**Harness note (own bug, not a product finding):** the first autopilot draft read
`getLatestDecision()` and clicked immediately; one turn (attempt 1, turn 2) raced a React
re-render and missed the button. Fixed by polling for a rendered `[data-testid="choice-option-*"]`
matching the freshly-read decision (up to 10 x 600ms) before clicking. No further misses in either
attempt.

Raw captures: `~/.claude/projects/-Users-jackhaas-Projects-personal-narraitor/artifacts/`
- `1829-round5-attempt2-settled-transcript.json` - all 31 segments (opening + 30 turns) re-read
  from the store after the run finished, including `debugInfo.fullPrompt` and `metadata.worldClock`
  per segment. This is the authoritative capture (see world-clock lag note below).
- `1829-round5-attempt2-runlog.json` - the autopilot's turn-by-turn log (decision, options,
  chosen option, segment id) captured inline during the run.
- `1829-round5-attempt1-partial-9turns-fatal.json` - the 9-turn partial run that ended in a fatal
  death.

## Read 1: Alignment ordering histogram

Source: `decision.options[].alignment`, read directly off `useNarrativeStore` (not DOM/screenshot
parsing) via `getLatestDecision(sessionId)` each turn. Verified against the rendered `AlignmentBadge`
on screen for turn 1 and turn 15 (matched exactly).

Attempt 2, 30 turns, 3 options/turn:

| Ordering (slot 1 / slot 2 / slot 3) | Count | % of 30 |
|---|---|---|
| NEUTRAL / LAWFUL / CHAOTIC | 21 | 70.0% |
| NEUTRAL / CHAOTIC / LAWFUL | 5 | 16.7% |
| LAWFUL / NEUTRAL / CHAOTIC | 4 | 13.3% |

Attempt 1 (supplementary, 9 turns before the fatal death): NEUTRAL/LAWFUL/CHAOTIC 6, NEUTRAL/
CHAOTIC/LAWFUL 2, NEUTRAL/CHAOTIC/NEUTRAL 1 (this is the one turn across both attempts without a
strict one-of-each mix). Combined across both attempts (39 turns): NEUTRAL/LAWFUL/CHAOTIC 27/39
(69.2%).

**Verdict on the ~60% ceiling: fails it.** The task's bar was "no single ordering >~60% of turns."
NEUTRAL/LAWFUL/CHAOTIC alone is 70.0% of attempt 2 and 69.2% combined. This is real progress over
#1827's prior measurement (29/30 turns *the same alignment*, not just the same order - #1827 barely
moved anything) - here the model uses three distinct orderings, not one - but "three orderings,
lopsided 70/17/13" is still a predictable pattern: slot 1 is NEUTRAL 26/30 turns (87%), slot 3 is
CHAOTIC 25/30 turns (83%). A player who reads slot 3 as "the reckless one" is right 83% of the time.

**Zero/two-chaotic-option turns:** 0/30 in attempt 2, 0/9 in attempt 1. Every single turn in both
attempts offered **exactly one lawful, one neutral, one chaotic** option - never two of a kind,
never a scene with no chaotic opening, never a scene with two. The template explicitly removed the
quota ("There is no quota... Two options may share a tag, and so may all of them") and gives
worked examples of non-1-1-1 mixes, but in 39 live turns across two independent sessions the model
never once produced anything but a strict one-of-each split. The **order** varies (that part of the
fix is working); the **mix** does not (that part is not - the model is still quietly running a
per-scene quota, just no longer a per-slot one).

**Slot-index-predicts-tag:** yes, materially. Slot 1 -> neutral 87% of turns; slot 2 -> lawful 70%;
slot 3 -> chaotic 83%. Better than the pre-fix 100%/100%/100% (#1827's baseline), worse than
"unpredictable."

**`Alignment Mix:` line - not verifiable through this instrumentation, and the task's premise about
where to look is wrong.** `segment.metadata.debugInfo.fullPrompt` is populated by
`narrativeGenerator.ts` for the **scene/prose** generation call only (`sceneTemplate.ts`).
`choiceGenerator.ts` - the caller of `alignedChoiceTemplate`, the template that actually contains
the `Alignment Mix:` line - never builds or attaches a `debugInfo` object at all (confirmed by
grep: zero references to `debugInfo`/`fullPrompt` in `choiceGenerator.ts`). So `fullPrompt` never
contains the alignment-mix prompt or the model's response to it, for any segment, by construction -
not because the model dropped the line, but because that call's prompt/response was never wired
into the field the task asked to check. Separately, `response.content` (the raw text that would
carry the model's actual `Alignment Mix: ...` line) is not stored on any client-exposed store field
and is not logged at any level in `choiceGenerator.ts`/`choiceGenerator.parser.ts` in the normal
path (only `logger.warn`/`logger.error` on malformed input, never a log of a well-formed response).
**Closest available proxy:** all 30 (attempt 2) + 9 (attempt 1) decisions parsed cleanly into
well-formed `[ALIGNMENT] option text` triples with no parser-fallback warnings tied to alignment
tags (the two `[ChoiceGenerator] Unknown skill "..."` warnings seen at turn ~24 were skill-requirement
parsing, unrelated to alignment) - consistent with the model following the FORMAT block, of which
the Alignment Mix line is a required preceding element, but this is inference, not a read of the
line itself. Confirming the line literally appears would need `choiceGenerator.ts` to attach
`debugInfo` the way `narrativeGenerator.ts` does - a real code gap, filed as a finding, not fixed
here (out of scope for an observational read).

## Read 2: `unresolvedThreats` census (#1843)

Source: `useEndingDetection.ts`. The census only exists inside the ending-check AI call
(`checkForEndingIndicators`), which is separate from both the scene and choice calls, runs
client-side (`ClientGeminiClient` proxy - confirmed via `createDefaultGeminiClient`'s
`typeof window !== 'undefined'` branch), and is not attached to any segment metadata. Its only
observable trace is `logger.debug('Holding the ending offer back, threads still open', {...})`,
which does reach the browser console (`console.debug`; verified live with a manual probe line that
did surface correctly).

**Result: the ending check never returned `suggestEnding: true` at accepted confidence in 30 turns.**
Zero "Holding the ending offer back" lines, zero ending-offer banners, zero "Continue Playing"
clicks needed anywhere in attempt 2. `majorEvent` fired on 25/31 segments and `worldClock.open`
stayed at 4-6 threads for turns 1-20, only reaching 0 at turn 28 (see Read 4) - i.e. the story had
real, tracked open threats for the great majority of the run, and the model correctly never
suggested wrapping up while they were live. That is sane behavior, but it means **the #1843
suppression branch itself was never exercised this round** - I cannot report whether an offer with
threads genuinely open gets correctly suppressed, because no offer was ever raised to suppress.
Not fixed-and-confirmed, not broken-and-confirmed: **not exercised**. The "missing census
suppresses the offer" risk specifically requires a run where the model wants to end while threads
are open and the census comes back null or malformed - this run's story simply never reached a
point where the model wanted to end. A future round aimed at this question should either force a
faster resolution arc or run past 30 turns to a natural conclusion (closer to "run 4" in the
campaign table) rather than a fixed 30-turn cautious run.

## Read 3: `Recent decision:` line at T1 (#1868)

Confirmed present on the very first player turn. `segment.metadata.debugInfo.fullPrompt` for the
segment generated in response to the player's first choice (idx 2 of 31 - the opening scene itself,
idx 1, has no `debugInfo` since nothing has been decided yet) contains:

> `- Recent decision: "Player chose: "Check the nearby counselor cabins for any signs of the
> others." [Skill checks: Stealth: SUCCESS (rolled 23 vs DC 6)]". Honor its consequences.`

`Recent decision:` is present on all 30 decision-bearing segments (idx 2-31), 30/30. #1868's fix -
a continuity contract whose only content is `recentDecisions` no longer gets silently discarded -
holds from turn 1 onward in this run, no exceptions, no gap.

## Read 4: World clock (#1822/#1869)

`metadata.worldClock` populated on all 31/31 segments, no gaps, shape matches
`{turn, open, overdue, opened[], advanced[], resolved[]}` throughout.

**Capture gotcha confirmed live:** reading `worldClock` inline at capture time (immediately after
each segment appears) returned `null` for every turn - this is the documented one-segment lag
(the clock is stamped after post-segment extraction reconciles, which is async). Re-reading the
same 31 segments fresh from the store after the run finished showed every segment correctly
stamped. The authoritative capture (`1829-round5-attempt2-settled-transcript.json`) uses the
post-run re-read; the inline `runLog2` capture does not carry worldClock and should not be read
for it.

| Turn | open | overdue | opened | advanced | resolved |
|---|---|---|---|---|---|
| 1 | 4 | 0 | 4 | 0 | 0 |
| 6 | 5 | 3 | 1 | 0 | 0 |
| 8 | 6 | 4 | 1 | 0 | 0 |
| 10 | 5 | 4 | 0 | 1 | 1 |
| 18 | 5 | 4 | 0 | 1 | 0 |
| 19 | 4 | 3 | 0 | 2 | 1 |
| 21 | 2 | 2 | 0 | 1 | 2 |
| 25 | 1 | 1 | 0 | 0 | 1 |
| 28 | 0 | 0 | 0 | 0 | 1 |
| 30 | 0 | 0 | 0 | 0 | 0 |

6 threads opened in total (4 seeded at t1, +1 at t6, +1 at t8), 6 resolved in total (t10, t19 x1,
t21 x2, t25, t28), `open` reaches exactly 0 at t28 and stays there - the ledger closes out cleanly
by the end of the run rather than accumulating unresolved cruft. `overdue` tracks `open` sanely the
whole way (never exceeds `open`, climbs while threads sit unresolved, falls as they resolve).

**Cross-check against the live ledger:** `window.useWorldThreadStore.getState()
.getOpenThreadsBySession(sessionId)` at the end of the run returned `[]` (0 threads) - matches
segment 31's stamped `worldClock.open: 0` exactly. Ledger and stamped metadata agree.

## Failure drill

- Malformed/empty response path: not exercised directly, but 0/30 turns in attempt 2 hit any
  parser fallback or `generationError`.
- Slow-response/timeout behavior: 0 timeouts in attempt 2 after the button-race fix; attempt 1's
  only failure was a hard fatal ending (a real in-story death, not a harness or generation
  failure).
- Fatal-ending path: attempt 1 exercised it directly (turn 9, critical failure -> death, Epilogue
  screen, no recoverable "Continue Playing"). Consistent with the round-12 documented risk; not
  a regression.

## Verdict

- **#1829: not fixed, keep issue open.** The ordering-shuffle half of the fix works (three distinct
  orderings observed, not the prior single-order 29/30 collapse) but the stated bar (~60% ceiling)
  is missed: NEUTRAL/LAWFUL/CHAOTIC is 70.0% of attempt 2 and 69.2% combined. The mix half of the
  fix does not appear to be working at all: 39/39 turns across two independent sessions produced
  exactly one lawful, one neutral, one chaotic option despite the template explicitly removing that
  quota. Filed as a comment on #1829 with these numbers, issue stays open.
- **#1843: inconclusive this round, not a regression.** The suppression branch was never invoked
  in 30 turns because the model never proposed ending while threads were open - correct behavior on
  its own terms, but it means this round produced no evidence either way for the specific
  "missing census suppresses a legitimate offer" risk #1843 flagged. Commented on #1843 noting the
  non-exercise rather than a false "confirmed fixed."
- **#1868: confirmed fixed.** `Recent decision:` present from turn 1, 30/30 turns. Commented on
  #1868 with the concrete turn-1 excerpt.
- **World clock (#1822/#1869): confirmed healthy.** 31/31 segments stamped, ledger and metadata
  agree, threads open/advance/resolve coherently across the full run. No comment filed (no open
  issue targeted this read specifically; #1822 is already shipped).
