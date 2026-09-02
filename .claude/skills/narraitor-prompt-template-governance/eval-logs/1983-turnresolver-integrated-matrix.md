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

## Results

Pending. Filled in after the sessions run.

## Verdict

Pending.
