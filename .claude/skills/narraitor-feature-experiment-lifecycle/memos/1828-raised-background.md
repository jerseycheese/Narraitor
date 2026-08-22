# Ship/hold memo - A raised character-sheet fact gets an answer (#1828)

- Issue: #1828 (campaign #1818, milestone v1.3 under #1834)
- Class: AI-behavior, one prompt block in `sceneTemplate.ts`, no flag (the 1821 failed-attempt block is the precedent: same file, same shape, no flag)
- Acceptance criteria (from the issue, verbatim): a player raising an established character-sheet fact gets a passage that names the specific fact, not an abstraction of it; at least one named character responds in dialogue rather than the scene returning a reaction shot; verified by a playtest run under `narraitor-playtest-loop`, not by a unit test; any prompt change carries an eval per `narraitor-ai-quality-discipline`.
- Declared eval matrix (AI experiments): Harrowgate Mills x Wren fresh (2 sessions per arm), Harrowgate x Wren established (1 per arm, neutral base turns then treated turns), Camp Crystal Lake x Jamie fresh (1 per arm); Crystal Lake established declared not run. Two arms on one port, control first on the base commit, then treatment on the change commit; three typed raises per session, each a different sheet fact; two blind judges on different models over shuffled, opaque-id items; decision rule written in `eval-logs/1828-raised-background-answered.md` before the code.

## Gate results

| Gate | Result | Artifact |
|---|---|---|
| Quality gate (test/type/lint/lint:css) | pass on `4ba5c31b`: jest 444 suites / 3081 tests exit 0, tsc 0, eslint 0 errors (126 pre-existing warnings); no CSS touched | session log; PR checks |
| Class-specific gates (prompt governance G1-G3, G6, G7) | pass: reads two existing context fields, no new state to the model, response format untouched; block 775 chars / 168 est. tokens per turn; every cell through the real `/worlds/[id]/play` loop | eval log |
| Parity ladder rung reached | S3: real play loop against live Gemini, both builds | eval log |
| Fresh-state walk (P8) | pass: nine store-seeded worlds in one origin, one per session, fresh sessions; the established cell resumed its session from IndexedDB across the server restart | eval log |
| Eval matrix (AI) | Harrowgate pooled: treatment 7 of 9 unanimous ENGAGED-SPECIFIC vs control 1 of 9 (gates at least 6 and a difference of at least 3: PASS). Crystal Lake: 0 of 3 in both arms (gate at least 1 of 3: FAIL). Invented player history on 7 of 9 treatment Harrowgate raises (gate at most 1: FAIL). Non-raise over-firing and failure-turn reads: eval log. | eval log "Round 13 results"; artifacts `1828-round13-*` |

## Decision

- **HOLD** (round 13, 2026-08-22), by the declared rule. The issue's own acceptance criteria are met on the world it was filed from: on Harrowgate, for both a fresh and an established Wren, the raised fact now draws a named character's reply in dialogue that uses the player's specifics, 7 of 9 unanimous against 1 of 9 on the same build minus the block. The PR stays open as a draft; the block does not ship.
- Failing gate 1, Crystal Lake 0 of 3: Jamie was alone on every control raise and on two of three treatment raises. The duty has no honest move when nobody is in the scene. Once it stayed honest (T4, reaction only), once it conjured a speaker (T8, Mark appears to answer), once a present speaker answered the attached question and skipped the personal fact (T12). The cell says the block needs someone to hand the line to, and the single-cell sample (n = 3, no NPC present) cannot say more than that.
- Failing gate 2, invented player history: the clause forbidding it did not hold. When the reply engages, it names the grandparents (Arthur and Eleanor in one session, Clara and Thomas in another), names the mother (Sarah), adds events the sheet does not have (the mother tending the sick in '08; an NPC who was at the appointment meeting), and the invented names then persist as session canon (H4 T16 through T23). Control does the same on the two turns where it engaged at all, so invention rides engagement rather than being new to the block; the block multiplied both. This is the ledger's poison path (`continuityGuardrail.ts:70-75`) arriving from the prose side, and it is the reason a wording fix alone is not the re-entry.

## Re-entry condition (what flips this to ship)

1. An app-side guard before a wording round, not instead of one: the lore extractor and the continuity ledger should not accept an NPC-asserted fact about the player character that the sheet does not support (names of relatives, events in the player's past). That is #1831's domain and the #1855 name-migration family; it is filed as a follow-up from this round rather than folded in. With that guard in place, an invented name in the prose is a one-turn slip instead of session canon.
2. Then the wording round on this block, declared first: feed the block the sheet's own nouns (the names and dates it does carry) and make the no-invention clause a checkable predicate ("if the reply names a relative or an event the background above does not name, the reply is wrong") rather than a prohibition in a subordinate clause. Keep the two-field limit on `formatPlayerBackground`.
3. Condition the duty on presence: render it only when the previous segment's `characterIds` is non-empty, or word it so an alone protagonist gets an honest reaction rather than a conjured speaker. Crystal Lake's cell decides this one; re-run it with the raise turns gated to a turn where someone is present, and report the alone stratum separately.
4. Same matrix, same judges, same rule. Ship when the Harrowgate gate holds, Crystal Lake reaches at least 1 of 3 with no materialised speaker, and invented player history is at or below 1 treatment raise turn.

## Residual risk
- N = 2 sessions per arm on the fresh Harrowgate cell and 1 on the others; 24 judged raise turns total. The Harrowgate difference (7 vs 1, two judges, 21 of 24 label agreement) is large for the sample; the Crystal Lake read is n = 3 with nobody present.
- Genre coverage: the matrix is the campaign's two fixed worlds (contemporary realism, 1980s horror). No fantasy, science fiction or comedic world has been in any round's matrix, so a genre-shift cell is an open item for a later round.
- The established-character cell is Harrowgate, not Crystal Lake, because a slasher world can end a 24-turn session before the treated raises; the Crystal Lake established cell is the declared shortfall.
- Every session carries one orphan opening segment from the first `?fresh=true` load (symmetric across arms, recorded in the eval log's harness notes); a harness fix for that split is worth filing.
- The metadata leak (#1885 family) appeared once per arm and is unrelated to the block.
