# Prompt/template eval log - worldDescription in the per-turn scene prompt (#1865)

- Change: one variable, the `WORLD_DESCRIPTION_IN_SCENE` flag (`NEXT_PUBLIC_FEATURE_WORLD_DESCRIPTION_IN_SCENE`, default off). On: `sceneTemplate.ts` renders a `WORLD DESCRIPTION` block (`worldDescriptionBlock.ts`) carrying `world.description`, trimmed to 400 characters at a word boundary. Off: the per-turn prompt is byte-for-byte what it was — `World: <name>` and `Tone: <tone>`, no description.
- Diff: this PR. Files: `src/lib/promptTemplates/templates/narrative/worldDescriptionBlock.ts` (new), `sceneTemplate.ts` (one import, one flag check, one insertion), `src/lib/featureFlags.ts` (flag registration).
- Date / evaluator: 2026-08-24, Claude (build session in worktree `issue-1865`).

## Status: UNMEASURED

**No before/after playtest has been run.** This lane has no way to run one: the eval needs a live multi-turn Gemini session against a real provider key and a world whose description carries a deadline (Harrowgate Mills' council vote is the obvious pick, per the issue), and this worktree has no path to drive that. Everything below states what exists, not what it does to play.

Do not read this log as evidence the change helps. It is not evidence either way. The mechanism is wired, gated off, and ready to be measured against `narraitor-ai-quality-discipline`'s coverage matrix (>= 2 worlds x >= 2 characters x 3 runs, arc check over >= 3 consecutive turns, verdict logged back to this file) once a session with a live key can run it.

## What's verified without a live model

- Unit-level: `sceneTemplate.worldDescription.test.ts` and `worldDescriptionBlock.test.ts` confirm the block appears in the assembled prompt only when the flag is on and `worldDescription` is present, is absent when the flag is off (default), and is absent when the flag is on but the field is empty. A long description is confirmed trimmed at a word boundary with an ellipsis rather than rendered in full.
- `featureFlags.test.ts` confirms `WORLD_DESCRIPTION_IN_SCENE` defaults to `false` and turns on only for the exact string `"true"` (same default-off convention as `WORLD_COST`).
- G2 leakage: the block renders only `world.description`, plain prose the player already saw in the wizard and the opening scene. No ids, no store internals.
- G3 determinism: no response schema change. The scene response JSON is untouched.

## Trim choice

Rendered untrimmed, once, on the opening scene (`initialSceneTemplate.ts`) that cost is paid a single time. Rendered every turn, it's paid every turn for the life of the session, and a world's free-text description has no upstream length cap. `worldDescriptionBlock` trims to 400 characters (`truncate`, `src/lib/utils/formatters.ts`, word-boundary + ellipsis, the same helper `inventoryContextBuilder.ts` uses for item descriptions) — roughly 100 tokens at ~4 chars/token, enough to carry a sentence or two including whatever pressure clause the description opens with, without letting an unusually long description dominate every turn's token budget. Not measured against a token-cost target; a reasonable default pending the playtest.

## Coverage matrix

| World (genre/tone) | Character (fresh/established) | Runs | Verdict | Representative excerpt |
|---|---|---|---|---|
| (not run) | (not run) | 0 | UNMEASURED | n/a |
| (not run) | (not run) | 0 | UNMEASURED | n/a |

## Arc check (>= 3 consecutive turns, one cell)
- Not run.

## Failure drill
- Not run. Malformed/empty `worldDescription` (empty string, whitespace-only) is covered at the unit level (`worldDescriptionBlock.test.ts` — both render to `''`), not at the live-model level.

## Regression vs prior good outputs
- Not applicable — no live generations exist to compare.

## Cost/latency
- Token delta: estimated, not measured. At the 400-char cap, roughly +100 input tokens per turn when the flag is on (same rough char/token ratio the world-clock eval log used). No new API call — the block folds into the existing scene prompt.

## Verdict
- **UNMEASURED.** The mechanism exists, is unit-tested, and is flagged off by default. Whether it changes play — or does anything besides cost tokens — is the open question the issue names, and it stays open until a session with a live provider key runs the coverage matrix above.
- Ship/hold decision: not made. Recommend keeping #1865 open (not closed by this PR) until the playtest referenced above runs and this log is filled in with a real verdict.
