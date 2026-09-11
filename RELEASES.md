# Releases

Releases get tagged manually from `develop` and fast-forwarded to `main`. Each entry below covers what's in the tag, what's known to still be in flight, and what's lined up next. The full release process lives in [release-process.md](public_docs/development/release-process.md).

---

## v1.7.0 - 2026-09-10

v1.7 closes the loop the [#1818](https://github.com/jerseycheese/Narraitor/issues/1818) playtest campaign left open. A world cost now lands on the decision that caused it, so losing something reads as a consequence of what the player chose instead of a fee charged on the next turn. The milestone closes 4 issues across 6 commits since [v1.6.0](https://github.com/jerseycheese/Narraitor/releases/tag/v1.6.0), two of which are docs.

**What's in this release**

The world answers back:

- World costs are charged to the decisions that incur them. The cost extraction now sees the choice the player made and how it resolved, marks each cost that choice caused, and records the decision id on the segment, where later prompts and the journal can read it. In a live paired evaluation, risky choices had their cost attributed in 3 of 3 cases and safe choices drew no attributed cost in 3 of 3. It ships on by default, and `NEXT_PUBLIC_FEATURE_DECISION_ATTRIBUTED_WORLD_COSTS=false` is the kill switch ([#2020](https://github.com/jerseycheese/Narraitor/issues/2020)).
- Choices without alignment metadata get a real category. They used to default to `neutral` and stay there. The decision is still recorded as `neutral` straight away so the turn never waits, then a background call classifies the choice text as diplomatic, aggressive, stealthy, helpful, selfish or neutral and updates the record ([#666](https://github.com/jerseycheese/Narraitor/issues/666)).

Long sessions:

- Once the story passes seven segments, older ones collapse behind a "Show earlier story" control. A milestone toast marks every five story beats, and a dismissible prompt offers a natural stopping point every 15 minutes ([#805](https://github.com/jerseycheese/Narraitor/issues/805)).

Fixes and docs:

- The world and character creation tours no longer undo a manual Next or Back click. The step-sync effect from [#2037](https://github.com/jerseycheese/Narraitor/issues/2037) now moves the wizard only when the tour's own step changes ([#2069](https://github.com/jerseycheese/Narraitor/issues/2069)).
- README rewritten for a developer audience, with three current screenshots ([#2073](https://github.com/jerseycheese/Narraitor/pull/2073)).
- PRODUCT.md rewritten against the tree, and seven pre-DS3 screenshots deleted ([#2074](https://github.com/jerseycheese/Narraitor/pull/2074)).

**Known incomplete**

The evaluation behind [#2020](https://github.com/jerseycheese/Narraitor/issues/2020) is thin: three paired cases, 12 calls, single turns in two worlds. That cleared the ship rule its eval log committed to up front, but it isn't a read across a whole session. A 30-turn playtest with the flag on is what would catch attribution drifting as a session wears on, and that hasn't run yet.

**What's next**

No v1.8 milestone is set yet. The top of the backlog is [#487](https://github.com/jerseycheese/Narraitor/issues/487), the long-deferred call on adopting the Vercel AI SDK or keeping the hand-rolled provider layer, which is answerable now that three providers run through it. Behind it is [#2000](https://github.com/jerseycheese/Narraitor/issues/2000): four stores carry a comment saying a version bump clears old saved data, while the code preserves it.

---

## v1.6.0 - 2026-09-10

v1.5 catalogued what the new-player path gets wrong. v1.6 fixes it. The milestone closes 12 issues from the [#2022](https://github.com/jerseycheese/Narraitor/issues/2022) discovery sweep across 14 commits since [v1.5.0](https://github.com/jerseycheese/Narraitor/releases/tag/v1.5.0), and picks up a production bug that turned out to break every dynamic route in the app.

**What's in this release**

The production fix comes first, because it is the one players actually hit:

- Every dynamic `[id]` route rendered the client error boundary in production. World detail, world edit, world play, character detail and character edit all showed "Something Went Wrong" instead of the page. The cause was a module-scope `fs.readFileSync` of `public/` in `opengraph-image.tsx`: static routes prerender on the build worker where `public/` is on disk, but on-demand routes evaluate that module inside the serverless function, where it is not. The logo is now inlined as a data URI, so module evaluation never touches the filesystem ([#2062](https://github.com/jerseycheese/Narraitor/issues/2062)).

The new-player path, from the [#2022](https://github.com/jerseycheese/Narraitor/issues/2022) sweep:

- World creation no longer loses everything typed when the page reloads. Drafts auto-save and offer recovery on return ([#2034](https://github.com/jerseycheese/Narraitor/issues/2034)).
- The character creation tutorial shows all five of its steps rather than one. Wizard steps advance on Joyride's Next, and the tour now requires full completion before onboarding retires ([#2037](https://github.com/jerseycheese/Narraitor/issues/2037)).
- The tutorial spotlight highlights the field it describes instead of the section header above it ([#2040](https://github.com/jerseycheese/Narraitor/issues/2040)).
- Portrait failures show plain language with an actionable next step, not the raw server error string ([#2042](https://github.com/jerseycheese/Narraitor/issues/2042)).
- First load respects a dark-mode machine. An unchosen color scheme defaults to the system preference rather than pinning light ([#2045](https://github.com/jerseycheese/Narraitor/issues/2045)).
- The bring-your-own-key requirement is disclosed inside the world creation wizard, not only at the bottom of the landing page ([#2044](https://github.com/jerseycheese/Narraitor/issues/2044)).
- Dialog panels use an opaque surface token. They had been rendering 20% transparent with no backdrop blur ([#2039](https://github.com/jerseycheese/Narraitor/issues/2039)).
- The character recovery dialog's warning icon renders at its intended size instead of 438px ([#2038](https://github.com/jerseycheese/Narraitor/issues/2038)).
- `generated-world-data` was read but never written. The dead handoff is gone and CLAUDE.md no longer documents it ([#2043](https://github.com/jerseycheese/Narraitor/issues/2043)).

Security and CI:

- Cleared a critical unauthenticated Next.js RCE and a high-severity libheif issue in `sharp`. Both advisories had gone red on `develop` and on every open PR. Next.js moves within the 15.5 line and the existing `sharp` override rises to 0.35.4, so no major-version bump was needed ([#2066](https://github.com/jerseycheese/Narraitor/issues/2066)).
- The CI security scan gained an advisory full-dependency audit alongside the gating production one ([#2061](https://github.com/jerseycheese/Narraitor/pull/2061)).
- `seedTestData` no longer re-triggers the world-creation tour. Its runtime setState path seeded `worldCreation.lastStep: 6` while two other paths in the same file used `999`, so the tour relaunched after seeding and dragged the wizard back to step 0 mid-test ([#2067](https://github.com/jerseycheese/Narraitor/issues/2067)).
- The test config ignores `.claude/worktrees/` rather than a path where worktrees have never lived, which removes roughly forty duplicate-mock warnings from the head of every local run ([#2025](https://github.com/jerseycheese/Narraitor/issues/2025)).

**Known incomplete**

Three of the twelve milestone issues ([#2035](https://github.com/jerseycheese/Narraitor/issues/2035), [#2036](https://github.com/jerseycheese/Narraitor/issues/2036), [#2041](https://github.com/jerseycheese/Narraitor/issues/2041)) landed early and already shipped in v1.5. They count toward the milestone but are not new here.

One live regression came out of this release's own tutorial work. The world-creation tour reverts a manual "Next" click: the step-sync effect added in [#2037](https://github.com/jerseycheese/Narraitor/issues/2037) fires whenever the wizard diverges from the tour's step index, including when the player caused that divergence by moving ahead, and it can only pull the wizard back toward the tour. Filed as [#2069](https://github.com/jerseycheese/Narraitor/issues/2069) and carried into v1.7.

**What's next**

- Milestone v1.7, "the world answers back". The [#1818](https://github.com/jerseycheese/Narraitor/issues/1818) playtest campaign found the engine to be purely reactive, and most of that campaign has since shipped. What remains is the link between a decision and its consequence: charging world costs to the decisions that incur them ([#2020](https://github.com/jerseycheese/Narraitor/issues/2020)), giving choices without explicit alignment metadata a real category ([#666](https://github.com/jerseycheese/Narraitor/issues/666)), and adding session-level pacing for long sessions ([#805](https://github.com/jerseycheese/Narraitor/issues/805)), plus the [#2069](https://github.com/jerseycheese/Narraitor/issues/2069) carry-in.

---

## v1.5.0 - 2026-09-07

Where earlier releases built out capabilities and continuity guards on faith and live matrices, v1.5 makes the core game loop observable to automated tests and opens the UX backlog with an empirical discovery sweep over the new-player path. The v1.5 milestone closes 6 issues across 12 commits since [v1.4.0](https://github.com/jerseycheese/narraitor/releases/tag/v1.4.0), with no known-incomplete tail — unfinished work drops directly to v1.6.

**What's in this release**

- Route-tier automated tests for the core game loop. No automated test had ever executed `POST()` on the game-loop API routes (`narrative/generate`, `narrative/choices`, `narrative/ending`, `narrative/summarize`, `generate-world`, `generate-character`). They now have route-tier tests covering body validation, client dispatch, NDJSON streaming, and error mapping at the real boundary rather than assuming client mocks cover them ([#1995](https://github.com/jerseycheese/Narraitor/issues/1995)). The summarize tests immediately caught and fixed a live defect where shifted indices dumped the model's raw output into the journal.
- All non-loop API routes tested. The remaining untested API routes (`ai/analyze-world`, `inventory/check-similarity`, `narrative/validate-event-significance`, `generate-item-image`, `debug`, and `telemetry/error`) now have route tests, including strict payload validation and sanitization on `telemetry/error` ([#2027](https://github.com/jerseycheese/Narraitor/issues/2027)).
- Unreachable code pruned and rate limiter tested. The dead image-deletion path (`/api/delete-image` and `fileStorage.ts`) left over from pre-1.0 disk uploads was removed entirely, while the active rate limiter gained tests proving it fires at `maxRequests`, resets on expiry, and clears identifiers ([#1996](https://github.com/jerseycheese/Narraitor/issues/1996)).
- Test audit wired into CI. `scripts/audit-tests.mjs` now runs in CI on every PR to surface hollow or mock-only tests, and Jest rules for unasserted, disabled, or commented-out tests were elevated from warnings to errors ([#1997](https://github.com/jerseycheese/Narraitor/issues/1997)). Name-mismatched cases in `turnResolver` and `narrativeGenerator` now prove the asynchronous pipeline and skill gating they claim to observe.
- Visual regression CI accurately named. Renamed the CI check from "E2E Tests" to "Visual Regression", pruned dead references to nonexistent theme specs, and deleted dead global setup files ([#2004](https://github.com/jerseycheese/Narraitor/issues/2004)).
- Normalized world-cost conditions into stable state labels. Character conditions inflicted by world costs now normalize into stable state labels and keys (`normalizeCondition`), deduplicating escalating injury descriptions into coherent state records rather than accumulating repetitive prose strings ([#2019](https://github.com/jerseycheese/Narraitor/issues/2019)).
- Clean 412 status for keyless AI requests. Missing provider keys now return HTTP 412 Precondition Failed instead of 500, preventing false-positive client error telemetry reports when a player has not configured a key yet ([#2028](https://github.com/jerseycheese/Narraitor/issues/2028)).
- Explicit key descriptors reach Gemini client. `createDefaultGeminiClient` now allows explicit keyed descriptors to bypass the test runner's mock branch, making live-key integration test paths possible ([#2024](https://github.com/jerseycheese/Narraitor/issues/2024)).
- Opened the UX backlog. Ran a bounded discovery pass over the complete new-player path (landing, provider setup, world creation, character creation, and first session turns) with live Gemini, filing 12 concrete player-friction issues and seeding the v1.6 milestone ([#2022](https://github.com/jerseycheese/Narraitor/issues/2022)).
- First UX discovery fixes landed early:
  - Fixed accessible names for all 12 skill toggle buttons in character creation so screen readers announce the skill name instead of just "Not Selected" ([#2041](https://github.com/jerseycheese/Narraitor/issues/2041)).
  - Omitted large world images from portrait generation payloads to prevent HTTP 413 Payload Too Large errors ([#2036](https://github.com/jerseycheese/Narraitor/issues/2036)).
  - Fixed character creation "Recover Progress" dialog so saved drafts actually repopulate the wizard state when restored ([#2035](https://github.com/jerseycheese/Narraitor/issues/2035)).

**Known incomplete**

None. Per the milestone charter ("No known-incomplete tail - unfinished work drops to v1.6"), v1.5 has no lingering incomplete commitments in its scope. The open issues discovered during [#2022](https://github.com/jerseycheese/Narraitor/issues/2022) belong to the v1.6 player-experience milestone (milestone #7). A live-key contract tier for the game-loop routes ([#2023](https://github.com/jerseycheese/Narraitor/issues/2023)) and worktree mock warning cleanup ([#2025](https://github.com/jerseycheese/Narraitor/issues/2025)) remain tracked on the general backlog.

**What's next**

- Milestone v1.6: The player-experience milestone addressing the new-player journey friction cataloged in [#2022](https://github.com/jerseycheese/Narraitor/issues/2022) (landing page BYO-key clarity [#2044](https://github.com/jerseycheese/Narraitor/issues/2044), dark-mode detection [#2045](https://github.com/jerseycheese/Narraitor/issues/2045), character creation tutorial flow [#2037](https://github.com/jerseycheese/Narraitor/issues/2037), world creation drafts [#2034](https://github.com/jerseycheese/Narraitor/issues/2034), UI styling/dialog polish [#2038](https://github.com/jerseycheese/Narraitor/issues/2038), [#2039](https://github.com/jerseycheese/Narraitor/issues/2039), [#2040](https://github.com/jerseycheese/Narraitor/issues/2040), [#2042](https://github.com/jerseycheese/Narraitor/issues/2042)).
- Live-key contract test tier for on-demand validation of real provider streams ([#2023](https://github.com/jerseycheese/Narraitor/issues/2023)).

---

## v1.4.0 - 2026-09-05

The theme is the world cashing its checks. v1.3 taught the story to remember what it said; v1.4 makes those facts settle before the next choice and forces off-stage pressure to actually arrive. The v1.4 milestone closes 13 issues across 29 commits since [v1.3.0](https://github.com/jerseycheese/narraitor/releases/tag/v1.3.0), including the bounded TurnResolver work that was briefly split into v1.5 and folded back because it is the mechanism that completes this release.

**What's in this release**

- Turns settle before the next choice reads them. `TurnResolver` serializes generation per session, commits the segment, awaits inventory, condition, world-thread and fatal-outcome reconciliation, and returns one frozen snapshot. A partial reconciliation leaves the prose visible but blocks the next choice instead of presenting stale state as settled. Item use now goes through the same lock and consumes the selected item exactly once, while choice generation consumes the returned snapshot rather than rereading whichever store revision happens to be live ([#1983](https://github.com/jerseycheese/narraitor/issues/1983), [#1985](https://github.com/jerseycheese/narraitor/issues/1985), [#1986](https://github.com/jerseycheese/narraitor/issues/1986)).
- The world clock can finish what it starts. Fired threads count their own strikes and arm a conclusion after three instead of re-announcing themselves forever ([#1889](https://github.com/jerseycheese/narraitor/issues/1889)). An overdue deadline or exhausted fired thread now forces a real scene transition, and the next turn's context begins on the far side of that cut ([#1872](https://github.com/jerseycheese/narraitor/issues/1872)). The focused live matrix passed all declared gates in two worlds: 12 of 12 boundary turns moved forward or concluded the matter, 10 resolved it, and neither follow-up fell back into the old scene.
- Arrived threats can take something the game actually records. `WORLD_COST` is on by default after the matched TurnResolver matrix cleared the held threshold in both worlds: Harrowgate moved from 0 to 4 recorded cost turns per 30, and Crystal Lake from 1 to 10. The treatment sessions also wrote nine durable character conditions where the controls wrote none ([#1882](https://github.com/jerseycheese/narraitor/issues/1882)).
- Delivered commitments reach the choices that follow them. The next decision reads the settled commitment revision, and stale business is not re-offered as if delivery never happened ([#1963](https://github.com/jerseycheese/narraitor/issues/1963)).
- Endings read the session in the right order and account for the other threads it opened, not only the fatal one in front of them. That behavior was measured live before shipping ([#1974](https://github.com/jerseycheese/narraitor/issues/1974), [#1966](https://github.com/jerseycheese/narraitor/issues/1966), [#1975](https://github.com/jerseycheese/narraitor/issues/1975)).
- The engine is less willing to invent a private conversation. Natural first-name references now resolve to the right NPC, and a denial only suppresses an alleged exchange when it sits beside that claim, so one refusal elsewhere in the response cannot hide a different invented conversation ([#1857](https://github.com/jerseycheese/narraitor/issues/1857), [#1967](https://github.com/jerseycheese/narraitor/issues/1967)).
- A malformed dotted-key metadata dump no longer replaces the narrative passage on a consequential turn; the parser recovers the prose before the content gate sees it ([#1965](https://github.com/jerseycheese/narraitor/issues/1965)).
- Alongside the milestone, the shared AI route boundary now measures real request bytes, applies rate limiting once, clamps provider token overrides, keeps raw provider bodies out of logs, and enforces a bounded response. Storage fallback errors also reach the player instead of living only in a log, and coverage now includes untested files behind a threshold ratchet ([#1998](https://github.com/jerseycheese/narraitor/issues/1998), [#1999](https://github.com/jerseycheese/narraitor/issues/1999), [#1994](https://github.com/jerseycheese/narraitor/issues/1994)).

**Known incomplete**

World costs are durable now, but their state model is still rough. Conditions can arrive as accumulating prose fragments rather than one stable condition developing ([#2019](https://github.com/jerseycheese/Narraitor/issues/2019)), and the measured losses come from the world's side of the table rather than being causally linked to the decision that exposed the player to them ([#2020](https://github.com/jerseycheese/Narraitor/issues/2020)). The strongest treatment arm ran 30 turns, so whether the gain holds through a 45-turn session is still untested.

The green automated suite still does not execute the provider-backed narrative generation path. Route validation and error mapping for the core game loop remain a high-priority test gap ([#1995](https://github.com/jerseycheese/Narraitor/issues/1995), under [#2005](https://github.com/jerseycheese/Narraitor/issues/2005)). This release's AI claims come from the recorded live matrices, not from pretending the unit or Playwright layers cover Gemini.

The broader playtest campaign stays open ([#1818](https://github.com/jerseycheese/Narraitor/issues/1818)). v1.4 closes the specific settlement and world-movement failures it measured; it is not a blanket claim that every long story now holds engagement past turn ten. The milestone charter also named a UX slate, but no evidence-backed UX slate was filed or shipped, so this is an engine and reliability release.

One persistence question from the release audit remains unresolved: four store version bumps say they clear incompatible saved data while their migration functions preserve it ([#2000](https://github.com/jerseycheese/Narraitor/issues/2000)). No v1.4 store-shape migration depends on that behavior, but the next real persisted-shape change should settle it first.

**What's next**

- Close the test-confidence gap at the real game-loop routes, starting with narrative generation and choices ([#1995](https://github.com/jerseycheese/Narraitor/issues/1995), [#2005](https://github.com/jerseycheese/Narraitor/issues/2005)).
- Give world costs stable condition identities and a durable link back to the decisions that incurred them ([#2019](https://github.com/jerseycheese/Narraitor/issues/2019), [#2020](https://github.com/jerseycheese/Narraitor/issues/2020)).
- Run a fresh prioritization pass before naming another product milestone, including the UX discovery that v1.4's original charter named but never defined.

---

## v1.3.0 - 2026-08-26

The theme is the story staying true to itself. Every prior release added a capability; this one went looking for the specific ways a 20-30 turn session quietly stops matching what it already told the player, and closed what it found one measured fix at a time. The v1.3 milestone closed 9 issues across 77 commits since [v1.2.0](https://github.com/jerseycheese/narraitor/releases/tag/v1.2.0), all of it fed by the live-playtest campaign tracked in [#1818](https://github.com/jerseycheese/narraitor/issues/1818).

**What's in this release**

- The engine no longer confirms a conversation that never happened. Ask an NPC to repeat something they supposedly told you in private off-page, and the story denies the false premise instead of inventing content to match it ([#1857](https://github.com/jerseycheese/narraitor/issues/1857), guard measured live this release - see Known incomplete).
- Two continuity guardrails, both measured against live Gemini rather than shipped on faith. Contradicting an established fact mid-session dropped to 30 of 30 clean turns in one measured run and 11 of 12 in a second ([#1831](https://github.com/jerseycheese/narraitor/issues/1831)). Choices that cast the player as the counterparty to their own settled business - re-offering something already delivered - measured 4 hits to 0 across 105 options per arm ([#1830](https://github.com/jerseycheese/narraitor/issues/1830)).
- A guard against a specific invention: an NPC naming a fact about the player's own family (a grandparent's name, a detail off the character sheet that was never entered) and the story's memory writing it down as canon for the rest of the session ([#1926](https://github.com/jerseycheese/narraitor/issues/1926)), the fix that came out of a 13-round investigation into character-sheet facts never reaching the prose ([#1828](https://github.com/jerseycheese/narraitor/issues/1828)).
- A failed skill check costs something more often now, instead of quietly undoing the attempt. A 30-turn session that scored 13 of 18 failures as "nothing happened" - the world not moving for ten straight turns - was the original evidence; a fuller 54-turn measurement cut that to 4 of 11, still short of the milestone's bar (see Known incomplete) ([#1821](https://github.com/jerseycheese/narraitor/issues/1821)).
- Cautious play stops looping. A session could run nine turns of pure clue-following - find a trace, follow it, find the next one - with no setback and no NPC ever entering the scene ([#1680](https://github.com/jerseycheese/narraitor/issues/1680)).
- A typed custom action now renders as written. It used to get lowercased and forced behind a fixed "You choose to" prefix, breaking every custom turn's consequence card on sentences that didn't start that way ([#1832](https://github.com/jerseycheese/narraitor/issues/1832)).
- The world clock ships on by default: a ledger of open threads now feeds the scene prompt, so an off-screen actor can advance, a threat can close in, or a deadline can tick on a turn the player isn't touching that thread. What makes a thread open, overdue, or resolved was settled as a design spike first ([#1835](https://github.com/jerseycheese/narraitor/issues/1835)), then measured live and turned on ([#1822](https://github.com/jerseycheese/narraitor/issues/1822)).

**Known incomplete**

The failed-check cost fix ([#1821](https://github.com/jerseycheese/narraitor/issues/1821)) measured improved but not reliable: a fuller 54-turn run still saw 4 of 11 failure turns read as nothing happening, below the milestone's 80% bar. The residual shape is mostly a "listen and hear nothing" turn, plus a tag-carryover bug that reapplies the failure block to the turn right after a failure.

The unrecorded-exchange guard ([#1857](https://github.com/jerseycheese/narraitor/issues/1857)) held on both baits tried in this release's smoke test - a precise one naming an NPC's full name got a clean, in-character denial. But the smoke also found the detector only matches an NPC's complete stored name, so a player using just a first name (the phrasing anyone would actually type) can point the guard at the wrong character or miss the claim entirely ([#1967](https://github.com/jerseycheese/narraitor/issues/1967)).

The world clock's ledger and orchestration are live, but a thread coming due and resolving on its own is not: advancing a thread can degrade into re-announcing it instead of it arriving ([#1872](https://github.com/jerseycheese/narraitor/issues/1872)), and a fired thread's strike counter rides an extraction path that never arms its own exit ([#1889](https://github.com/jerseycheese/narraitor/issues/1889)).

World cost - making an arrived threat actually take something from the player - stays off. Round 13 measured 2 of 30 turns crossing the trigger threshold of 3, so it's still not pulling its weight live ([#1882](https://github.com/jerseycheese/narraitor/issues/1882)).

Not everything measured came back a win, and this release says so rather than burying it. The fix for skewed alignment scoring (lawful/neutral/chaotic landing on 29 of 30 turns) measured *worse* than the baseline it was meant to improve on - 83.3% dominant-outcome ordering against a 70.0% baseline - and got closed not-planned rather than shipped on a technicality ([#1829](https://github.com/jerseycheese/narraitor/issues/1829)). Prompt-side reordering is a dead lever for that specific problem.

Two smaller gaps came out of this release's own smoke test, filed rather than fixed mid-check: a raw-metadata parsing defect that put technical text where narrative prose should be, on the single most consequential turn of a session ([#1965](https://github.com/jerseycheese/narraitor/issues/1965)), and endings that resolve the thread they're pointed at while staying silent on other threads the same session built, sometimes filling the gap with invented lore ([#1966](https://github.com/jerseycheese/narraitor/issues/1966)).

Delivered commitments (a promise an NPC makes and later keeps) are tracked and guarded in the prose, but the guard never reaches the choices a player is offered - a stale promise can still get re-offered as an option even though the narration itself won't repeat it ([#1963](https://github.com/jerseycheese/narraitor/issues/1963)).

**What's next**

- The two residual gaps from this release's evidence: the commitments-in-choices gap ([#1963](https://github.com/jerseycheese/narraitor/issues/1963)) and the guard name-matching gap ([#1967](https://github.com/jerseycheese/narraitor/issues/1967)).
- The world clock ships live; making threads actually come due rather than re-announce themselves is next ([#1872](https://github.com/jerseycheese/narraitor/issues/1872), [#1889](https://github.com/jerseycheese/narraitor/issues/1889)).
- The unrecorded-exchange guard shipped and is now measured; whether it holds under a real evaluation matrix rather than one release smoke is still open ([#1857](https://github.com/jerseycheese/narraitor/issues/1857) stays tracked).
- The UX side of the backlog has almost nothing filed against it - 62 open issues and effectively none of them about the experience rather than the engine. That needs its own pass before it can become schedulable work.

---

## v1.2.0 - 2026-08-16

Every version up to now ran on one provider, so Google alone set the product's quality ceiling. That already bit twice, once when Gemini 2.5 Pro left the free tier and again when `gemini-2.5-flash-image` got a shutdown date. Four providers work now, one of them a model you host yourself, and turn-level analytics finally say whether anyone plays past the first turn. The v1.2 milestone closed 13 issues across 45 commits since [v1.1.0](https://github.com/jerseycheese/narraitor/releases/tag/v1.1.0).

**What's in this release**

- Multi-provider AI, the MVP slice of epic [#878](https://github.com/jerseycheese/narraitor/issues/878). A provider abstraction that splits the old request module into a generic core and per-provider adapters ([#890](https://github.com/jerseycheese/narraitor/issues/890)), a generic OpenAI-compatible provider with presets ([#895](https://github.com/jerseycheese/narraitor/issues/895)), and Ollama for anyone who would rather not pay for a key at all ([#896](https://github.com/jerseycheese/narraitor/issues/896)). Gemini, OpenAI and OpenRouter are each verified against a live key; Ollama is verified against a real self-hosted server.
- Two provider bugs that only a second provider could expose. Picking a model in the config screen did nothing, since every turn ran on `gemini-2.5-flash` regardless ([#1745](https://github.com/jerseycheese/narraitor/issues/1745)), and context budgeting counted Gemini tokens, which is the wrong number for anyone else ([#1746](https://github.com/jerseycheese/narraitor/issues/1746)). A spike settled whether Gemini could run through its own compatibility endpoint ([#1749](https://github.com/jerseycheese/narraitor/issues/1749)).
- The image model on a clock. `gemini-2.5-flash-image` shuts down on 2026-10-02, and it sat under every image route ([#1776](https://github.com/jerseycheese/narraitor/issues/1776)).
- Turn-level analytics, so play depth is measurable rather than inferred from page entry ([#1747](https://github.com/jerseycheese/narraitor/issues/1747)). Still cookieless, still no personal data.
- The DS3 bug tail from v1.1: four undefined CSS custom properties that were silently dropping their declarations ([#1731](https://github.com/jerseycheese/narraitor/issues/1731)), two labels on accent bands failing WCAG AA ([#1732](https://github.com/jerseycheese/narraitor/issues/1732)), and plain links taking the browser's default focus ring ([#1735](https://github.com/jerseycheese/narraitor/issues/1735)).
- Copy that had quietly stopped being true. The landing page and FAQ still said a Gemini key was required ([#1814](https://github.com/jerseycheese/narraitor/issues/1814)), and nothing said that prompts reach the provider by way of our own server ([#1815](https://github.com/jerseycheese/narraitor/issues/1815)). A mock was also answering real image requests on a non-Gemini provider, which nothing rendered and so nobody noticed ([#1812](https://github.com/jerseycheese/narraitor/issues/1812)).
- Alongside the milestone: the play surface stopped jumping every turn and stopped clipping on a 375px phone ([#1750](https://github.com/jerseycheese/narraitor/issues/1750), [#1751](https://github.com/jerseycheese/narraitor/issues/1751)), the five image routes consolidated onto one fallback helper ([#1753](https://github.com/jerseycheese/narraitor/issues/1753)), devtools moved onto the real API wrappers instead of raw fetch ([#1755](https://github.com/jerseycheese/narraitor/issues/1755)), and two visual baselines that had baked in a failed thumbnail load got fixed ([#1742](https://github.com/jerseycheese/narraitor/issues/1742), [#1775](https://github.com/jerseycheese/narraitor/issues/1775)).

**Known incomplete**

Five presets ship disabled. Deepseek, Mistral, Together, Groq and Perplexity are listed but not selectable, because `available: true` here means somebody ran a real streamed turn through it ([#1800](https://github.com/jerseycheese/narraitor/issues/1800)).

Images stay Gemini-only, so world and ending images don't generate on another provider. What's new is that the UI says why instead of showing an empty frame ([#897](https://github.com/jerseycheese/narraitor/issues/897), [#898](https://github.com/jerseycheese/narraitor/issues/898)).

Ollama needs a public address. The version people asked for, a model on your own laptop with no tunnel, isn't buildable the way a turn routes: it goes through a Narraitor route on Vercel, which can't reach `localhost` on someone's machine. That needs a second generation path in the browser ([#1811](https://github.com/jerseycheese/narraitor/issues/1811)). A Claude native SDK ([#894](https://github.com/jerseycheese/narraitor/issues/894)) stays parked while the generic path already covers it.

**What's next**

- Verify the remaining five presets ([#1800](https://github.com/jerseycheese/narraitor/issues/1800)), which is the last unticked item in the multi-provider MVP.
- Decide the accounts-and-server-persistence question rather than drifting into it ([#1744](https://github.com/jerseycheese/narraitor/issues/1744)). Everything is browser-local today, and that's a choice worth making on purpose.
- Commercialization ([#495](https://github.com/jerseycheese/narraitor/issues/495)) stays parked until the free game is solid.

---

## v1.1.0 - 2026-08-10

Where v1.0 got the loop working end to end, v1.1 is the pass that makes it look and feel like it's supposed to. The bolder DS3 redesign — real accent, a louder dot grid, drafting marks, a named type scale, a brand/product surface split — lands in full, plus the two accessibility gaps and the error-reporting gap named as known-incomplete in the v1.0 notes. The v1.1 milestone closed 16 issues; this tag also carries a batch of unmilestoned play-loop and UI work that shipped alongside it.

**What's in this release**

- Bolder DS3, all the way through — epic [#1543](https://github.com/jerseycheese/narraitor/issues/1543). A deeper ink-blue accent and a louder dot grid ([#1621](https://github.com/jerseycheese/narraitor/issues/1621)), a five-mark drafting-marks family at one weight ([#1617](https://github.com/jerseycheese/narraitor/issues/1617)), a real named type scale with the highest-traffic sizes migrated onto it ([#1622](https://github.com/jerseycheese/narraitor/issues/1622)), a brand-vs-product surface split so marketing pages read differently from the app ([#1623](https://github.com/jerseycheese/narraitor/issues/1623)), room for generated art in list-view cards ([#1625](https://github.com/jerseycheese/narraitor/issues/1625)), and a real page grid with defined widths, columns, and gutters ([#1677](https://github.com/jerseycheese/narraitor/issues/1677)). DESIGN.md got rewritten with the real values instead of DS1's leftover numbers ([#1626](https://github.com/jerseycheese/narraitor/issues/1626)).
- Two accessibility gaps named in the v1.0 notes are closed: full keyboard control with visible focus indicators ([#276](https://github.com/jerseycheese/narraitor/issues/276)), and touch targets floored at 44px app-wide, including small buttons that were only tall enough, not wide enough ([#1477](https://github.com/jerseycheese/narraitor/issues/1477)). `prefers-reduced-motion` is now honored across the app ([#1678](https://github.com/jerseycheese/narraitor/issues/1678)).
- Client-side error reporting exists now — production failures are visible instead of silent ([#1641](https://github.com/jerseycheese/narraitor/issues/1641)), the third gap named in the v1.0 notes.
- The critical bug from the milestone: cautious play could loop on clue-following indefinitely instead of escalating ([#1680](https://github.com/jerseycheese/narraitor/issues/1680)).
- Two story-loop improvements: narrative segment length now actually scales with decision weight instead of being wired to a dead 3-5 sentence template ([#1585](https://github.com/jerseycheese/narraitor/issues/1585)), and prose that reused the same phrases turn after turn now gets flagged and varied ([#1681](https://github.com/jerseycheese/narraitor/issues/1681)).
- Alongside the milestone: narrative prose streams in progressively instead of popping in after generation, portrait creation got preset avatars and image upload, journal entries got a table view, and skill inference now reads what a choice says rather than where it sits in the list.

**Known incomplete**

Multi-provider AI support ([#878](https://github.com/jerseycheese/narraitor/issues/878)) stays out — Gemini via BYO-key is still the only path. Platform and dependency upgrades ([#1368](https://github.com/jerseycheese/narraitor/issues/1368)) and visual-regression/test infrastructure work ([#1369](https://github.com/jerseycheese/narraitor/issues/1369)) don't need a release gate and stay on their own tracks. General polish batches ([#1475](https://github.com/jerseycheese/narraitor/issues/1475), [#1494](https://github.com/jerseycheese/narraitor/issues/1494)) and monetization ([#495](https://github.com/jerseycheese/narraitor/issues/495)) are deliberately out of scope for this tag.

**What's next**

- The free-to-play core keeps getting harder to argue with before anything commercial gets scoped: platform upgrades ([#1368](https://github.com/jerseycheese/narraitor/issues/1368)) and whatever the next visual-identity or play-loop pass turns up. Commercialization ([#495](https://github.com/jerseycheese/narraitor/issues/495)) stays parked until the free game is solid.

---

## v1.0.0 - 2026-08-04

This is 1.0, and what makes it 1.0 is that the whole loop holds together now: describe a world, create a character who fits it, play a story that responds to what you choose, and reach an ending that reads like an ending. Narraitor started from wanting tabletop RPG sessions without coordinating four schedules, and this is the first tag where a stranger can open the app and get that without a walkthrough. The v1.0 milestone closed 60 issues across 554 commits since [v0.5.0](https://github.com/jerseycheese/narraitor/releases/tag/v0.5.0-design-system), most of them about making pieces that already existed work together in someone else's browser.

**What's in this release**

- Bring your own key. Generation runs on a Google Gemini key entered once under Settings, then Providers. It's encrypted in the browser and sent per request, so there's no server-held key, no account, and no sign-up ([#891](https://github.com/jerseycheese/narraitor/issues/891), [#892](https://github.com/jerseycheese/narraitor/issues/892), [#893](https://github.com/jerseycheese/narraitor/issues/893)).
- A public front door: a landing page ([#1365](https://github.com/jerseycheese/narraitor/issues/1365)), an About page with copy that says what this actually is rather than describing a generic storyteller chatbot ([#1421](https://github.com/jerseycheese/narraitor/issues/1421)), a privacy note and terms ([#1366](https://github.com/jerseycheese/narraitor/issues/1366)), cookieless funnel analytics ([#1367](https://github.com/jerseycheese/narraitor/issues/1367)), and share metadata so a pasted link previews properly ([#1636](https://github.com/jerseycheese/narraitor/issues/1636)).
- One design system. DS1, DS2, and DS3 collapsed down to DS3 alone under [ADR-013](https://github.com/jerseycheese/narraitor/pull/1526), which supersedes ADR-011. Light and dark is the only switch left. The legacy shadcn token layer went with it ([#1527](https://github.com/jerseycheese/narraitor/pull/1527)), theme selectors got flattened ([#1546](https://github.com/jerseycheese/narraitor/issues/1546)), and the app shell collapsed to a single chrome ([#1655](https://github.com/jerseycheese/narraitor/issues/1655)).
- Storybook is the single canon surface ([#1488](https://github.com/jerseycheese/narraitor/issues/1488), [ADR-012](https://github.com/jerseycheese/narraitor/issues/1484)). The old `/dev/design-system` living style guide is retired, and the stories run backend-free on MSW plus store decorators.
- The play loop got the attention it needed: inventory with generated item images, lore dedup that catches role aliases, decisions weighted Minor / Major / Critical with alignment and trust tracking, story summaries that stop retrying forever ([#1575](https://github.com/jerseycheese/narraitor/issues/1575)), epilogues that close a story instead of teasing another one ([#1578](https://github.com/jerseycheese/narraitor/issues/1578), [#1605](https://github.com/jerseycheese/narraitor/pull/1605)), lethality rebalanced so one bad roll doesn't end a run ([#1426](https://github.com/jerseycheese/narraitor/issues/1426)), and generation failures that surface instead of hanging the session ([#1429](https://github.com/jerseycheese/narraitor/issues/1429), [#1478](https://github.com/jerseycheese/narraitor/issues/1478)).
- Less surface to maintain. The world and character template systems came out entirely ([#1454](https://github.com/jerseycheese/narraitor/issues/1454), [#1455](https://github.com/jerseycheese/narraitor/issues/1455)), archetype generation went with them, and knip, skott, and a CSS audit now run in CI so dead code doesn't pile up quietly.
- Two QA passes fed the punch lists in [#1423](https://github.com/jerseycheese/narraitor/issues/1423)-[#1438](https://github.com/jerseycheese/narraitor/issues/1438) and [#1574](https://github.com/jerseycheese/narraitor/issues/1574)-[#1590](https://github.com/jerseycheese/narraitor/issues/1590), every one of which closed before this tag.

The last four issues ahead of the tag were about docs rather than code: a README rewrite that had been advertising a template system which no longer exists ([#1637](https://github.com/jerseycheese/narraitor/issues/1637)), a correctness sweep across `public_docs` ([#1638](https://github.com/jerseycheese/narraitor/issues/1638)), an archive pass over stale branches and dead config ([#1639](https://github.com/jerseycheese/narraitor/issues/1639)), and the share metadata above. The release tracking issues are [#1320](https://github.com/jerseycheese/narraitor/issues/1320) and [#1417](https://github.com/jerseycheese/narraitor/issues/1417).

**Known incomplete**

The bolder DS3 redesign is deferred to v1.1. What ships here is DS3 as it landed during the collapse, which is coherent but deliberately restrained. Epic [#1543](https://github.com/jerseycheese/narraitor/issues/1543) and its children cover the real accent treatment, the dot grid, a proper type scale, drafting marks, and the brand-versus-product surface split. DESIGN.md still carries type-scale numbers from the old DS1, which [#1626](https://github.com/jerseycheese/narraitor/issues/1626) fixes once that work lands.

Two accessibility gaps are worth naming up front. Full keyboard control with visible focus indicators is [#276](https://github.com/jerseycheese/narraitor/issues/276), and touch targets under the 44px WCAG 2.5.5 threshold are [#1477](https://github.com/jerseycheese/narraitor/issues/1477). Both are open, both are real, and both are deferred to v1.1.

There's no client-side error reporting, so a production failure in someone else's browser is invisible from here ([#1641](https://github.com/jerseycheese/narraitor/issues/1641)). Vercel Analytics is wired up for the launch funnel only and doesn't capture errors. That was a deliberate call for 1.0, not an oversight.

**What's next**

- `v1.1` - the bolder DS3 work from [#1543](https://github.com/jerseycheese/narraitor/issues/1543), plus the two deferred accessibility items ([#276](https://github.com/jerseycheese/narraitor/issues/276), [#1477](https://github.com/jerseycheese/narraitor/issues/1477)) and error reporting ([#1641](https://github.com/jerseycheese/narraitor/issues/1641)).

---

## v0.5.0-design-system — 2026-05-11

This is where the multi-theme design system migration goes public. Phases 0-2 of the Mechanical Manuscript redesign are in — the umbrella epic is [#1020](https://github.com/jerseycheese/narraitor/issues/1020), which closed yesterday once the last gate items merged. Token-level theming ships here; the structural differentiation piece between themes is what v0.6.0 picks up.

**What's in this release**

- Three switchable design systems — DS1 (sharp/archival), DS2 (warm/literary), DS3 (mechanical/manuscript) — each with light and dark mode. Theme choice persists across sessions.
- Full token migration: hardcoded colors, spacing, typography, and shadows in TSX/CSS replaced with design tokens. Tailwind dependency removed entirely ([#1086](https://github.com/jerseycheese/narraitor/pull/1097)).
- Per-theme token files (`src/lib/theme/themes/ds{1,2,3}.css`) plus `ThemeProvider`, `useTheme()` hook, and a wired-up Storybook theme switcher.
- Game session redesign: manuscript overlay styling, per-theme game-session layout, narrative streaming stability (CLS < 0.10 sign-off), marginalia term definition system, progressive disclosure behind feature flags.
- Non-game-session surfaces brought into the system: home, worlds list, world detail/edit, characters list, character detail/edit, journal, settings, dev tooling.
- Cross-theme audit pass and follow-on cleanup — wizard layouts, form wrappers, collapsible toggles, journal panes, classless buttons all resolved across DS1/DS2/DS3.
- [DESIGN.md](DESIGN.md) at the repo root as the canonical AI-readable summary of the system. Canon order pinned: showcase pages > Storybook > app code.
- [ADR-011](public_docs/architecture/ADR-011-three-design-systems.md) documenting the three-design-systems decision and the structural-differentiation roadmap.
- Release model itself ([#1170](https://github.com/jerseycheese/narraitor/pull/1210)): `main` is release-only, `develop` is rolling, branch protection rebuilt accordingly.

The headline integration PR is [#1081](https://github.com/jerseycheese/narraitor/pull/1081). The last two gate items — GuidedFirstTimeExperience wizard styling ([#1199](https://github.com/jerseycheese/narraitor/issues/1199)) and worlds journal DS treatment ([#1159](https://github.com/jerseycheese/narraitor/issues/1159)) — closed together via [#1200](https://github.com/jerseycheese/narraitor/pull/1200), which is what cleared the way for this release.

**Known incomplete**

DS1, DS2, and DS3 currently differ at the token layer — color, font, shadow — but share the same component layouts. The structural differentiation pass (distinct spacing scales, shape vocabularies, density per theme) is tracked in epic [#1165](https://github.com/jerseycheese/narraitor/issues/1165) with children [#1163](https://github.com/jerseycheese/narraitor/issues/1163), [#1166](https://github.com/jerseycheese/narraitor/issues/1166), [#1167](https://github.com/jerseycheese/narraitor/issues/1167), [#1168](https://github.com/jerseycheese/narraitor/issues/1168), [#1169](https://github.com/jerseycheese/narraitor/issues/1169), and lands in v0.6.0. That's the work that turns the three themes from a palette swap into three genuinely distinct points of view.

A handful of low-priority polish items are still open and don't block the release — world card placeholder images going white in dark mode ([#1113](https://github.com/jerseycheese/narraitor/issues/1113)), range sliders and checkboxes missing aria-labels ([#1118](https://github.com/jerseycheese/narraitor/issues/1118)), and a cosmetic field-concatenation bug on review/journal screens ([#1205](https://github.com/jerseycheese/narraitor/issues/1205)). AI-inferred skill checks ([#918](https://github.com/jerseycheese/narraitor/issues/918), with [#1207](https://github.com/jerseycheese/narraitor/issues/1207) as related context) is still on the queue, separate from this slice of work.

**What's next**

- `v0.6.0-theme-differentiation` — the structural differentiation work from [#1165](https://github.com/jerseycheese/narraitor/issues/1165) and its children, picking up where this release leaves off.

---

## v0.4.0-pre-design-system — 2026-05-10

This is the baseline tag, cut right before the multi-theme design system migration lands publicly. The idea is to give anyone who's pinned to a SHA today a stable point they can keep using while the design work plays out on `develop`.

**What's in this release**

- World creation wizard with AI-assisted attributes and skills
- Character creation, journal, and the AI-driven narrative engine (Gemini-backed, all calls routed server-side)
- IndexedDB persistence so sessions survive a refresh
- Three template worlds out of the box: Western, Sitcom, Adventure
- Secure API key handling and per-IP rate limiting (#478)

**Known incomplete**

The design system migration is mid-flight on `develop`. Phases 0–2 already merged via #1081, the structural differentiation piece is tracked in #1165, and #1020 is the umbrella epic that ties the whole thing together. A few smaller items are also still open — AI-inferred skill checks (#918, with #1207 as related context) and a stale `narraitor-character-store` localStorage cleanup that hasn't gotten its own issue yet.

**What's next**

- `v0.5.0-design-system` — cuts as soon as the #1020 epic closes out, brings the multi-theme tokens public
- `v0.6.0-theme-differentiation` — structural differentiation work from #1165 follows that
