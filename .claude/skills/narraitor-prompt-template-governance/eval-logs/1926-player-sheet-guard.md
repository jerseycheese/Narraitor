# Prompt/template eval log - the player sheet guard on the lore extractor (#1926, re-entry item 1 of #1828)

- Change: one variable - the lore extractor is told the player's character sheet (history, personality) and that the player's family and past are the sheet's to state, and a deterministic guard drops what gets recorded about them anyway: a character entry tied to the player by kinship whose name nothing in the game vouches for (sheet, world description, NPC roster), and any event tied to the player by kinship. The same predicate excludes such assertions from the continuity contract. Prompt text lives in `structuredLoreExtractor.ts` (the extraction prompt is not a registry template and reads no `NarrativeTemplateContext`); the pure logic in `src/lib/lore/playerSheetGuard.ts`.
- Diff: `src/lib/lore/playerSheetGuard.ts` (new), `src/lib/ai/structuredLoreExtractor.ts`, `src/lib/ai/narrativeGenerator.ts` (both call sites pass the sheet), `src/lib/lore/continuityLedger.ts`, `src/lib/lore/continuityGuardrail.ts` and `src/lib/utils/textNormalization.ts` (`escapeRegExp` moved to utils), tests alongside. Branch `claude/narraitor-1828-canon-engagement-41bbad` off develop `d7f3f3fa`.
- Date / evaluator: 2026-08-23, autonomous build session, live Gemini key from `.env.local`.

## Declared before the measurement (2026-08-23)

### Why this shape

Round 13 of #1828 (`1828-raised-background-answered.md`) held because the prose, once it engages the player's sheet, invents the specifics the sheet leaves blank (grandparents named Arthur and Eleanor, or Clara and Thomas; a mother named Sarah) on 7 of 9 treatment raises, and the names then recur for the rest of the session. The memo's first re-entry condition is an app-side guard so an invented name is a slip in one passage instead of ledger canon. The two exclusions that exist do not reach this class: `reservePlayerCharacterName` drops only entries carrying the player's own name, and `buildAssertions` matches the player's full name only, so "Wren's grandparents, Clara and Thomas" passes both.

The predicate is a kinship tie to the player ("Wren's grandmother", "the protagonist's mother", "your aunt", "grandfather of Wren"), not a mention of the player. #1860 measured a subject-match event filter against the round-4 ledger and rejected it (16 true facts lost for 2 poisoned). The kinship tie, run over those 78 facts plus the two #1831 step-2 ledgers (163 facts in all), matches exactly one, and that one restates the sheet ("Wren Calloway's grandmother and grandfather worked the looms until 2014"); the on-screen relative in those sessions, Aunt Carol, is always written by name. So a kin-tied event is either redundant with the sheet or the invention, and goes either way; a kin-tied character entry stays only when the game already vouches for the name, which is how an on-screen relative the NPC roster already holds keeps her entry.

What the predicate cannot see, stated up front: an event in the player's past with no kinship word ("Arthur and I were at that meeting", "you were the only one who raised a hand"). The prompt rule is the only reach at that class, and it is unverified until measured; if it measures as nothing, it comes out and the deterministic half ships alone.

### Gates

- G1 (input contract): the extraction prompt is not a registry template. The new option is `ExtractStructuredLoreOptions.playerSheet`, built at both call sites in `narrativeGenerator.ts` from data they already hold (character background, world description, NPC roster).
- G2 (leakage): the sheet's history and personality already reach the scene prompt every turn (`formatPlayerBackground`); showing the same two fields to the extractor leaks nothing new. The canon string (whole sheet, world text, roster names) never reaches the model; it is the guard's input only.
- G3 (parser safety): outbound prompt text plus a post-parse filter. The JSON schema is unchanged.
- G6 (cost): measured below as the extraction-prompt delta in characters; the extraction call is off the player's critical path.
- G7 (integration): the replay runs the real `extractStructuredLore` (the production code path minus the store write), not a harness re-implementation.

### Matrix

