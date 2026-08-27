# Ship/hold memo — worldDescription in the per-turn scene prompt (#1865)

- Issue: #1865
- Class: AI-behavior (prompt template), behind build-time flag `WORLD_DESCRIPTION_IN_SCENE` (`NEXT_PUBLIC_FEATURE_WORLD_DESCRIPTION_IN_SCENE`)
- Acceptance criteria (from issue, verbatim): Render `worldDescription` (truncated to 400 chars) in every turn's scene prompt so contextual pressure (like Harrowgate's "the council votes in six weeks") persists across 20+ turns. Measured via description-pressure persistence and 7-dimension blind rubric scoring vs. flag-off control.
- Declared eval matrix (AI experiments):
  - Cell A: Harrowgate Mills fresh (Wren Calloway), 20 turns flag OFF (Control)
  - Cell B: Harrowgate Mills fresh (Wren Calloway), 20 turns flag ON (Treatment)
  - Cell C: Camp Crystal Lake fresh (Jamie Holt), 20 turns flag ON (Generalization)
  - Cell D: Camp Crystal Lake established (Jamie Holt, continue C), 10 turns flag ON (Established)
  - Independent blind judges on `.claude/skills/narraitor-playtest-loop/rubric.md`.

## Gate results

| Gate | Result | Artifact |
|---|---|---|
| Quality gate (test/type/lint/lint:css) | PASS: jest unit suites exit 0; `tsc --noEmit` exit 0; eslint exit 0; stylelint exit 0 | Test runs |
| Class-specific gates (prompt governance G1-G3, G6, G7) | PASS: Input contract via `NarrativeContext.worldDescription`, zero leakage of internal store state, scene JSON response schema unchanged, ~70–100 input tokens per turn, zero additional API calls, live loop across both flag states | `.claude/skills/narraitor-prompt-template-governance/eval-logs/1865-world-description-in-scene.md` |
| Parity ladder rung reached | S3: Live `/worlds/[id]/play` loop against live Gemini 2.5 Flash on both flag states (70 total live turns: 20 control, 50 treatment) | `artifacts/playtests/cell-*-transcript.md` |
| Fresh-state walk (P8) | PASS: Harrowgate and Crystal Lake seeded into clean IndexedDB and localStorage stores in fresh browser contexts; sessions verified with real network generation POSTs and journal updates | `scripts/playtest-runner.mjs` |
| Eval matrix (AI) | Decisive win for flag ON. Block 2 (Turns 11–20) Harrowgate: Agency 1 -> 4, Momentum 1 -> 4, Memory 1 -> 5, Stakes 2 -> 4, Surprise 2 -> 4, Choice Quality 1 -> 4. Crystal Lake: Block 2 Agency 4, Momentum 4, Memory 5, Stakes 4. | `.claude/skills/narraitor-prompt-template-governance/eval-logs/1865-world-description-in-scene.md` |

## Decision

- **SHIP.** Flip `WORLD_DESCRIPTION_IN_SCENE` to default `true` in `src/lib/featureFlags.ts`.
- The mechanism successfully resolves the core problem identified in #1865: with the flag off, the model forgets founding world constraints by turn 10, resulting in verbatim dialogue loops and state amnesia by turn 20. With the flag enabled, founding deadlines and contextual pressures remain vivid, grounding multi-turn investigative and dramatic arcs across the entire session.
- Token cost is minimal (~70–100 tokens per turn at the 400-character boundary cap) with zero added latency or extra API calls.

## Residual risk

- 400-character boundary truncation: Highly complex world descriptions with pressure statements located past the 400-char mark may get clipped. World creators should ensure critical deadlines are placed in opening sentences.
- Extended micro-location saturation: In Cell D (Turns 21–30), staying confined inside a single small cabin across 30 consecutive turns led the model to recycle sensory tropes despite the world description anchor. This is a pacing/location constraint rather than a prompt regression.
