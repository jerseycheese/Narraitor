# Eval log — TurnResolver integrated live matrix (#1983)

- Change under test: the TurnResolver architecture, not a prompt. Core session state
  (inventory, conditions, world threads, scene, fatal outcomes) settles inside
  `resolveTurn()` before the next Decision generates, and choice generation consumes the
  returned `SessionSnapshot` instead of firing on a `setTimeout(500)` heuristic.
- Landed in: #1984, #1990, #1991, #1992, #1993.
- Base SHA: `427d021f2ef3d9a6922a26bac5b61d5bf60c5cd9` (`origin/develop`).
- Date / evaluator: 2026-09-02, integrated live matrix session.
- Parent: epic #1983. Symptom issues under verdict: #1872, #1882, #1857.

**No prompt wording changes in this round.** Nothing under `src/lib/promptTemplates/` is
touched. The v1.3/v1.4 campaigns spent 13+ rounds on wording and the epic's conclusion is
that the prompt-side lever is exhausted. This matrix measures whether the architecture moved
the symptoms, and a result that seems to need a wording change to become readable is
recorded as a finding rather than acted on.

---

## Precommitted protocol and decision rule

Everything in this section was written and committed before the first session ran. The
commit that carries it is the declaration of record.

### Matrix

Two contrasting worlds crossed with two character states, per the binding minimum in
`narraitor-ai-quality-discipline` section 5. Character state is a window inside one
continuous session rather than a separate seed, matching how rounds 9 and 13 read
fresh-versus-established.

| Cell | World | Genre / tone | Character window | Arm | Turns |
|---|---|---|---|---|---|
| A-fresh | Harrowgate Mills | civic drama, dramatic, PG-13 | fresh (t1-15) | default flags | 45-turn session |
| A-est | Harrowgate Mills | civic drama, dramatic, PG-13 | established (t16-45) | default flags | same session |
| B-fresh | Camp Crystal Lake | slasher, mysterious, R | fresh (t1-15) | default flags | 45-turn session |
| B-est | Camp Crystal Lake | slasher, mysterious, R | established (t16-45) | default flags | same session |
| C-A | Harrowgate Mills | civic drama | fresh | `WORLD_COST=true` | 30-turn session |
| C-B | Camp Crystal Lake | slasher | fresh | `WORLD_COST=true` | 30-turn session |

Arms. The default-flag arm runs `WORLD_CLOCK=true`, `WORLD_DESCRIPTION_IN_SCENE=true`,
`UNRECORDED_EXCHANGE_GUARD=true`, `WORLD_COST=false`, `SETTLED_COMMITMENT_CHOICES=false`,
which is what a player gets today. Cells C-A and C-B are the #1882 treatment arm and need a
separate dev server, because `NEXT_PUBLIC_*` inlines at build time. The matched #1882
control is turns 1-30 of the A and B sessions.

### Gates

**Architecture gates.** These test the epic's own claim and must hold in every cell.

- **G-A1, settled revision.** Every committed segment carries its own turn's
  `metadata.worldClock` stamp. Before the resolver the stamp landed after the fire-and-forget
  extraction and lagged the newest turn by one. Gate: stamps present on at least 95% of turns
  per session, with any missing turn named.
- **G-A2, settled state reaches the next Decision.** On every turn where inventory changed,
  the `/api/narrative/choices` body that follows it carries the post-turn inventory. This is
  the direct read on "choice generation runs after `resolveTurn` resolves". Gate: 100% of
  inventory-mutating turns, n reported. Zero mutating turns in a session makes the cell
  unscorable on this gate rather than passing it.
- **G-A3, no partial settlements.** Zero turns settle as `partial`, and no turn stalls with
  choices blocked behind a reconciliation error. Gate: 0 of n.

**#1872, overdue threads never come due.** Gates come from the issue's own text: "the target
is a resolved-not-dropped count above zero per session and last-block Momentum at or above
the first treated block."

- **G-1872a.** Threads resolved (status `resolved`, not `dropped`) > 0 per session.
- **G-1872b.** Blind-judge Momentum on the last 15-turn block >= Momentum on the first block,
  per session.
- **G-1872c.** No thread sits overdue for more than 5 consecutive turns while its only
  recorded movement is an advance the ledger cannot name a state change for.

**#1882, an arrived threat should cost something.** The threshold carries over from the
round-13 hold, which measured 2 world-took turns per 30 against a threshold of 3.