An offline replay, not a live play loop: every segment of round 13 (120 passages across the eight captures, 72 generated on the control build and 48 on the treatment build, with H4's first twelve base-build turns inside its capture) is run through the real extractor twice on live Gemini:

- Arm A ("today"): `{playerCharacterName}`, what develop does.
- Arm B ("change"): `{playerCharacterName, playerSheet}`, the prompt rule plus the guard.
- guardOnly: the pure guard applied to arm A's output, so the deterministic half is read on today's extractions without the prompt rule.

The roster per turn is the capture's `newCharacters` accumulated to that turn. Existing-lore context and continuity topics are not passed: the predicate does not read them, and the dedup they drive belongs to the store, downstream of the guard.

Why a replay: the guard is a function of the prose, and round 13's prose is the population that produced the invention. Nine live sessions would reproduce that prose only by chance. The live re-run is step 4 of the memo (same nine-session design), where the persistence claim gets its before/after.

Premise check, recorded as a finding and not a gate: the port-3092 origin of round 13 still holds its IndexedDB, so the lore store the live sessions wrote is read for the invented names before the replay. If the live ledger never recorded them, round 13's persistence was prose-window chaining, and this guard's value is prevention rather than the cure the memo assumed.

### Judging

- Precision (deterministic half): every entry guardOnly drops from arm A is read against the sheet by the evaluator; it is a checkable comparison, not a taste call. Correct: the entry asserts a relative of the player, or an event in the player's past, that the sheet does not state, or it restates the sheet. Incorrect: a world fact, or an on-screen fact about a person the roster holds.
- Recall (what still lands): a blind subagent reads every kept entry of arm B from one file, with each session's sheet and world description and nothing else, and flags entries that assert a relative of the player by name, or an event in the player's past, that the sheet does not state. The same read over arm A gives the before count. Flags are verified by the evaluator against the prose.
- Prompt-rule effect: arm B's pre-guard output (its kept entries plus the guard's captured drops) against arm A's raw flagged count.

### Decision rule

- SHIP when all hold: incorrect drops at most 1 across the 120 segments; flagged entries in arm B at most 2 across the 120 segments, and 0 on the seven round-13 treatment raise turns judged as invented history (H1t T8 and T12, H2t T4, T8 and T12, H4 T16 and T20); arm B's empty-extraction rate at or below arm A's (no parse or event-limit regression).
- The prompt rule is kept only if arm B's pre-guard flagged count is below arm A's raw flagged count by at least 3; otherwise it is removed before the PR and the verdict is re-read on guardOnly.
- HOLD otherwise, naming the gate.

## Measured (2026-08-23)

Verdict by the rule above: HOLD, on the recall gate. Precision, shape, and cost pass. The prompt rule stays. The five entries that survive in arm B are the two classes the declaration named as out of the predicate's reach, and an evaluator read past the judge's rules found the invented names coming back in kin-free entries the predicate was never pointed at. Details below; the PR goes up as a draft.

### Run

120 segments, two live calls each on `gemini-2.5-flash`, 9.8 minutes wall clock, median 4.7 s per segment. Arm B's inline guard ran with the capture's cumulative roster; a second pass (`reguard.ts`) re-applied the pure guard to both arms with the roster the app actually has at extraction time, the NPCs introduced before the turn (`context.npcRoster` is built before generation and `syncNpcMetadata` runs after the extraction is kicked off). That strict pass dropped nothing further from arm B, so the inline numbers hold for the app. Every file is under `~/.claude/projects/-Users-jackhaas-Projects-personal-narraitor/artifacts/1926-replay/` (input, both outputs, judge items, unblinding map, flags, prompts, scripts, log). The round-13 lore store dump from the premise check is beside it as `1828-round13-live-lore-store.json`.

### Shape and cost

| arm | entries | characters | events | locations | rules | empty | over the 3-event cap |
|---|---|---|---|---|---|---|---|
| A (today) | 651 | 210 | 273 | 166 | 2 | 0 | 0 |
| B (change, after guard) | 592 | 179 | 257 | 154 | 2 | 0 | 0 |

Prompt delta from the sheet rule: 700 characters on Harrowgate, 645 on Crystal Lake. No parse failures in either arm.

### Precision: the deterministic half on today's extractions

The guard dropped 32 entries from arm A (6 from the 60 control-build segments, 26 from the 60 treatment-build segments, which is the round-13 split). Each one read against the sheet:

| class | count | example |
|---|---|---|
| named relative the sheet does not have | 22 | "Eleanor Calloway, the protagonist's grandmother, a former loom worker"; "Sarah Calloway, Wren Calloway's mother" |
| unnamed relative with a detail the sheet does not give | 4 | "grandparents operated the looms until their last days"; "believed a mill was a living thing" |
| restates the sheet | 2 | "Wren Calloway's mother was sick, which led to Wren's return" |
| restates the sheet inside a present-story act | 3 | "The Mayor stated that Wren Calloway's family's connection will be noted in the minutes" |
| on-screen relative on the turn that introduced him | 1 | Uncle Frank, h3 T1 |

