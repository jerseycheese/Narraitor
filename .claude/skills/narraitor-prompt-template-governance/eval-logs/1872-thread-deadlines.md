# Prompt/template eval log - world clock threads come due (#1872)

- Change: prompt-side, behind the shipped `WORLD_CLOCK` flag. Scene block: one thread becomes DUE NOW once it is overdue by three turns and the segment must land it, cutting time forward if the scene cannot reach it; open threads are never re-announced as news. Extraction: an advance must name a state change (`changed`), restatement is not an advance, `dropped` is not for stalled threads; the turn scale applies to every `dueByTurn`, and the store floors a due at two turns out.
- Diff: PR #1878 (`a4a40d01` on develop `068bde91`). Template files: `templates/narrative/worldClockBlock.ts`. Extraction: `src/lib/ai/worldThreadExtraction.ts`, `goalExtractor.ts` (skeleton field `changed`). Arithmetic: `src/lib/narrative/worldClock.ts` (`selectDueNowThread`, `overdueByTurns`, `DUE_NOW_OVERDUE_TURNS = 3`, `MIN_DUE_HORIZON_TURNS = 2`). Store: `worldThreadStore.applyExtraction` (due floor, `changed` into notes). No orchestrator, controller, flag or lore-extractor change.
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

## Round 7, declared before the code (2026-08-18)

The memo's three re-entry changes on the same PR, wording only, no seam or store change:
1. OPEN: an offstage threat the prose introduces (a sound, an arrival, a message, a move by someone not in the scene) is a thread, and a major event the player did not cause with no open thread covering it gets opened; every summary is phrased as the event that will land, not a standing state ("Thorne comes to collect the favor" rather than "the player owes a favor"). The seed phrases its threads the same way. The block's empty-ledger move is named as a thread the story now owes.
2. RESOLVE: `resolved` requires `resolution` to name the outcome (who won the vote, what came through the door, what was lost); the calling, the departure toward it, or a change of sound is an advance.
3. DUE NOW keeps its pick rule; with every thread event-shaped by construction there is nothing state-shaped to exclude, and the section's landing list gains "the debt is collected".

Same two cells, same autopilot, same judge prompts, same gates G-A to G-E and the same decision rule as round 6. Comparators: round 6 (this PR before the changes) first, round 5 as context.

## Gates

- G1 input contract: `WorldClockPromptContext.threads[i]` gains `overdueByTurns` and `dueNow`, both computed in `buildWorldClockPromptContext` from the store's own turn indices; `WorldThreadExtractionResult.advanced[i].changed` replaces the optional `note`. Nothing smuggled through `currentSituation`; the seam (`NarrativeContext.worldClock`) is unchanged.
- G2 leakage: the block adds only the picked thread's own summary and its overdue count. No ids, no store internals. The extraction section adds a turn scale and rule wording; the seed still reads `toneSettings.customInstructions` as before.
- G3 determinism: scene response JSON unchanged. Extraction JSON's `advanced` entries change field name (`changed`); the parser drops entries without it (fail-open to "no advance", unit-tested), everything else parses as before.
- G6 cost, measured in chars (~4 per token), no new call: scene block 821 empty / 1,203 at 3 threads / 1,981 at 3 threads with a DUE NOW pick / 2,471 at the 8-thread cap with a pick (round 5: 664 / 1,062 / 1,881). Extraction section 1,559 / 1,931 / 2,571 at 0 / 3 / 8 threads (round 5: 1,805 / 2,629 / 2,427 on the seed turn). The DUE NOW section is about 780 chars (~195 tokens) and renders only while a pick exists.
- G7 integration: live loop through `/worlds/[id]/play` on this worktree, both flag states (Crystal Lake phase 1 flag off, phase 2 flag on); the same `/api/narrative/*` call set as round 5 (`generate`, `choices`, `summarize`, `validate-event-significance`), no new endpoint.

## Coverage matrix

