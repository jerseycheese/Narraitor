# Prompt/template eval log — ending open threads resolution (#1975)

- Change: inject open story threads from the world clock ledger into story ending generation behind the default-on `WORLD_CLOCK` feature flag (`NEXT_PUBLIC_FEATURE_WORLD_CLOCK`).
  - Treatment: default `WORLD_CLOCK=true`. When open threads exist, `prepareEndingTemplateVariables` appends the `OPEN STORY THREADS` section with thread kind, age, overdue marker, and resolution/anti-hallucination rules.
  - Control: `NEXT_PUBLIC_FEATURE_WORLD_CLOCK=false`. Passes `undefined` for `worldClock`, rendering no open threads block and maintaining byte-identical baseline prompt structure.
- Diff: `src/lib/promptTemplates/templates/endingOpenThreadsBlock.ts`, `src/lib/promptTemplates/templates/endingTemplates.ts`, `src/state/narrativeStore.endings.ts`, `src/types/narrative.types.ts`, `src/lib/promptTemplates/templates/narrative/worldClockBlock.ts`, plus tests.
- Base SHA: `839b8ec82e2ff434793dae9564c81b325a74a019`
- Date / evaluator: 2026-08-27, automated A/B evaluation session.
- Parent: #1822, #1869, #1966, #1972, #1974, #1976, issue #1975.

## Precommitted Protocol and Decision Rule

### Evaluated Matrix

Four cells evaluated with matched save checkpoints:
1. **Harrowgate Mills**: Fresh character (Wren Calloway) — civic drama / modern.
2. **Harrowgate Mills**: Established character (Wren Calloway, multi-turn session with open civic/developer threads).
3. **Camp Crystal Lake**: Fresh character (Jamie Holt) — horror / slasher.
4. **Camp Crystal Lake**: Established character (Jamie Holt, multi-turn survival session with open threat/camp threads).

### Sample Sizing

3 matched ending pairs per cell (1 treatment ending + 1 control ending per pair) = 6 endings per cell = 24 endings total across the 4 cells.

### Metrics & Evaluation Criteria

For each generated ending pair:
1. **Open Thread Accounting**: Count of open threads addressed (resolved or explicitly acknowledged as unresolved) vs total open threads in the checkpoint ledger.
2. **Epilogue Tone & Quality**: Does the text maintain authentic epilogue closure and narrative voice without devolving into a bullet-point checklist?
3. **Lore Integrity**: Are character accomplishments, legacy, and world impact supported by the session history/journal/threads without introducing hallucinations or unsupported lore?
4. **Prompt Delta Verification**: Confirm the exact prompt delta between treatment and control is strictly the `OPEN STORY THREADS` block.

### Decision Rule

A treatment pair wins when it accounts for more open threads while still reading like an epilogue and introducing no unsupported lore.

- **Cell improved**: Treatment wins at least two of three pairs.
- **Cell regressed**: Treatment becomes checklist-like, loses ending integrity, or adds unsupported lore in any material way.
- **SHIP / Retain**: At least three of four cells improve and none regress.
- **HOLD**: Anything else. Name the failing cell and concrete re-entry condition; don't tune wording inside this run.

Rollout outcome:
- **SHIP**: PR uses `Closes #1975`, retaining `WORLD_CLOCK=true` default.
- **HOLD**: PR uses `Refs #1975`, leaving the issue open without disabling broad `WORLD_CLOCK`.

## Coverage Matrix

| World (genre/tone) | Character (fresh/established) | Runs | Verdict | Representative excerpt (1-3 lines) |
|---|---|---|---|---|
| Harrowgate Mills (civic drama, dramatic) | Fresh (Wren Calloway) | 3 pairs (6 runs) | PENDING | PENDING |
| Harrowgate Mills (civic drama, dramatic) | Established (Wren Calloway) | 3 pairs (6 runs) | PENDING | PENDING |
| Camp Crystal Lake (slasher, mysterious, R) | Fresh (Jamie Holt) | 3 pairs (6 runs) | PENDING | PENDING |
| Camp Crystal Lake (slasher, mysterious, R) | Established (Jamie Holt) | 3 pairs (6 runs) | PENDING | PENDING |

## Arc check (>= 3 consecutive turns, one cell)
- Continuity vs loreStore facts / prior segments / inventory:
- Contradictions found:

## Failure drill
- Malformed/empty response path exercised how, result:
- Slow-response/timeout behavior:
- Missing/invalid key behavior:

## Regression vs prior good outputs
- Compared against: Control arm (flag off, same checkpoint save, same base commit `839b8ec82`).
- Old strengths preserved? Which weakened?

## Cost/latency
- Input token delta (approx):
- Latency delta (approx):

## Verdict
- Status: IN PROGRESS
