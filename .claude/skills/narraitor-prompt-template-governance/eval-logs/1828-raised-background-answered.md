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

## Round 13 results (2026-08-22): HOLD by the declared rule, with the Harrowgate gate passed

Builds: control `a86c400f` (develop `d7f3f3fa` plus the declaration commit, no `src/` change), treatment `4ba5c31b` (the block plus its tests). Worktree port 3092, `Environments: .env.local`, live Gemini. Nine sessions, 132 generated segments, zero generation errors, no session ended early. Every treatment scene request carried the block (34 of 34 request bodies and every persisted `debugInfo.fullPrompt` from turn 2 on); zero of 67 control requests did. Raw captures, judge inputs, both judge outputs, the unblinding map and the judge prompts are archived as `artifacts/1828-round13-*`.

Harness checkpoint at H1 turn 3: no `__PLAYWRIGHT__`, no Playwright user agent, real POSTs to `/api/narrative/generate`, 9 distinct segments by turn 9, 19 journal entries from `/api/narrative/summarize`. Harness notes: the first `?fresh=true` load of every world splits the session (an orphan opening segment lands under a different session id); the second load lands consistently, so every session in both arms carries one orphan opener, symmetric across arms and recorded here rather than fixed. The orphan synced one NPC into the roster before H3 started (H1, H2, H4 and both Crystal Lake sessions started at zero).

### Raise turns, two blind judges (opus, sonnet), 24 items, 12 per arm, labels agreed on 21 of 24

| Cell | Arm | n | ENGAGED-SPECIFIC (unanimous) | Other labels (judge A / judge B) | Invented player history | Speaker appeared only to reply |
|---|---|---|---|---|---|---|
| Harrowgate, Wren fresh (H1, H2) | control | 6 | 1 | 4 REACTION-ONLY, 1 ENGAGED-GENERIC (both judges) | 2 | 2 |
| Harrowgate, Wren fresh (H1t, H2t) | treatment | 6 | 4 | 1 QUESTION-ONLY (both); 1 split ENGAGED-SPECIFIC / ENGAGED-GENERIC | 5 | 6 (judge B counts the addressed speaker; judge A: 1) |
| Harrowgate, Wren established (H3 T16/20/24) | control | 3 | 0 | 3 REACTION-ONLY / 2 REACTION-ONLY + 1 OTHER | 0 | 1 |
| Harrowgate, Wren established (H4 T16/20/24) | treatment | 3 | 3 | | 2 | 0 |
| Harrowgate pooled | control | 9 | 1 | | 2 | |
| Harrowgate pooled | treatment | 9 | 7 | | 7 | |
| Camp Crystal Lake, Jamie fresh | control | 3 | 0 | 3 REACTION-ONLY (both) | 0 | 0 |
| Camp Crystal Lake, Jamie fresh | treatment | 3 | 0 | T4 REACTION-ONLY (both); T8 QUESTION-ONLY / ENGAGED-GENERIC; T12 QUESTION-ONLY (both) | 0 | 1 (Mark, T8, both judges) |

Raise-turn outcomes: every Harrowgate raise rolled success except H1t T12 (failure, the `FAILED ATTEMPT` block co-rendered, and the reply still landed ENGAGED-SPECIFIC); no Crystal Lake raise rolled at all (inference returned no requirement). `continuity.status` was `clean` on all 24. Someone was present in the previous segment on 8 of 9 treatment Harrowgate raises and 7 of 9 control ones; on zero Crystal Lake control raises and one treatment raise (T12).

What the block did where a named character was in the room: the reply now names the player, takes the fact as theirs, and answers from the speaker's side. H2t T4 (Evelyn Hayes): "I remember your grandfather, Arthur. And your grandmother, Eleanor. Good people. They were both skilled weavers at Rowan Textiles, right up until the last loom fell silent in 2014. As for talking to the old mill families... I believe Mr. Henderson has made several attempts to reach out." H4 T16 (Mr. Henderson): "I remember your grandmother, Clara. Always had a story for every thread. And your grandfather, Thomas, he taught me how to adjust a warp beam when I was just a boy." The control shape on the same raise, H1 T4: "The room fell completely silent after your words... Several council members, especially the older ones, nodded slowly... Agnes, beside you, finally offered a small, sincere smile." Control is not uniformly silent: H2 control's Martha Higgins answered T4 in dialogue with the grandparents ("Wren Calloway, your grandparents... I remember them. Good people.") and T8 generically, which is why the in-round control, not round 4, is the comparator.

### Where it failed