- **G-1882.** World-took turns per 30 turns >= 3 in the `WORLD_COST=true` arm, and strictly
  greater than the matched control window, in both worlds. A world-took turn is one where an
  item left the inventory with `lossReason` of stolen or destroyed, or a condition was
  imposed on the character.

**#1857, invented private conversation.** One bait per cell in the four default-flag cells:
a custom action asking a rostered NPC to repeat publicly what they said privately, on a
session where no such private exchange exists.

- **G-1857.** 4 of 4 baits treated as a false premise, meaning the NPC or the narration
  declines the premise without generating the invented content. Any backfill is a failure.

### Decision rule

Per issue, decided against the gates above and nothing else:

- **SHIP** when the issue's gates clear in both worlds.
- **HOLD** when they clear in one world, or clear partially, with the failing cell and a
  concrete re-entry condition named.
- **CLOSE** when the measurement shows the lever is dead: no better than the recorded
  baseline, with the epic's stop rule ("hard stop after this matrix") applying.

Rollout constraints fixed in advance. No feature flag default changes in this PR. No issue
gets closed by this lane. Verdicts are recommendations recorded here and posted to each
issue.

### Shortfall handling

A session that dies to a fatal ending inside a scored window makes that cell's gate
unscorable, which is a finding and not a harness failure. One second attempt per cell is
budgeted; the attempt lineage gets recorded. If the matrix under-runs, this log reports what
it could and could not settle rather than stretching a thin reading into a verdict, and the
declared design above stays as written.

---


## Matrix as run

All six declared cells ran. Nothing in `src/lib/promptTemplates/` was touched, and no source
file was changed for this round.

| Cell | Session | Turns | Arm | Outcome |
|---|---|---|---|---|
| A-fresh / A-est | S1 Harrowgate Mills | 45 | default flags | complete |
| B-fresh / B-est | S2 Camp Crystal Lake | 45 | default flags | complete |
| C-A | Harrowgate Mills | 30 | `NEXT_PUBLIC_FEATURE_WORLD_COST=true` | complete |
| C-B | Camp Crystal Lake | 30 | `NEXT_PUBLIC_FEATURE_WORLD_COST=true` | complete |

150 live turns against `gemini-2.5-flash` through the real `/worlds/[id]/play` surface. The
cost arm ran on a second dev server, because `NEXT_PUBLIC_*` inlines at build time. The flag
was verified live before the run was spent: 9 of the first 9 segments carried a `worldCost`
stamp and the "what the world can take" block was present in the tapped prompt bodies.

Four blind judges were commissioned, three returned in time and are used here: S1, S2, and
C-B. Each judge received only the rubric and a transcript file, with no ledger, no world
spec, and no statement of what the round was testing.

### Shortfalls against the declared design

Three, all recorded rather than worked around.

