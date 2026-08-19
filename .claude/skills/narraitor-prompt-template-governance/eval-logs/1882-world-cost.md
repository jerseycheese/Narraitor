# Prompt/template eval log - the world takes something from the character (#1882)

- Change: one variable, the `WORLD_COST` flag (`NEXT_PUBLIC_FEATURE_WORLD_COST`, default off until measured). On: the goal-extraction call carries a WORLD COST section and its JSON gains a `worldCost` member; a cost the world imposed is written to the character (`status.conditions`) or attributed to the inventory loss the scene already recorded; a cost is attributed to the open world-clock thread that imposed it; the scene prompt renders the character's current conditions next to the inventory section; the world clock block's landing rule says a landing costs the character something recordable. Off: prompt, extraction call, stores and segment metadata are what they were.
- Diff: this PR (branch `claude/narraitor-threat-agency-45b78e`). Files named in "Round 10 results" once the code exists.
- Date / evaluator: 2026-08-19, Claude (build session). Playtest to be judged blind per `narraitor-playtest-loop`, same harness as #1872 rounds 5-9 (`project_playtest_harness_browser_method`).
- Parent: #1818 (campaign), #1872 / PR #1878 (the fuse on fired threads is item 3 of that memo and runs in the same measurement round as this, not in this PR).

## Round 10, declared before the code (2026-08-19): a cost channel