Incorrect drops under the declared definition: 0 (no world fact, no on-screen fact about a roster-held person). Gate passes. Two costs disclosed anyway. The three present-act wrappers lose the act (the Mayor put the connection on the record) along with the sheet restatement they carry. And roster timing means an on-screen relative's first entry goes: Uncle Frank at h3 T1 is in the NPC roster from T2 and his entries are kept from there (22 of 24 turns record him, in both arms). The same timing takes Eleanor Miller and Arthur Miller whole at h4 T18, because their introduction entries carry "Wren's grandmother, Clara"; the NPC store still gets them from the segment's `newCharacters`, and T19 onward records them.

### Recall: the blind judge

One subagent, the items file and the rule set only, 1256 notes under opaque ids (651 arm A raw, 592 arm B kept, 13 arm B guard-dropped, shuffled with seed 1926, unblinding map in a separate file). It returned 53 flags. Every one holds as written when read against the prose. Ten of them are Uncle Frank, the on-screen relative the narrator itself put in the h3 scene at T1; the design keeps a roster-held relative on purpose, so he is counted apart.

| | arm A raw | guard alone (arm A after the guard) | arm B before its guard | arm B kept |
|---|---|---|---|---|
| flags of the memo's kind | 28 | 4 | 15 | 5 |
| Uncle Frank | 9 | 8 | 1 | 1 |

The five that survive in arm B:

| segment | form | note |
|---|---|---|
| h1 treatment T3 | pronoun | "referencing their grandmother Eleanor's similar qualities" |
| h2 treatment T3 | pronoun | "their grandfather understood some things couldn't be measured on a balance sheet" |
| h2 treatment T8 | kin-free past event | "appointed by a group of eleven people, including herself" |
| h4 treatment T20 | kin-free past event | Arthur "was at the council meeting where Wren Calloway was appointed, alongside Eleanor" |
| h4 treatment T20 | kin-free past event | "Eleanor states that Arthur and she were present at the council meeting" |

On the seven raise turns: 3 (h2t T8 one, h4t T20 two). The gate asked for at most 2 across the run and 0 on the seven. Fails on both.

### The prompt rule

Arm B's pre-guard flagged count is 15 against arm A's 28, a difference of 13, so by the rule it stays. Where the difference sits matters, though: it is almost entirely in the named-relative class the guard catches anyway. On the two classes the predicate cannot see, the guard alone leaves 4 and the prompt rule leaves 5, which is noise. What the rule measurably buys is cleaner entries for on-screen NPCs who carry the invention. Eleanor Miller's T18 entry survives in arm B as "Her husband worked at the textile factory"; the guard alone drops her whole entry. Mr. Henderson's T16 entry under the guard alone keeps "worked with Wren Calloway's grandfather, Thomas" because his own name is vouched; in arm B the kinship is gone from it.

### Past the judge's rules: the name walks in kin-free

The judge flags a note only when it asserts the relative or the past. Read for the five invented names themselves, the kept entries tell a different story. Once the prose has "Eleanor", she comes back without a kinship word: "Old Man Hemlock ... spoke highly of Eleanor's skill", the event "Eleanor organized a potluck on the factory floor during the '87 strike", the location "factory floor, where Eleanor organized a potluck", "Harrowgate, whose history is connected to Eleanor's legacy". In h4 the grandparents return as bare character entries, "Clara, mill operator (historical), known for her sharp mind", and as a location, "Rowan, a place with looms where Clara and Thomas Calloway worked until 2014". Mr. Henderson's arm B entry reads "taught by Thomas Calloway": the kinship stripped, the name kept.

| | guard alone | arm B kept |
|---|---|---|
| kept entries carrying an invented relative's name with no kinship tie | 24 | 8 |

So the kinship predicate closes the entry that makes the claim and leaves the entries the claim seeds. The recall count above understates what lands, and this is the persistence vector the memo was written about.

### Re-entry

The change of shape that would move the verdict: remember the name. When the guard drops an entry naming X and nothing vouches for X, X goes on a session quarantine list; the extractor prompt shows the list and the guard scrubs later entries against it. That is stateful (the guard is pure today; the list belongs with the session), and its deterministic half is measurable on this replay with no model calls. The pronoun form is a narrower question: adding "their" to the player stand-ins needs a count of how often the extractor writes "their <kin>" about an NPC, which this replay's 1243 entries can answer offline before any code moves.

Held as a draft PR on the branch; not merged.