1. **S1 turn 40 dropped its stream** ("We lost the connection needed to continue your
   story", after a 200 from the route) and needed a manual retry. The turn recovered, but the
   decision recorded on the dead turn offsets `playerAction` against `optionsOffered` from
   there on, so turns 41-45 of S1 show no player action in the transcript. The S1 judge read
   that as the game ceasing to be interactive and marked block 3 down for it. **S1's block-3
   Agency and Momentum scores are therefore not clean**, and the #1872 momentum gate is
   settled on S2, which ran with no errors and a verified `causedByDecisionId` match.
2. **The #1857 baits contaminate each other.** The declaration put one bait in each of the
   four default-flag cells, two per session. The first bait's own prose puts an assertion
   about a private conversation on the page, which the lore extractor can record, so the
   second bait in the same session is no longer testing an unrecorded exchange. Only the
   first bait per session is a clean read. That drops the clean sample from the declared 4 to
   2, and a separate one-turn mechanism probe was run to compensate.
3. **S2's fetch tap was lost** when the browser pane closed between the run and its final
   capture. The session state itself survived in IndexedDB and was captured in full, so every
   store-side measurement stands; only the per-turn prompt-body tap for S2 turns 31-45 is
   missing. The turn 1-30 tap survives in that session's interim capture.

---

## Results

### Architecture gates

| Gate | Result | Measured |
|---|---|---|
| G-A1 settled revision | **PASS** | 150/150 turns carry their own turn's `metadata.worldClock` stamp, across all four sessions. Zero stamps recorded a turn other than their own segment's. |
| G-A2 settled state reaches the next Decision | **PASS** | 0 stale items across 42 inventory-mutating turns and 95 choice prompts carrying an inventory block, plus 5 turns where the prompt was demonstrably ahead of a commit-time store read. |
| G-A3 no partial settlements | **PASS** | 0 turns settled partial. 0 turns took 30s or more to re-enable choices. One transport-level stream drop (S1 t40), recovered by retry. |

G-A1 is the sharpest read in the round. Before the resolver the world-clock stamp landed
after the fire-and-forget extraction and lagged the newest turn by one, which is why the
playtest skill tells a reader to take the stamp off the segment before the one just captured.
It now lands on its own segment, 150 times out of 150, in two genres and both flag arms.

G-A2 needs care, because the raw probe reads worse than the gate until the divergences are
classified. Eight turns across the four sessions showed the choice prompt's inventory block
differing from the harness's commit-time read of the store. They fall into three classes, and
only one of them would be the race this epic set out to kill.

| Class | n | What it means |
|---|---|---|
| Prompt ahead of the probe | 5 | The item was lost on that turn, and the prompt already omits it while the commit-time store read still lists it. |
| Token truncation | 3 | The builder's own cap, not a state error. |
| **Stale: an item already gone, still offered as possessed** | **0** | The race symptom. |

The five "prompt ahead" cases are the strongest positive evidence in the round, and they need
the harness's own limitation explained to be read correctly. The probe snapshots the segment
object at the instant `getSessionSegments().length` increments, so it captures state before
reconciliation finishes writing. That is why the world-clock stamp is absent in 150 of 150
commit-time probes while present in 150 of 150 final captures - the probe holds a stale object
reference, not a missing stamp.

So on those five turns the harness still saw the lost item in inventory, and the choice prompt
had already dropped it. The prompt was reading settled state the probe had not caught up to.
That is precisely the causal guarantee the epic claimed: choice generation runs after
`resolveTurn` resolves, rather than after a `setTimeout`.

The three truncation cases are `buildInventoryContext` doing its documented job -
`MAX_LISTED_ITEMS = 8` plus a token budget - and the block says so in its own last line:

```
- Heavy Binder (documents, qty 3, ...) - Harrowgate Historical Preservation Grant Review Period Documentation
+ 1 more items not shown to stay within token limits.
```

The symptom the race would produce is the opposite one: an item the player no longer has
still described as possessed. That count is zero everywhere - 0 of 95 prompts.

### #1872 - overdue threads never come due

| Gate | Result | Measured |
|---|---|---|
| G-1872a resolved-not-dropped > 0 per session | **PASS** | 2, 6, 5, 6 resolved across the four sessions. Zero dropped in any session. |
| G-1872b last-block Momentum >= first block | **FAIL** | S2 4 -> 3 -> 2. S1 3 -> 3 -> 2, and S1's block 3 is contaminated. |
| G-1872c no long overdue runs | **FAIL** | S1 carried two threads overdue ~15 turns; C-B carried three overdue 20-21 turns. |

The mechanical half of #1872 is fixed and the judged half is not.

Round 9's Harrowgate measured 15 advances, 2 resolutions, both `dropped`, zero `resolved`.
Round 9's Crystal Lake advanced a single thread on 18 of 27 turns and dropped it at t44. This
round produced 19 resolutions and zero drops across four sessions. Crystal Lake's resolution
rate climbs across the session (1, 2, 3 per 15-turn block) while its advance rate falls (23,
22, 14), which is the shape the issue asked for: fewer restatements, more payoffs.

The judges, who never saw a ledger, confirm payoffs are real. S2's judge: the player orders
Mark through the kitchen at t10 and Mark is taken at that exact exit at t16, "a player
decision coming due with a body attached." S1's judge traced the preservation grant from
introduction at t13 to revocation at t36, "a genuine setup-to-payoff arc across 23 turns."

But momentum still falls off a cliff in the last block of every judged session, and both
judges independently named the same cause, without being asked about it. S1's judge:

> Every victory the player wins is deferred to a moment the game never reaches, because the
> scene never ends. Forty-five turns, one room, one evening, no clock movement.

S2's judge named the mirror image, that the story has no record of what it has already spent,
and cited a child snatched at t24 and snatched again at t26, and a back wall exploding inward
at t24, t26 and t28. The state layer now settles correctly; the prose layer still re-emits
consumed events and still cannot end a scene.

### #1882 - a threat that has arrived should cost something

| Gate | Result | Measured |
|---|---|---|
| G-1882 world-took turns per 30 >= 3 and > matched control, both worlds | **PASS** | See below. |

| World | Control (`WORLD_COST=false`) | Treatment (`WORLD_COST=true`) |
|---|---|---|
| Harrowgate Mills | 0 / 30 turns, 0 conditions | 4 / 30 turns (t12, 13, 15, 18), 1 condition |
| Camp Crystal Lake | 1 / 30 turns, 0 conditions | 10 / 30 turns (t6, 12, 17, 18, 19, 22, 23, 26, 27, 29), 8 conditions |

Round 13 measured 2 world-took turns per 30 against a threshold of 3 and held. This round
clears the threshold in both worlds and beats a matched same-build control in both.

The channel the issue called dead is now live. #1882 recorded that `status.conditions` was
declared on the character type and that "nothing in `src/` ever writes it". Across the two
treatment sessions the character finished carrying 9 written conditions, from "inability to
speak" in the civic drama to eight accumulated injuries in the slasher.

The control arm makes the point from the other side, and it is the strongest single piece of
evidence in the round. S2's judge, reading the control transcript with no ledger, listed
losses the story asserted in prose: a head wound at t23 that "explicitly degrades every
subsequent physical attempt", a left arm twisted at t32 that is "gone for good - from turn 41
on the text says your good arm". The store recorded zero conditions for that session. With
the flag off, the prose invents costs the game does not hold; with it on, the game holds
them.

A ledger metric moving is not the same as the story improving, which is the trap this
campaign fell into repeatedly, so the strongest cost cell was blind-judged as well. C-B scored
Stakes 4 / 4 / 4 flat across the session against the matched control's 3 / 4 / 3, and the
judge listed losses that stay taken without being asked to look for them: a branch at t17, an
arm at t18, position at t19 and t21, numbness at t22, an ankle at t23. The metric and the read
agree.

Two judged caveats are real and belong on the record. S2's judge, on the control session:
"none of it is ever charged to a decision. Every loss arrives from the world's side of the
table. A cost that lands identically whatever you pick is not a cost the player paid."
C-B's judge found the accumulating condition state tips from escalating pressure into padding
around t20 and t24, the leg injury taking a new adjective per turn without new development.

### #1857 - engine invents a private conversation

| Gate | Result | Measured |
|---|---|---|
| G-1857 4/4 baits treated as a false premise | **FAIL** | 0 of 5 baits declined the premise. 3 of 5 invented the conversation's content. |

Five baits total: the four declared, of which two are clean and two are contaminated by the
earlier bait in their own session, plus one mechanism probe.

| Bait | Clean | What the story did |
|---|---|---|
| S1 t12 (Davies) | yes | Deflected, with a partial denial. Declined to confirm the substance and changed the subject. |
| S2 t12 (Sarah) | yes | **Invented the content.** |
| S1 t28 (Davies) | contaminated | **Invented the content**, and the NPC ratified it. |
| S2 t28 (Sarah) | contaminated | Deflected, by having the player's voice fail. |
| Probe, C-A t31 (Miller) | yes | **Invented the content**, and the NPC ratified it. |

Two of the inventions were then built on. S2's judge, blind:

> The story accepted the premise and manufactured the whole exchange ... It then canonized
> the fabrication and built on it for the rest of the transcript. The second-monster
> plotline, which drives turns 34 through 39, rests entirely on a conversation that never
> happened.

S1's judge on t28: the story ratified the player's assertion wholesale, paid out a
concession on the strength of it, and the manufactured thirty-day review period "becomes the
player's central win and is cited back at turns 31, 36, 39 and 45."

The mechanism probe settles why, and it matters because the two candidate causes have
opposite fixes. On the probe turn the fetch tap saw one generate body carrying
`CONTINUITY REQUIREMENTS` and **zero** carrying the guard's own line, `never happened on the
page`, even though the bait text matches the detector's claim regexes in
`src/lib/lore/unrecordedExchange.ts` by inspection. The contract was assembled and reached
the model; its unrecorded-exchange section was empty. **The guard stands down before the
prompt is built.** This is not a case of the model overriding an instruction it was given.

The guard has been on by default since it shipped, so this is the shipped behaviour, not an
experiment that failed to take.

### Incidental defects the judges found unprompted

Not in scope for any gate, worth filing separately.

- Machinery leaking into player-facing prose: an `(OOC: The thread ... has been resolved.)`
  aside at S2 t16; raw `</response>` and a JSON metadata block at S1 t19 and t25; raw
  scaffolding words at S2 t44 ("tense", "horror, survival, underwater"); a bulleted "Your
  Current Goals" list inside the narration at S1 t16.
- Whole-paragraph duplication between nearby turns, in both worlds.
- Choice generation offering a character removed 23 turns earlier: S2 t39 and t44 both offer
  Mark, taken at t16. The judge specifically noted the error "originates before the prose, in
  whatever generates the choices."
- Condition strings written by the cost arm are prose fragments rather than state labels, for
  example "fresh wave of blinding pain through twisted lower limb". The channel works; the
  values are noisy.
- **Item acquisition mints near-duplicates for one narrative object.** S1 recorded 16
  acquisition events across 5 names for what the prose treats as a couple of documents,
  including "Heavy binder" eight times. C-B recorded 8 events across 6 names for what the
  prose treats as one stick: "Thick, fallen limb", "Thick branch", "Thick fallen limb",
  "Rough branch", "Heavy branch", "Rough limb" three times. This is what made C-B's judge
  report a state error that was not one - it read "Heavy Branch" (lost t12) and "Rough Branch"
  (lost t17) as the same object and concluded a taken item had been handed back. The
  inventory is correct and the naming is not, which is its own bug and worth filing: it also
  drives the token truncation in G-A2, since duplicate entries consume the 8-item cap.

---

## Verdict

The architecture did what the epic said it would, and the three symptom issues split three
ways underneath it.

**Architecture: validated on the evaluated matrix.** All three gates pass across 150 live
turns in two genres and both flag arms. Turns now commit with their state settled, and the
next Decision reads that settled state rather than racing it.

The epic's own stop condition is the honest reading of the rest. State is now trustworthy and
prose still collapses late: momentum falls in the last block of every judged session, and
both blind judges independently traced it to the same structural absence, that the session
has no scene boundary and no clock, so wins are banked for a "later" the game never reaches.
Per the epic, the recorded conclusion is to scope the product around shorter sessions and a
hard scene boundary, **not** to open another prompt-wording round.

### #1872 - HOLD

The mechanical half is fixed. Resolutions went from zero-resolved-two-dropped in round 9 to
19 resolved and zero dropped across four sessions, and the advance-to-resolution ratio now
improves across a session instead of degrading. G-1872a passes in all four cells.

The judged half does not. G-1872b fails in both judged sessions and G-1872c fails in two, with
threads sitting overdue for 15 to 21 turns. Re-entry condition: this is the scene-boundary
problem, not a ledger problem. A thread cannot come due inside a single continuous scene that
never ends, which is what both judges said without being asked. The next move on #1872 is a
time-cut or scene-boundary mechanism, and it should not be attempted as prompt wording.

### #1882 - SHIP, and flip the flag

G-1882 clears in both worlds against a matched same-build control, at 4/30 versus 0/30 and
10/30 versus 1/30, both above the round-13 threshold of 3. The `status.conditions` channel
the issue documented as dead is now written by the world-cost path.

**Recommend flipping `WORLD_COST` to default `true`.** This PR does not flip it: that is the
owner's call and this lane records the measurement. Two follow-ups belong with the flip:
normalise the condition strings into state labels rather than prose fragments, and take up
the judge's caveat that losses currently arrive only from the world's side and are never
charged to a decision.

### #1857 - HOLD

The guard is on by default and measured 0 of 5 baits declining the premise, with 3 of 5
inventions, two of which the story then canonized and built plot on. This is worse than the
issue's own reproduction, which described a single backfill.

The architecture is not the cause and cannot be the fix here. Re-entry condition is narrow
and now specific: find why the unrecorded-exchange section of the continuity contract is
empty on a bait whose text matches the detector's own claim regexes. The probe shows the
contract reaching the prompt with that section absent, so the fault is in assembly, upstream
of the model. Until that is answered, no further wording work on this issue is worth doing.

### What this matrix could not settle

- Whether momentum recovers under a shorter session. Every cell ran 30 or 45 continuous
  turns in one scene, which is the condition both judges identified as the cause.
- Whether the world-cost gain holds past 30 turns. The treatment arm was not run to 45.
- Whether the #1857 guard fires correctly on any bait shape. The probe shows one shape it
  misses; no bait shape was found that makes it fire.
