# Prompt/template eval log - #1828 a raised character-sheet fact gets an answer

- Change: one variable - a `RAISED BACKGROUND` duty block in `sceneTemplate.ts`, rendered directly after the `PLAYER ACTION:` line and only when the prompt already carries a `PLAYER CHARACTER BACKGROUND` section and a player action. It tells the passage that if the action raises anything from the background, at least one named character answers it in dialogue, using the player's own specifics, without inventing new history for the player. `formatPlayerBackground` and its two-field limit are untouched. Exact text is in the diff.
- Diff: `src/lib/promptTemplates/templates/narrative/sceneTemplate.ts`, `.../__tests__/sceneTemplate.test.ts`, this log. Branch `claude/narraitor-v1-3-canon-engagement-699fa7` off develop `d7f3f3fa`.
- Date / evaluator: 2026-08-22, autonomous build session with a live Gemini key (`.env.local` synced from the main checkout). Playtest per `narraitor-playtest-loop`, blind judges per the judging section below.

## Declared before the code (2026-08-22)

### Why this shape

Round 4 (#1818, build `45e7a7f9`) put the sheet in the prompt and measured the prose ignoring it: three raises of the grandparents/looms/2014 fact (T6, T17, T26) got one generic acknowledgement and two reaction shots. Round 3, with no background block at all, got nothing on the same hook. The wiring is complete (confirmed again on `d7f3f3fa`: `narrativeGenerator.prompt.ts:77-78` passes `playerCharacter.background`, `sceneTemplate.ts:116-122` renders it). What the prompt lacks is a duty on the passage, and the prompt carries only the last three segments (`NarrativeController.tsx:659`), so by the second raise the background block is the only source the prose can answer from.

The block copies the shape of the one instruction that demonstrably fires in this template, the `FAILED ATTEMPT` block measured in `1821-failed-attempts-cost.md`: a render condition, an ALL-CAPS header, imperative bullets, and one predicate the model can test its own draft against ("if no named character has spoken directly to what the player raised, the passage is wrong"). The condition itself (does this action raise the background?) is checked by the model, not by code. A lexical-overlap gate was considered and rejected: Wren's history shares "mill", "council", "back" and "people" with most actions in that world, so a code gate over-fires, and it is the kind of abstraction the issue's scope excludes. If this holds, the code-gated variant that quotes the shared terms is the first re-entry step.

Deliberately absent: any reaction-shot imagery (the 1821 log's reason stands - quoting the attractor feeds it and it is the judges' tell), any world-specific example, and any instruction to use the background when the player did not raise it. One clause guards the ledger's known poison path (`continuityGuardrail.ts:70-75`): the reply must not invent new history for the player.

### Gates

- G1 (input contract): reads only `playerCharacterBackground` and `narrativeContext.currentSituation`, both already on `NarrativeTemplateContext`. No type change.
- G2 (leakage): no new state reaches the model. The block is instruction text only.
- G3 (parser safety): the response format block is untouched. The only code that reads prompt text back is `parseContentRating` (`contentRatingGuidance.ts`), keyed on "CONTENT GUIDELINES", which the block does not contain.
- G6 (cost): measured below with `estimateTokenCount` on the block and with the request-body delta from a fetch tap on `/api/narrative/generate`.
- G7 (integration): every cell runs through the real `/worlds/[id]/play` loop.

### Matrix

| World (genre/tone) | Character | Sessions per arm | Raises per arm |
|---|---|---|---|
| Harrowgate Mills (modern civic drama / dramatic) | Wren Calloway, fresh | 2 x 12 turns, raises at T4/T8/T12 | 6 |
| Harrowgate Mills | Wren Calloway, established: T1-12 neutral on the base build in both arms, then T13-24 with raises at T16/T20/T24 on the arm's build | 1 | 3 |
| Camp Crystal Lake (1984 slasher / mysterious) | Jamie Holt, fresh | 1 x 12 turns, raises at T4/T8/T12 | 3 |
| Camp Crystal Lake | established | not run - declared shortfall, see residual risk | 0 |

Two arms, sequential on one worktree and one port: control at `d7f3f3fa` plus this declaration (no `src/` change), then treatment at the change commit, with the server restarted between and both SHAs recorded. A new store-seeded world per session, because the NPC roster is world-scoped (`narrativeGenerator.npc.ts`) and a reused world would hand the second arm the first arm's invented NPCs. Every non-raise turn runs the cautious autopilot from rounds 5-12 (offered option with the lowest DC, lawful on a tie), so the only typed input per session is the three raises.

The comparator is the in-round control arm. Round 4 is context, not the comparator: it ran 23 of 30 turns typed on a build four merges older.

### Raise scripts

A different sheet fact per raise, each carrying a specific that only the sheet holds, because the content gate (`narrativeContentGate.ts`) strips a paragraph that matches one of the last four segments at Dice 0.7 and a repeated raise with a repeated reply would bias against the arm that answers. The first Wren raise mirrors round 4's wording.

Wren (history: "Grew up four streets from the mill; both grandparents worked the looms until 2014. Left for a decade, came back when their mother got sick, and got appointed to the council in a room of eleven people because nobody else raised a hand."):

1. "I tell them my grandparents both worked the looms at Rowan Textiles until it closed in 2014, and ask whether anyone has talked to the old mill families."
2. "I say I left this town for ten years and only came back when my mother got sick, and ask who here remembers that."
3. "I remind them I was appointed in a room of eleven people because nobody else raised a hand, and ask what that makes me owe."

Jamie (history: "Nineteen, second summer on staff. Grew up forty minutes down the road, so the camp's ghost stories were bedtime stories. Knows the trails, the boathouse, which cabin doors don't lock."):

1. "I tell the others this is my second summer on staff and the Crystal Lake stories were my bedtime stories growing up, and ask which ones they've heard."
2. "I say I know which cabin doors don't lock, and ask who has been checking them."
3. "I mention the boathouse from the stories I was told as a kid, and ask if anyone has been down there."

Recorded per raise turn, outside the judge's view: `decisionOutcome` (typed actions roll inferred checks, and a failure co-renders the `FAILED ATTEMPT` block), whether the previous segment listed anyone in `characterIds` (someone present to answer), `continuity.status` (the guardrail can rewrite a passage after generation), and whether the segment's persisted `debugInfo.fullPrompt` contains the block header (arm proof bound to the segment, not to a tap).

### Judging

Two fresh subagents on different Claude models, each handed one file of every raise turn from both arms, shuffled with a fixed seed under opaque ids, each item `{id, playerAction, prose}` and nothing else. The id-to-arm map lives in a file the judges never see. Judges are told they are reading a text adventure, may read no other file, and may use no browser tool. Per item they classify:

- ENGAGED-SPECIFIC: a named character other than the protagonist replies in quoted dialogue, attributes the matter to the player or their family, reuses at least one specific the player stated, and adds at least one proposition not present in the player's text.
- ENGAGED-GENERIC: a named character replies in dialogue to the general subject; the player's specifics do not appear in the reply.
- ECHO-ONLY: the reply repeats the player's specifics and adds nothing.
- QUESTION-ONLY: the reply answers the attached question and never touches the personal fact.
- DODGED-ALOUD: a named character explicitly declines, in words.
- REACTION-ONLY: no character's words address it; the passage shows people reacting or the scene moving on.
- OTHER, with a note.

Alongside the class: the character's name, a quote of the reply, the player-stated specifics it reuses, a separate ENGAGED-SHEET flag when the reply uses a personal detail the player did not state this turn (the one signal that proves the sheet block itself was read), and a quote of any fact about the player's past the speaker asserts that the player did not say (checked afterwards against the sheet and later turns).

A third blind read covers every non-raise turn from both arms, interleaved: unprompted mention of the protagonist's past, family or upbringing; a named speaker who was not in the passage before the reply; the passage ending on a named character addressing the player; dialogue repeating the player's action near-verbatim; a second character carrying the player's name. "Prompted-adjacent" turns (any of the last three `causedByDecisionText` values mentions a sheet token) are computed mechanically and excluded from the unprompted count. Failure-outcome turns in both arms get the 1821 no-op question, because the new block sits between `PLAYER ACTION` and the failure block and the 1821 strength has to survive (G5).

### Decision rule

Counts are unanimous across both judges unless stated.

- SHIP when all of these hold: Harrowgate pooled (9 raises per arm) treatment ENGAGED-SPECIFIC at or above 6 of 9 and treatment minus control at or above 3; Crystal Lake treatment at or above control and at least 1 of 3; treatment's unprompted-backstory count on non-adjacent turns at most control plus 2 per session; no new failure shape (invented player history, a speaker materialised to answer, verbatim echo) in more than one treatment raise turn; treatment's failure-outcome turns show no return of the 1821 no-op shape beyond control.
- HOLD otherwise, naming the failing gate and cell. A HOLD on the control-difference gate alone reads "baseline moved", not "block failed". Re-entry, in order: the code-gated variant that quotes the shared terms; then placement.
- RETIRE when treatment is at or below control in every cell.

Deviation from `narraitor-playtest-loop` section 5, stated up front: the owner check-in after every run does not happen in an autonomous session. Every run's raw capture and both judge files are saved under `~/.claude/projects/-Users-jackhaas-Projects-personal-narraitor/artifacts/1828-round13-*` so the owner can re-read them.

## Coverage matrix (results)

| World (genre/tone) | Character (fresh/established) | Runs | Verdict | Representative excerpt (1-3 lines) |
|---|---|---|---|---|
| Harrowgate Mills (modern civic drama / dramatic) | Wren Calloway, fresh | pending | | |
| Harrowgate Mills | Wren Calloway, established | pending | | |
| Camp Crystal Lake (1984 slasher / mysterious) | Jamie Holt, fresh | pending | | |
| Camp Crystal Lake | established | 0 | not run - declared shortfall | |

## Arc check (>= 3 consecutive turns, one cell)
- pending

## Failure drill
- Malformed/empty response path: unaffected - the change is outbound prompt text only. Unit tests pin: no block without a background, no block without a player action.
- Slow-response/timeout behavior: unaffected - no new AI round trip.
- Missing/invalid key behavior: unaffected - template assembly runs before the client is touched.

## Regression vs prior good outputs
- Compared against: round 4's three raise turns (#1818 round-4 comment, `playtest-log.md` round 4) as the before-shape; the 1821 failure-turn read on this round's failure-outcome turns.
- Old strengths preserved? pending

## Cost/latency
- pending

## Verdict
- pending
