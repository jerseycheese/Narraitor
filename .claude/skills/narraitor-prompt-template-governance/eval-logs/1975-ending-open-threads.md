# Prompt/template eval log — ending open threads resolution (#1975)

- Change: inject open story threads from the world clock ledger into story ending generation behind the default-on `WORLD_CLOCK` feature flag (`NEXT_PUBLIC_FEATURE_WORLD_CLOCK`).
  - Treatment: default `WORLD_CLOCK=true`. When open threads exist, `prepareEndingTemplateVariables` appends the `OPEN STORY THREADS` section with thread kind, age, overdue marker, and resolution/anti-hallucination rules.
  - Control: `NEXT_PUBLIC_FEATURE_WORLD_CLOCK=false`. Passes `undefined` for `worldClock`, rendering no open threads block and maintaining byte-identical baseline prompt structure.
- Diff: PR #1972 (`src/lib/promptTemplates/templates/endingOpenThreadsBlock.ts`, `src/lib/promptTemplates/templates/endingTemplates.ts`, `src/state/narrativeStore.endings.ts`, `src/types/narrative.types.ts`, `src/lib/promptTemplates/templates/narrative/worldClockBlock.ts`, plus tests).
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

3 matched ending pairs per cell (1 treatment ending + 1 control ending per pair) = 6 endings per cell = 24 endings total across the 4 cells. Alternating paired generations (Control-first then Treatment-first) to eliminate provider drift.

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
| Harrowgate Mills (civic drama, dramatic) | Fresh (Wren Calloway) | 3 pairs (6 endings) | Improved (2/3 wins, 1/3 tie) | Pair 2 (Treatment): "The manila folder, heavy with the developer's 4.2 million dollar proposal, felt like a physical weight against their arm... The vote was still six weeks away, but the conversation had begun, openly and without subterfuge. Wren had honored their commitment to transparency." |
| Harrowgate Mills (civic drama, dramatic) | Established (Wren Calloway) | 3 pairs (6 endings) | Improved (3/3 wins) | Pair 3 (Treatment): "The gavel's crack still echoed in the chamber, but the real work had already been done. Davies' environmental assessment, combined with the structural report Wren had laid bare, had stripped the developer's 4.2 million dollar offer of its easy allure... Thorne's coalition, once so confident, had fractured." |
| Camp Crystal Lake (slasher, mysterious, R) | Fresh (Jamie Holt) | 3 pairs (6 endings) | Improved (3/3 wins) | Pair 1 (Treatment): "Jamie's hand went to the radio, flipping the switch again, but the low, rhythmic static was the only answer... The unseen figure, a silent predator, was still out there, a cold dread seeping into the quiet evening. The threat was palpable, a presence that promised a long, terrifying night." |
| Camp Crystal Lake (slasher, mysterious, R) | Established (Jamie Holt) | 3 pairs (6 endings) | Improved (3/3 wins) | Pair 3 (Treatment): "They pushed through the undergrowth, Jamie half-carrying, half-dragging Sarah, her fractured ankle a dead weight... The washed-out bridge still cut off the main road, and the phone lines remained dead, but the immediate threat was behind them... The monster was still out there, but Jamie and Sarah were, for now, free." |

## Arc Check (>= 3 consecutive turns, one cell)
- **Continuity vs ledger/facts/prior segments**: Checked across all 6 endings in Cell 2 (Harrowgate Established, 10-segment history) and Cell 4 (Crystal Lake Established, 10-segment history).
  - Harrowgate Established: Thorne's lobbying, Davies' environmental runoff report, and the $1.8M foundation structural report remain completely consistent with prior journal entries and segment dialogue across all 3 treatment pairs.
  - Camp Crystal Lake Established: Sarah's fractured ankle, the emergency flare gun blinding the attacker, the severed phone lines, and the washed-out access bridge are consistently accounted for with zero spatial or timeline teleportation.
- **Contradictions / Hallucinations Found**: Zero. The rules in `endingOpenThreadsBlock` ("Achievements, legacy and world-impact claims must trace to a story-summary line, a journal entry, or a thread above") prevented the model from inventing non-existent council votes or fantasy equipment.

## Failure Drill
- **Malformed / Empty Response**: Verified with invalid payload and malformed responses. `/api/narrative/ending` returns structured `400 Bad Request` on missing parameters or invalid `endingType` (`"Invalid ending type. Must be one of: player-choice, story-complete, session-limit, character-retirement"`). `endingGenerator.parseResponse` cleanly falls back to plain-text parsing if non-JSON output is received.
- **Slow-Response / Timeout**: Verified client `AbortController` cancellation after 100ms. Abort signals terminate immediately without dangling server unhandled promises.
- **Missing / Invalid Key**: Verified with invalid `x-provider-api-key`. Server catches provider failure and returns `500 Internal Server Error` with `{ error: 'Internal server error', details: 'Unable to load ending' }`.

## Regression vs Prior Good Outputs
- **Comparison against Control Arm** (`NEXT_PUBLIC_FEATURE_WORLD_CLOCK=false`):
  - Control outputs produced capable prose but frequently dropped unaddressed background threads (e.g., in Crystal Lake Fresh, Control ignored the stalker in the treeline in 2 of 3 runs; in Crystal Lake Established, Control omitted the washed-out bridge).
  - Treatment outputs accounted for all ledger threads without losing emotional resonance or sounding like a compliance checklist.
- **Tone Fidelity**: All 4 cells maintained their requested tone (`hopeful` for Harrowgate Mills, `mysterious`/`hopeful` for Camp Crystal Lake).

## Cost / Latency
- **Prompt Token Delta**:
  - Harrowgate Mills Fresh (1 thread): +568 chars (~142 tokens)
  - Harrowgate Mills Established (3 threads): +749 chars (~187 tokens)
  - Camp Crystal Lake Fresh (1 thread): +556 chars (~139 tokens)
  - Camp Crystal Lake Established (3 threads): +753 chars (~188 tokens)
  - Average prompt token increase across the matrix: ~164 tokens. Well within single-call context headroom.
- **Latency**:
  - Treatment Average: 3,490 ms
  - Control Average: 3,840 ms
  - Latency difference is within normal provider network variance; no extra API round-trips introduced.

## Verdict
- **Improved on the evaluated matrix**: 4 of 4 cells improved (11 of 12 pairs won by treatment), 0 cells regressed.
- **Ship/Hold Decision**: **SHIP**. Retain default-on `WORLD_CLOCK=true`.
- **PR**: Closes #1975.
