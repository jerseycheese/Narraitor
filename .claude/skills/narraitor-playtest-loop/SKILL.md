---
name: narraitor-playtest-loop
description: Drive real multi-turn game sessions in a browser against live Gemini and score whether the story is actually engaging. Use when asking "is this fun to play", "does the narrative hold up over 30 turns", "why does the story get boring", when planning a release playtest, or when a change to prompts or narrative logic needs a before-and-after read on story quality. This is the taste instrument; narraitor-qa-walkthrough is the release defect gate and narraitor-ai-quality-discipline is the evidence bar both of them answer to.
---

# Playtest loop

## 1. Purpose

Every automated tier in this repo can be green while the game is boring. Unit tests prove
functions return, visual specs prove pixels match, and neither reads a single sentence of
prose. This skill closes that gap by playing the actual game through the actual UI against
live Gemini, capturing the transcript, and handing it to a judge who has never seen the app.

It answers one question: does the story hold up over a real session, or does it fall apart
somewhere around turn twenty.

## 2. When to reach for this instead of a sibling skill

`narraitor-qa-walkthrough` finds defects before a release. It walks every surface and asks
whether things work. Its Phases 4 through 6 delegate the live story loop to this skill. Do
not copy its curl-chaining workaround for live generation: browser automation reaches the
real path on its own, per section 3. That skill has not been corrected yet.

`narraitor-ai-quality-discipline` sets the evidence bar. It says one good generation is a
signal, not evidence, and it owns the eval matrix for prompt changes. This skill is one
concrete way to meet that bar for story quality specifically.

`visual-crawl` and `design-loop` cover pixels. Neither reads the story.

## 3. The harness

**Real AI runs fine under browser automation.** `isPlaywrightEnv()` in
`src/lib/utils/isPlaywrightEnv.ts` trips only when the user agent contains "Playwright" or
`window.__PLAYWRIGHT__` is set, and the second only happens inside
`tests/visual/utils/seedTestData.ts`. A browser session that avoids both runs the real
generation path end to end. Do not call `seedTestData` and do not call `mockApiEndpoints`,
or the whole loop silently no-ops.

**Setup, in order:**

1. Reset the worktree onto `refs/remotes/origin/develop` so the build under test is current
2. Copy `.env.local` from the main checkout, which already carries `GEMINI_API_KEY`. Never
   type a key into the BYOK wizard.
3. Set `.claude/launch.json`'s Next.js port to this worktree's port from
   `node scripts/worktree-port.js`, then start the server through the preview tooling
4. Confirm the startup log says `Environments: .env.local`

**Driving a turn:** click `[data-testid^="choice-option-"]`, or type into
`[aria-label="Custom response input"]` and press `[aria-label="Send"]`. Both live in
`src/components/shared/ChoiceSelector/ChoiceSelector.tsx`. The custom input is an `INPUT`,
not a `TEXTAREA`, so the native value setter has to come off the right prototype or the
call throws "Illegal invocation".

**Driving the wizards:** their selects key off `id`, not `name`. `#content-rating`,
`#narrative-style`, `#language-complexity`.

**One click per tick.** Clicking five toggles in a single JavaScript call registers one,
because React re-renders between them and the later clicks land on stale nodes. Stagger
them with `setTimeout(fn, 300 * i)` inside one call, then verify the result in the next
call. Range inputs batch fine. Buttons do not.

**Fire batches, do not await them.** The JavaScript bridge times out at 30 seconds and a
turn costs 4 to 8, so any batch past three turns dies mid-run holding the tool call open.
Kick the loop off without awaiting it, park progress on a `window` flag, and poll that flag
from later calls. The work survives the timeout either way — round 4 lost a call to a 5-turn
`await` and found the batch had completed in the background regardless — but polling is the
difference between reading the result and guessing at it.