1. Crystal Lake, both arms 0 of 3. Jamie is alone on every control raise and on the first two treatment raises (no `characterIds` in the previous segment). The block was honest once (T4: no one there, reaction only), then at T8 Mark appears for the first time in the passage to answer the attached question (both judges flag him as a speaker who materialised to reply; A labels QUESTION-ONLY, B ENGAGED-GENERIC), and at T12 Mark answers the boathouse question without touching the childhood stories (QUESTION-ONLY, both judges). In this world the duty has nobody to give the line to and the model either stays honest or conjures someone.

2. Invented player history, 7 of 9 treatment Harrowgate raises against 2 of 9 in control. The clause "neither is a reply that invents new history for the player" did not hold. What was invented, checked against the sheet: grandparents' names (Arthur and Eleanor in H2t T4 and T12; Clara and Thomas in H4 T16), the mother's name (Sarah, H1t T8), "what your mother owed the sick in '08 when the clinic couldn't cope" (H1t T12, the sheet says the mother was the sick one), "your mother, bless her heart, always spoke so highly of you" (H2t T8), "Arthur and I, we were at that meeting. We saw them raise their hands for you" (H4 T20, an eyewitness claim), and "you were the only one who raised a hand" (H2t T8, the sheet says nobody else did). Control's two are the same kind when control engages at all (H2 T4 "I remember them. Good people"; H2 T8 "God rest them, operated the looms until their last days", which asserts they are dead). So invention rides engagement; the block raised engagement from 1 to 7 and brought the invention with it. The arc check below shows the invented names then persist as session canon, which is the #1831 ledger's poison path (`continuityGuardrail.ts:70-75`) fed from a new direction.

3. Not the block's: a raw metadata block leaked into the prose once per arm (H2 control T10, H2t T8), the #1885 family.

### Non-raise turns, one blind judge (sonnet), 88 items

"Non-adjacent" excludes turns where any of the last three actions carried a sheet token (the raise's follow-up options carry it forward in both arms).

| Arm | Non-raise turns | Non-adjacent | Unprompted backstory, all | Unprompted backstory, non-adjacent | Speaker first seen when speaking | Ends on a named character addressing the player | Failure turns | Failure rendered as not occurring |
|---|---|---|---|---|---|---|---|---|
| control (5 sessions) | 55 | 26 | 1 | 1 | 15 | 6 | 13 | 2 (both H4 base turns, a request simply denied) |
| treatment (4 sessions) | 33 | 9 | 14 | 5 | 15 | 7 | 7 | 0 |

Per session, non-adjacent unprompted backstory: H1 0 vs H1t 2, H2 1 vs H2t 2, H3 0 vs H4t 1, CL1 0 vs CL1t 0. The declared gate (treatment at most control plus 2 per session) passes on its letter. The proportion is the honest number: 5 of 9 non-adjacent treatment turns against 1 of 26 control, and four of the five are turns 2 and 3, before any raise had happened: H1t T2, Mayor Thompson: "Your grandparents, God rest their souls, worked the looms at Rowan until the very end, didn't they?"; H1t T3: "Your grandmother, Eleanor, had a way of bringing people together... the '87 strike, she organized a whole potluck"; H2t T2 and T3, Evelyn Hayes on the grandfather and the looms in 2014. So the always-on duty reaches for the background when the action did not raise it, and invents while it does. The "speaker first seen when speaking" count is the same in both arms (15) and the judge applied it to NPCs already in the scene from earlier turns, so it does not discriminate; the reply-shot ending shifts mildly (11% to 21%). No second character carried the player's name in either arm.

Failure turns (the 1821 regression read): control 13 failure-outcome turns, 2 rendered as the attempt not occurring, both on H4's base turns ("request made and refused... nothing concrete is lost"); treatment 7, 0. The one raise that failed (H1t T12) both answered and cost. The failed-attempt strength held with the new block in front of it.

### Decision rule, read against the numbers

- Harrowgate pooled: treatment 7 of 9 unanimous ENGAGED-SPECIFIC (gate: at least 6) and treatment minus control 6 (gate: at least 3). PASS.
- Crystal Lake: treatment 0 of 3 (gate: at least 1 of 3, and at or above control). FAIL on the floor; equal to control.
- Invented player history in more than one treatment raise turn: 7. FAIL.
- Unprompted backstory per session at most control plus 2: PASS on the letter (max +2), with 5 of 9 non-adjacent treatment turns against 1 of 26 control as the number to read. Failure turns: 0 of 7 no-op in treatment vs 2 of 13 control. PASS.
- Verdict: HOLD. The gate that carries the issue's own acceptance criteria (a named character, in dialogue, using the fact's specifics) passes on the world the issue was filed from, for both fresh and established characters. The two failing gates are the ones the design review added on purpose: the duty invents the specifics it is asked to use, and it has no honest move when the player is alone.

