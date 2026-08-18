# Ship/hold memo — World clock: threads come due (#1872)

- Issue: #1872 (parent #1822, campaign #1818, PR #1878)
- Class: AI-behavior (prompt + extraction wording, one store floor), behind the shipped build-time flag `WORLD_CLOCK` (`NEXT_PUBLIC_FEATURE_WORLD_CLOCK`)
- Acceptance criteria (from the issue, in its words): "Re-run the same two cells (Harrowgate fresh, Crystal Lake established) and read the last block specifically: the target is a resolved-not-dropped count above zero per session and last-block Momentum at or above the first treated block."
- Declared eval matrix (AI experiments): the round-5 cells re-run on this build, Harrowgate Mills fresh 30 turns flag on and Camp Crystal Lake established 15 turns flag off then 30 flag on in the same session; same Cautious autopilot, same judge prompts verbatim, one blind judge per transcript on `narraitor-playtest-loop/rubric.md`; the ledger read by a script and by the orchestrator, never by a judge; gates G-A through G-E and the decision rule written into `eval-logs/1872-thread-deadlines.md` in the first commit, before the code.

## Gate results

| Gate | Result | Artifact |
|---|---|---|
| Quality gate (test/type/lint/lint:css) | pass: jest 426 suites / 2968 tests exit 0; `tsc --noEmit` exit 0; eslint exit 0; `deps:validate` exit 2 on develop too (two pre-existing `not-to-dev-dep` entries) | PR #1878 checks, all green |
| Class-specific gates (prompt governance G1-G3, G6, G7) | pass: seam unchanged, no new leakage, scene JSON unchanged, extraction `advanced` gains a required `changed` with fail-open parse; block 1,981 chars at 3 threads with a DUE NOW pick (~195 extra input tokens while a pick exists); zero new calls, same route set | eval log |
| Parity ladder rung reached | S3: real `/worlds/[id]/play` loop against live Gemini, both flag states, this build | eval log |
| Fresh-state walk (P8) | pass: both worlds created through the stores in a clean origin, `?fresh=true` sessions, seed at t1 (Harrowgate) and the resumed session re-read from IndexedDB across a server restart (Crystal Lake) | eval log |
| Eval matrix (AI) | G-A pass on the count in both cells (Harrowgate 1 resolved / 0 dropped; Crystal Lake 2 / 0). G-B pass in Harrowgate (block 3 Momentum 3 vs block 1 3), FAIL in Crystal Lake (31-45 Momentum 2 vs 16-30 3). G-C within one point everywhere. G-D, G-E pass. | eval log; round 6 on #1818 |

## Decision

- **HOLD.** The declared rule says a split on G-B is a hold naming the cell: Crystal Lake. PR #1878 stays a draft against develop; the round-5 clock stays shipped as it is, flag on.
- Failing gate: G-B in Crystal Lake, last-block Momentum 2 against a first-treated-block 3 (round 5 was 1 against 4). The blind judge's sharpest problem is the issue's own symptom, unchanged in kind: "every turn from 16 onward introduces a new offstage threat sound ... and none of them ever arrives". Harrowgate's G-A pass is a letter pass: its one resolution is the six-week vote recorded as resolved on being "formally called" at t29, and that judge's sharpest problem is that the vote is called seven times "and never once resolves".
- What the round did move, and why this is a hold and not a retire: every ledger metric went the right way in both cells (resolved 0 -> 1 and 0 -> 2, dropped 2 -> 0 and 1 -> 0, longest overdue streak 25 -> 7 on the one event-shaped thread the DUE NOW pick was aimed at, no near dues, no advance recorded as a bare reminder), and last-block Momentum is one point above round 5 in both cells (2 -> 3, 1 -> 2). The mechanism lands event-shaped threads (a sound at the shed came through inside four DUE NOW turns) and does nothing for state-shaped ones ("owes a debt" sat DUE NOW for 24 turns and was hand-waved). N=1 per cell, so a one-point move is inside the noise either way.
- Re-entry condition (what flips this to ship): a round on the same two cells where Crystal Lake's last-block Momentum is at or above its first treated block AND each session's resolutions name an outcome, not an announcement. The three specific things the round says to change first, in order:
  1. Extraction OPEN: an offstage threat the prose introduces (a sound, an arrival, a message) is a thread; the ledger sat empty for t37-t45 of a siege while the judge counted seven concurrent menaces. Cap what the block may invent while threads are open, and when the ledger is empty prefer filing the menace the prose just made over asking for another.
  2. Extraction RESOLVE: `resolved` needs the outcome named in `resolution` (the vote's result, who came through the door), not the calling or a change of sound; the two weak resolutions this round would both fail that test.
  3. Block DUE NOW: only pick event-shaped threads (kind `deadline` or `actor`, or a consequence whose summary names an event); a state-shaped consequence gets a different ask (a cost, not a landing) or is left to age. Consider whether a `transition` needs to be permitted more strongly, since neither session used the forward cut at all.
- Not a retire: the direction is right and cheap (no new call, ~195 tokens while a pick exists); the wording is what needs another turn of the crank, and the flag and the seam do not change.

## Residual risk
- N=1 per arm, two of the four protocol cells, one judge each; round 5 is the comparator with no same-day control arm, so day-to-day model drift is inside the comparison.
- The Harrowgate cell shows a new loop shape the clock can create: a far-off deadline pulled into the current scene and re-called every turn the player blocks it. Under the shipped clock the same vote sat quietly at due 30; under this build it became the story's treadmill. If this ships later, watch for it.
- Extraction fail-open on 2 of 30 stamps in each cell (prompt one turn stale); the empty seed on the established path (#1873) reproduced exactly (zero threads at t16, first thread at t19).
- Unrelated defects surfaced, not fixed: Crystal Lake t26 ends with "This narrative segment was generated by an AI assistant." and t30 ships a raw metadata block as prose (the #1859 / #1870 family, on develop `068bde91` with the scene rule 5 in place); the `Abandoned Mansion` placeholder location (#1871) at t23-t29.
- Harness: a hidden browser pane throttles the autopilot's timers to once a minute after about five minutes; the round switched to a network-backed sleep mid-way through Crystal Lake phase 1 (documented in the harness memory). No effect on the transcripts, only on wall clock.