**Handle the ending offer at the top of every action, and handle it per run.** Somewhere
around turn 14 the session offers "Your story could end here" with View Ending and Continue
Playing. It suppresses the choice list, so a runner that ignores it stalls for the rest of
its batch and reports a timeout that looks like a hung generation. Check for it before each
action rather than once at the start.

What to click depends on the run. **Fixed-length runs click Continue Playing** — the offer
fires well before turn 30 and accepting it ends the session early with the block scores
unfinished. **Run 4 clicks View Ending**, because a naturally suggested ending is the thing
that run exists to reach; dismissing it there leaves the run either circling forever or
scoring a forced ending, which is a different question. A runner that hard-codes one branch
breaks whichever run it did not consider.

**Capturing a turn:** one JavaScript call returning compact JSON from
`window.useNarrativeStore.getState()` for `segments` and `decisions`, plus
`useJournalStore` and `useInventoryStore`. All of them are exposed on `window` whenever
`NODE_ENV` is not production, per `src/lib/utils/shouldExposeStoreOnWindow.ts`. Note that
`segments` and `decisions` are both keyed records rather than arrays, so read turns in
order through `getSessionSegments(sessionId)` and not by index. Token counts are not
available on this path; see section 4.

**Pair a segment to its decision through `metadata.causedByDecisionId`, never by zipping
the two arrays on index.** They do not line up, and the failure is silent: the first
campaign's index-zipped transcript showed turn 1 offering options about a pry bar that did
not exist until later. A misaligned transcript produces a confidently wrong verdict, which
is worse than no verdict.

**Turn latency is 4 to 6 seconds in steady state.** The 20 to 24 seconds on the first few
turns is Next compiling the route, not the model. Do not log it as a performance finding,
and do not measure latency at all until the routes are warm.

**Assert usability every turn, not just when something looks wrong.** A state dump will
happily report a healthy store while the player is staring at a modal that covers the
choices. Every capture checks, and reports as warnings: a mounted Joyride tooltip, the
first choice button outside the viewport, `body` scroll-locked, the choice button not being
the topmost element at its own center, a visible "Jump to latest" affordance, and a
non-null `generationError`. These cost nothing and catch the whole class.

**Screenshot at turn 1 and every fifth turn after, and read them.** The first run of this
skill set screenshots to anomaly-only and played two turns underneath a full-screen tour
overlay without noticing. The state dump looked perfect. One screenshot at turn 1 would
have shown the tooltip sitting on top of the prose it was telling the player to read. A
screenshot also catches what no assertion thinks to check, like an NPC present in the prose
but missing from the character chips.

**Walk the tutorial tours on at least one run.** Skipping them every time leaves the entire
first-run path untested, and the tours are modal, so they are part of whether the opening
is playable at all.

## 4. Harness checkpoint

Run this at turn 3 of the first session, before spending the rest of the budget. If any
line fails, fix the harness first.

1. `window.__PLAYWRIGHT__` is undefined and the user agent has no "Playwright" in it
2. The network shows real POSTs to `/api/narrative/generate` and `/api/narrative/choices`
3. `useNarrativeStore.getState().getSessionSegments(sessionId)` returns 3 segments with
   distinct prose in each
4. A journal entry exists. `/api/narrative/summarize` is suppressed under the Playwright
   gate, so its output proves the gate is off. This is the strongest single signal in the
   list, because it is the one thing a mocked run cannot fake.

**`segments` is a `Record<EntityID, NarrativeSegment>`, not an array.** `.length` is
`undefined` on it and `segments[2]` is an id lookup rather than the third turn. Order comes
from `sessionSegments[sessionId]`, which `getSessionSegments` already resolves and filters.
Any check written against `segments` as an array fails in a way that looks like a mocked
harness, which is the most expensive false alarm this checkpoint can raise.

**Do not assert on `debugInfo.tokenUsage`.** The first campaign tried, and the check failed
at turn 3 on a run that was demonstrably live. `debugInfo` is attached in
`src/lib/ai/narrativeGenerator.ts` under a condition the browser path does not meet, so
token counts are absent no matter how real the generation is. Four independent proofs of
live generation stood while that one criterion said otherwise. Cost per run is better read
from the provider console than from the store.