## Coverage matrix (results)

| World (genre/tone) | Character (fresh/established) | Runs | Verdict | Representative excerpt (1-3 lines) |
|---|---|---|---|---|
| Harrowgate Mills (modern civic drama / dramatic) | Wren Calloway, fresh | 2 sessions per arm, 12 turns, 6 raises per arm | improved on this cell: 4 of 6 unanimous ENGAGED-SPECIFIC vs 1 of 6; 5 of 6 invented history vs 2 of 6 | H2t T4, Evelyn Hayes: "I remember your grandfather, Arthur. And your grandmother, Eleanor... skilled weavers at Rowan Textiles, right up until the last loom fell silent in 2014." |
| Harrowgate Mills | Wren Calloway, established (T1-12 neutral on base in both arms) | 1 session per arm, raises at T16/20/24 | improved on this cell: 3 of 3 vs 0 of 3; 2 of 3 invented history vs 0 | H4 T16, Mr. Henderson: "I remember your grandmother, Clara... your grandfather, Thomas, he taught me how to adjust a warp beam when I was just a boy." |
| Camp Crystal Lake (1984 slasher / mysterious) | Jamie Holt, fresh | 1 session per arm, 3 raises per arm | same: 0 of 3 in both arms; one materialised speaker in treatment | CL1t T12, Mark: "The boathouse? No, Jamie Holt, no one's been down to the boathouse since we locked it for the season. Why? What's down there?" (the childhood stories never answered) |
| Camp Crystal Lake | established | 0 | not run - declared shortfall | |

## Arc check (>= 3 consecutive turns, one cell)
- H4 (Harrowgate established, 24 consecutive turns, base build T1-12 then treatment T13-24, no reload until the resume at T12). The six-week vote and the 4.2 million offer appear at T1 and T3 and the six weeks recurs at T23; the appointment recurs at T6 and T24; 2014 at T16-17. The grandparents' names invented at T16 (Clara, Thomas) recur consistently at T17, T18, T19, T22 and T23, so the invention became session canon rather than contradicting itself. Eleanor Miller and Arthur are separate NPCs in this session and never collide with the H2t session's Arthur-and-Eleanor grandparents (different worlds).
- Contradictions found: none hard inside a session. Soft: H2t T8 "you were the only one who raised a hand" against the sheet's "nobody else raised a hand" (compatible readings, opposite emphasis).

## Failure drill
- Malformed/empty response path: unaffected - the change is outbound prompt text only. Unit tests pin: no block without a background, no block without a player action, block after the action line.
- Slow-response/timeout behavior: unaffected - no new AI round trip. Turn latency 5-9 s steady state in both arms.
- Missing/invalid key behavior: unaffected - template assembly runs before the client is touched.

## Regression vs prior good outputs
- Compared against: round 4's three raise turns (#1818 round-4 comment) as the before-shape, reproduced live in this round's H1 control (three reaction shots); the 1821 failure-turn read on this round's failure-outcome turns (non-raise section below); the one failure-outcome raise (H1t T12) still rendered the attempt and the cost.
- Old strengths preserved? The failed-attempt block co-rendered with the new block on H1t T12 and the passage both answered and cost ("a note of unexpected defensiveness", a flicker of surprise from the Mayor, the question turned back on the player). The control arm's two engaged replies show the model could already do this unprompted some of the time; the block made it the norm on Harrowgate.

## Cost/latency
- Block: 775 characters, 168 tokens by `estimateTokenCount`, on every turn with a background and an action (every player turn in practice). Matched-turn persisted prompt length, fresh Harrowgate sessions averaged over 2 per arm, turns 2-12: treatment larger by a mean of 1,616 characters; about half is the block, the rest is consistent with the longer answering passages feeding the three-segment window (n = 2 per arm, so noisy). Scene request bodies: control mean 30.6k characters (n = 56), treatment 33.3k (n = 34), confounded by session composition. No new round trip; latency unchanged.

## Verdict
- HOLD: improved on the Harrowgate cells of the evaluated matrix (7 of 9 unanimous ENGAGED-SPECIFIC vs 1 of 9), held because the Crystal Lake cell stayed at 0 of 3 and because the engaged replies invent player history on 7 of 9 turns. Ship/hold decision recorded in the memo `narraitor-feature-experiment-lifecycle/memos/1828-raised-background.md` and on the PR.