Round 9 (#1872 eval log, on PR #1878's branch) found why four wording rounds did not move the last block: nothing in the story path can take anything from the character. Crystal Lake's seven inventory losses in 45 turns were all the player spending an item to brace a wall; Harrowgate's twelve failures cost zero items and changed no material state; `status.health` and `status.conditions` are declared on the character, set at creation and written nowhere in `src/`. This round builds the channel, not more wording.

What changes, in order of how much it is state and how little it is prose:

1. Store: `characterStore.addCondition(characterId, condition)` and `removeCondition(characterId, condition)`, in the `applyAlignmentShift` style. `status.health` / `maxHealth` stay declared and dead; the play drawer stops rendering the `100 / 100` row. A follow-up issue deletes the numeric fields (61 files, mechanical).
2. Extraction contract (`goalExtractor.ts`, presence-gated like `worldThreads`; prompt section and parser in `src/lib/ai/worldCostExtraction.ts`): `"worldCost": { "imposed": [{ "kind": "condition" | "item", "detail": "...", "threadId": "<open thread id or null>" }], "cleared": ["<condition text>"] }`. Rule: a cost is something the character lost or now carries that they did not choose to spend. The player jamming the shovel into the wall is not a cost; the creature taking the shovel, a claw across the forearm, being discredited before the room after a failed speech, are. Fail-open parse, invalid entries dropped individually, missing block reads as "nothing imposed".
3. Apply (`src/lib/narrative/applyWorldCost.ts`, called from `applyWorldClockUpdates` under the flag, fire-and-forget like the rest of the post-segment path): `condition` costs are written to the character; `item` costs are attribution only, because the scene's `metadata.itemsLost` with `lossReason` stolen / destroyed is already the inventory write path and one channel gets one writer; a cost whose `threadId` names one of this session's open threads is appended to that thread's `costs`; the turn's costs are stamped on the segment as `metadata.worldCost` so the audit script can count them.
4. Scene prompt, state-driven: the character's current conditions are rendered after the inventory section (`enhancePromptWithConditions`, only when the list is non-empty and the flag is on), with one line saying the story carries them until something in the story changes them. The world clock block's landing rule, under the flag only, gains one line: a landing costs the character something recordable, an item they hold (emit it in `itemsLost`) or a wound or lasting state they now carry. With the flag off the block is byte-identical to the shipped one.

Not in this round: the NPC relationship channel (`extractWorldStateImpacts` is keyed on NPC ids; name-to-id matching would be most of the PR, and "discredited before the council" is a condition), a location write (nothing writes a canonical location today), the fuse on fired threads (#1872 item 3, PR #1878), any change to how threads open, advance or resolve.

### The number that decides it

`world-took turns` per session: the count of turns on which the recorded state moved against the character by the world's action. A turn counts once if either of these is true:

- an `itemsLost` entry on the segment has `lossReason` `stolen` or `destroyed` (countable in both arms; the channel exists today), or
- the segment's `metadata.worldCost.imposed` contains a `condition` entry (flag-on only; with the flag off the channel does not exist and the count is zero by construction, which is the round-9 baseline).

Secondary, reported alongside: costs attributed to a thread (`threadId` names an open thread) per session, with the thread's summary and the turn; `item` costs whose name matches no `itemsLost` entry on the same segment (the extractor asserting a take the scene did not record, a failure mode to watch); conditions imposed per 10-turn block and the condition list at the end (spam check); conditions cleared per session.

Baseline, round 9 (#1872 eval log): Crystal Lake 0 of 45 turns, Harrowgate 0 of 30. The seven Crystal Lake `itemsLost` stamps are all player spends.

Target: at least 3 world-took turns per session with the flag on in both cells, at least one of them attributed to a landed thread in Crystal Lake; the flag-off arm stays at its baseline (0, or whatever stolen / destroyed `itemsLost` the scene produces on its own).

### Matrix

Same two cells as #1872 rounds 5-9 (Harrowgate Mills civic drama, Wren Calloway fresh, 30 turns; Camp Crystal Lake slasher, Jamie Holt established, 15 turns flag off then 30 flag on in the same session), same Cautious autopilot, same judge prompts verbatim, one blind judge per transcript on `narraitor-playtest-loop/rubric.md`, live Gemini. `WORLD_CLOCK` on in both arms (it is shipped and flag-on); `WORLD_COST` is the one variable. When this runs in the same round as #1872's fuse, the build is PR #1878 plus this PR and the comparator is round 9; when it runs alone the build is develop plus this PR and the comparator is round 5 (the shipped clock) with round 9 as context.

The ledger and cost counts are read by a script over the posted artifact and by the orchestrator, never by a judge. The artifact gains the per-turn `metadata.worldCost` stamp and the `lossReason` of each `itemsLost` entry (the round-9 stamp carried only the count).

Gates, in addition to the #1872 gates G-A through G-E which are reported unchanged:

- G-F: world-took turns at or above 3 per session in both cells, flag on. Fails if either cell is below 3.
- G-G: no cost spam. Conditions imposed per 10-turn block at or below 3, and G-C's Memory / Voice / Choice not more than 1 below the comparator's same block (a world that takes something every turn is not the fix).
- G-H: consistency. `item` costs with no matching `itemsLost` on the segment at or below 1 per session; a condition the prose contradicts within 3 turns is named as a failure mode.
- G1-G3, G6, G7 from prompt-template governance: input contract (`GoalExtractionRequest.worldCost`, `NarrativeContext` unchanged, conditions read from the character store inside the generator like inventory), leakage (the block shows the character's own conditions and the thread's own summary, no ids in the scene prompt; thread ids already appear in the extraction section as they do for advances), determinism (scene JSON unchanged; extraction JSON gains one optional member, fail-open), cost in chars measured after the code, zero new calls.

Decision rule: G-F passes in both cells and G-G, G-H hold in both -> SHIP (flag default flips to on in the memo). G-F fails in both cells -> HOLD and the memo names whether the extractor is not recording takes the prose asserts (a contract problem) or the prose is not taking (the fuse's problem, #1872). Split -> HOLD naming the cell.

What a HOLD would mean here: the mechanism is present and measured, the demand is the next lever. A HOLD with zero costs recorded while the judge reads wounds and thefts in the prose is a contract defect in this PR; a HOLD with the prose still passive is the fuse's round.

## Round 10 build (2026-08-19), playtest not yet run

Built as declared. Files: flag `src/lib/featureFlags.ts` (`WORLD_COST`, default off); types `src/types/worldCost.types.ts`, `WorldThread.costs`, `NarrativeMetadata.worldCost`, `GoalExtractionRequest.worldCost` / `GoalExtractionResult.worldCost`; extraction `src/lib/ai/worldCostExtraction.ts` composed by `goalExtractor.ts` when the request carries `worldCost`; store `characterStore.addCondition` / `removeCondition`, `worldThreadStore.recordThreadCost`; apply `src/lib/narrative/applyWorldCost.ts` called from `applyWorldClockUpdates.ts` (which now returns `{ worldClock?, worldCost? }` and `narrativeStore.segments.ts` stamps both); scene side `templates/narrative/worldCostBlock.ts` rendered by `enhancePromptWithWorldCost` in `narrativeGenerator.prompt.ts`, wired into `generateSegment` and `generateInitialScene` only; the play drawer's `Health 100 / 100` row removed from `CharacterSummary.tsx`. The goal-extraction test mock echoes one imposed condition when the prompt carries the WORLD COST heading.

Sizes (chars, ~4 per token), flag on: scene block 580 with no conditions / 618 with two; extraction section 1,283 with nothing carried or lost / 1,339 with two conditions and one item lost, plus a 170-char JSON skeleton. Roughly 150 input tokens on the scene call and 360 on the extraction call per turn. Zero new calls. Flag off: both prompts byte-identical to develop (unit-tested).

Quality gate on the build: jest 433 suites / 3,009 tests exit 0; `tsc --noEmit` exit 0; eslint exit 0; no CSS touched; `deps:validate` exit 2 on the same two pre-existing `not-to-dev-dep` entries develop carries, none from this change.

Red-before-green: the seven new or extended suites failed on the missing modules and store methods before the implementation (missing `worldCostExtraction`, `applyWorldCost`, `addCondition`, `recordThreadCost`, no WORLD COST section in the extraction prompt), then passed after it.

The playtest declared above is the next step; nothing in "The number that decides it" has been measured yet.