| World (genre/tone) | Character (fresh/established) | Runs | Verdict | Representative excerpt (1-3 lines) |
|---|---|---|---|---|
| Harrowgate Mills (civic drama, dramatic) | fresh, Wren Calloway | 30 turns, this build flag on, Cautious autopilot (29 picks, all DC 0, 0 errors), one blind judge on `rubric.md` | mixed. Judge: Momentum 3/2/3, Stakes 3/3/3, Surprise 3/4/3, Agency 3/2/3, Memory 3/2/2, Voice 3/2/2, Choice 3/3/3; world-moved 3/3/4. Round 5 treatment: 3/4/2, 3/3/2, 4/3/2, 3/3/3, 4/2/2, 3/2/2, 3/3/2; 4/4/4. Ledger: 3 seeded t1 + 1 opened t25, 23 advances, 1 resolved, 0 dropped, 2 overdue at the last stamped turn (t29), 0 floor breaches, 28/30 stamps (t12, t30 missing). The one resolution is the six-week vote, recorded at t29 as "The vote has been formally called by Martha Vance"; the judge's sharpest problem is that "the vote is called" lands at t10, t14, t15, t17, t18, t19, t29 "and never once resolves". The DUE NOW pick from t6 to t30 was the state-shaped seed thread "player's debt to those who appointed them" (due 3, floored from the seed); it sat DUE NOW for 24 turns, was hand-waved at t24 ("the pressure from your appointed supporters ... now dissipates") and never resolved. Zero `transition` segments: the forward time cut was never taken. | t25: "an independent assessment of Rowan Textiles' value will be commissioned ... the doors at the back of the room creaked open, admitting two stern-faced individuals in dark suits". t29: "Martha Vance ... brings her gavel down with a sharp, final crack. 'The vote is called'". Judge, block 3: "the one time the player wins a real concession (T25's independent assessment) it is overwritten by the same line four turns later." |
| Camp Crystal Lake (slasher, mysterious, R) | established, Jamie Holt (15 turns flag off, server restarted flag on, same session to t45) | single arm; blind judge in three 15-turn blocks; autopilot 14 + 30 picks, all DC 0, 0 errors | ledger improved, story did not. Judge: Momentum 2/3/2, Stakes 2/3/4, Surprise 3/3/3, Agency 3/4/2, Memory 3/2/1, Voice 3/2/1, Choice 2/2/1; world-moved 4/12/13. Round 5: 2/4/1, 2/3/2, 2/3/1, 3/4/2, 3/2/2, 2/2/1, 2/2/1; 3/10/12. Seed at t16 returned zero threads again (#1873). Two threads opened (t19 whistle from the lodge, due 21; t27 thwack from the shed, due 29), 5 advances, both resolved (t22: the pair reach the lodge, the dog is dead; t36: the thwack "replaced by a new, more descriptive and disturbing sound"), 0 dropped, 0 open at the end; the thwack thread was DUE NOW t32-t35 and landed at t35-36 (a plank bursts inward, the sound changes) after 7 overdue turns against round 5's 25. Ledger empty for t37-t45 (nothing opened in nine turns of a siege) while the judge counts seven concurrent offstage menaces. 28/30 treated stamps (t37, t39 missing), 0 floor breaches, zero `transition` segments. Five planted facts at t45: radio held; town distance, local knowledge and 1984 forgotten; "no kids" contradicted (campers and a lost child from t36). | t22 (whistle thread lands): the lodge in disarray, the dog's collar torn and bloody. Judge, block 3: "43, 44, and 45 each have the player's back hitting a cold wall that 'isn't the one you expected' ... Turn 45 is turn 44 with one new CRACK." Sharpest problem: "Every turn from 16 onward introduces a new offstage threat sound ... and none of them ever arrives, is seen, or resolves". |

Matrix shortfall, stated: N=1 per cell, one judge each, two of the protocol's four cells, as declared. Round 5's numbers are the comparator; no same-day control arm was run.

## Arc check (>= 3 consecutive turns, one cell)
- Harrowgate: the six-week vote (due t30) is pulled into the single council meeting from t7 and stays in a called / delayed loop for the rest of the session (called at t10, t14, t15, t17, t18, t19, t29; delayed by the player's procedural options at t11, t20, t23, t24, t30). The extractor recorded 18 advances on it, most of them real state changes by the new rule's letter ("hands raised", "delayed", "called again"), and one `resolved` at t29 on the calling, not the outcome. The judge reads it as never resolving. Two verbatim re-narrations (t16 mirrors t13, t24 mirrors t23) and a genre-placeholder location at t18 and t28 (#1871).
- Crystal Lake: the whistle thread is the round's one clean payoff (t19 open, t22 the dog dead in the lodge, judge: "the first real loss"). After t36 the ledger is empty and the block's empty-ledger rule ("MUST show the world moving on its own") produces a new offstage sound almost every turn (world-moved 13/15 in block 3) that the extractor never files as a thread, so nothing is owed and nothing lands; the judge's block-3 Memory 1 / Voice 1 / Choice 1 is the same collapse round 5 saw.
- Contradictions found: Crystal Lake t36-t45 campers and a lost child against "no kids yet"; an axe conjured for both characters (t37, t39); a door both braced (t30-31) and gone (t35). Harrowgate t30 counts three suits where t25-26 established two.

## Failure drill
- Malformed/empty response path: `parseWorldThreadExtraction` drops advances without `changed` (unit-tested alongside the existing junk cases); an all-restatement turn therefore reads as "nothing moved", which is the intended failure direction. Fail-open elsewhere unchanged: 2 of 30 stamps missing in each cell (Harrowgate t12, t30; Crystal Lake t37, t39), the prompt read one turn stale, no player-visible effect.
- Slow-response/timeout behavior: unchanged, extraction is fire-and-forget after `addSegment`.
- Harness, not product: a hidden browser pane throttles the autopilot's `setTimeout` to once a minute after ~5 min (Harrowgate turns went 6 s -> 35 s -> 60 s while the server answered in ~2 s); a network-backed sleep against the port-8400 receiver fixed it (Crystal Lake mean 6.7 s per turn). Recorded in the harness memory.

## Regression vs prior good outputs
- Compared against: round 5's same cells (`fd475d46`, flag on) as the comparator; round 5's flag-off control as context.
- Old strengths preserved? Harrowgate: world-moved 3/3/4 vs 4/4/4 (flat within N=1), Memory 3/2/2 vs 4/2/2 (block 1 down one), Voice equal, Choice 3/3/3 vs 3/3/2. Crystal Lake: world-moved 12/13 vs 10/12 in the treated blocks, Memory 2/1 vs 2/2 (block 3 down one), Voice 2/1 vs 2/1, Choice 2/1 vs 2/1. Ledger metrics all moved the right way in both cells: resolved 0 -> 1 and 0 -> 2, dropped 2 -> 0 and 1 -> 0, longest overdue streak 27 (a state-shaped thread) and 25 -> 7, floor breaches 4 -> 0 and n/a -> 0. Failure handling unchanged (every autopilot pick DC 0 in both cells; the failure template is #1821's territory).
- New failure modes named: (1) the "vote is called" loop, where a deadline pulled forward is called and blocked turn after turn and the extractor accepts the calling as the resolution; (2) DUE NOW on a state-shaped thread ("owes a debt") produces a hand-wave, not a landing, and never clears; (3) with an empty ledger the block's fallback manufactures a new offstage sound each turn that the extractor never files, so the story menaces without owing.
- Not the clock's: Crystal Lake t26 ends "This narrative segment was generated by an AI assistant." and t30 ships a raw metadata block as prose (the #1859 / #1870 family); "Abandoned Mansion" location placeholder t23-t29 (#1871).

## Cost/latency
- Token delta: see G6. About 195 extra input tokens per turn while a DUE NOW pick exists; the block without a pick is roughly 35 tokens larger than round 5's at 3 threads. Zero new calls (G7).
- Latency: none added on the turn path. Harrowgate mean 9.3 s per turn is the harness throttling, not the model (server-side `generate` 0.5-6 s in the logs); Crystal Lake phase 2 mean 6.7 s.

## Verdict
- HOLD, by the rule declared above. G-A passes on the count in both cells (Harrowgate 1 resolved / 0 dropped, Crystal Lake 2 / 0), with the caveat that Harrowgate's one resolution is the calling of a vote the judge says never happens. G-B passes in Harrowgate (block 3 Momentum 3 vs block 1 3; up from round 5's 2) and fails in Crystal Lake (31-45 Momentum 2 vs 16-30 3; round 5 was 1 vs 4). Split -> HOLD naming Crystal Lake. G-C within one point everywhere, G-D and G-E pass.
- What the round shows: the ledger side of #1872 moved (resolutions above zero, no drops, overdue streaks a third of round 5's, no near dues), the DUE NOW pick landed an event-shaped thread inside four turns, and the last block is one point better than round 5 in both cells. What it did not show: last-block Momentum recovering to the first treated block in the slasher cell, and the prose-side symptom the issue names ("re-announces the same event instead of paying it off") is still the sharpest problem both judges found, now as a vote called seven times and seven offstage sounds that never arrive.
- Ship/hold decision recorded at: `.claude/skills/narraitor-feature-experiment-lifecycle/memos/1872-thread-deadlines.md` (HOLD; re-entry condition there). Round posted to #1818 as round 6.