## 5. The campaign

Five scored runs plus an A/B pair. Vary one thing at a time so a bad score points somewhere.

| Run | World | Character | Persona | Turns |
|---|---|---|---|---|
| 1 | Camp Crystal Lake, cold start through both wizards | fresh | Cautious | 30 |
| 2 | Camp Crystal Lake | fresh | Reckless | 30 |
| 3 | Contrast world | fresh | Custom-text-heavy | 30 |
| 4 | Contrast world | established | Contrarian | to a real ending |
| 5 | Camp Crystal Lake | established | Cautious | 30 |
| A/B | Camp Crystal Lake, branched at turn 8 | fresh | opposite choices | 10 per arm |

**The five runs are what close the evaluation matrix, and the matrix is binding.**
`narraitor-ai-quality-discipline` is the single home of those minimums: two contrasting
worlds crossed with one fresh and one established character, three or more generations per
cell. Runs 1 through 5 cover all four cells at 30 generations each. Run 5 exists only to
close the Camp Crystal Lake and established cell, which the first campaign left open, so
that campaign's results are a story-quality read and cannot be cited as a matrix. The A/B
pair sits outside the matrix and answers a different question.

Cautious goes first. That playstyle produced #1680, where the story never escalated because
the player never forced it to. Run 5 repeats it on an established character so the only
thing that changed is the character's history.

Run 1 includes world creation and character creation through the real wizards. The first
three turns decide whether anyone keeps playing, and a returning player never walks that
path again, so it only gets tested here.

World specs live in `worlds/`. The contrast world exists to remove the crutch: Camp Crystal
Lake has something hunting you, so the narrative can borrow momentum. A world where nothing
is chasing the player has to manufacture it.

**Observe and file only.** Fixing mid-campaign means run 3 plays a different build than run
1 and the scores stop comparing. The one exception is a hard blocker, meaning a crash,
unrecoverable state, or a route returning 500. Fix that, record in the log that the build
changed between runs, and caveat every score across the boundary. Nothing touching prompts
or narrative logic gets fixed mid-campaign under any circumstances.

**Check in with the owner after every run** before picking the next persona and world.

## 6. Judging

Hand `rubric.md` to a fresh subagent and let it pull the transcript itself. The judge gets
no world spec, no character sheet, and no idea what the campaign expects to find. Scoring
generations you just watched being produced is the exact bias
`narraitor-ai-quality-discipline` exists to prevent.

**Let the judge fetch the transcript, do not carry it.** Stash the assembled turns on
`window.__tx` and tell the judge to read it in slices against the session's tab. The
transcript never passes through the orchestrator's context, which is worth roughly 8k
tokens a run and is the difference between a five-run campaign fitting in one session or
not.

Seven dimensions, scored 1 to 5, separately per ten-turn block so the trajectory shows.
The A/B pair goes to a different judge under the discrimination protocol at the bottom of
`rubric.md`.

Alongside the transcript, log what a transcript cannot show: per-turn wait time, whether the
prose wall got tiring, dead-end UI, and any moment the game state was unclear.

## 7. Findings

Two tracks, because filing "the story circles at turn 18" as a bug produces a ticket nobody
can close.

**Defects** score Critical, Major, or Minor and file as `bug`. Same tiers the v1.0
walkthrough used in #1417, so severity language stays consistent between rounds.

**Design gaps** score Blocks-fun, Erodes-over-time, or Papercut and file as `enhancement`
against epic #435, the surviving narrative-depth epic.

Everything gets a number in `playtest-log.md` at the repo root, which is gitignored and
accumulates across rounds. File one umbrella tracking issue holding every finding, then
batch-file Major and Blocks-fun as individual issues linked back to it. Round 2 of playtest
triage skipped the umbrella, and two round-1 fixes regressed with nobody noticing until
#1574 caught it months later.
