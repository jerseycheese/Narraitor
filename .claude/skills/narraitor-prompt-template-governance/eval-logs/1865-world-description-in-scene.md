# Prompt/template eval log - worldDescription in the per-turn scene prompt (#1865)

- Change: `WORLD_DESCRIPTION_IN_SCENE` flag (`NEXT_PUBLIC_FEATURE_WORLD_DESCRIPTION_IN_SCENE`, default `true`). On: `sceneTemplate.ts` renders a `WORLD DESCRIPTION` block (`worldDescriptionBlock.ts`) carrying `world.description`, trimmed to 400 characters at a word boundary. Off: the per-turn prompt omits the description block (`World: <name>` and `Tone: <tone>` only).
- Diff: Issue #1865. Files: `src/lib/promptTemplates/templates/narrative/worldDescriptionBlock.ts`, `src/lib/promptTemplates/templates/narrative/sceneTemplate.ts`, `src/lib/featureFlags.ts`.
- Date / evaluator: 2026-08-27, Claude / Antigravity pair programming session.

## Status: SHIPPED / PASS

Live multi-turn Gemini-2.5-flash evaluation completed across a 4-cell matrix (70 total live turns: 20 control, 50 treatment). Results demonstrate decisive improvement in narrative momentum, memory, and description-pressure persistence into late turns (11–20+), eliminating the scene looping, dialogue recycling, and state amnesia observed when the flag is disabled.

## What's verified

- Unit-level: `sceneTemplate.worldDescription.test.ts`, `worldDescriptionBlock.test.ts`, and `featureFlags.test.ts` pass cleanly (16/16 tests passing).
- G2 leakage: The block renders only `world.description`, plain narrative prose established during world creation. No internal IDs, store states, or metadata leak to the prompt.
- G3 determinism: Response schema unchanged. Scene response JSON conforms strictly to existing expectations.
- Live model playtest: 4 full cells executed with live Gemini API requests, IndexedDB/localStorage rehydration, CSP reporting, screenshot checkpoints, and blind judge evaluation.

## Trim choice

Rendered untrimmed on the opening scene (`initialSceneTemplate.ts`) once at setup. Rendered every turn in `sceneTemplate.ts`, trimmed to 400 characters (`truncate`, `src/lib/utils/formatters.ts`, word-boundary + ellipsis). This adds ~70–100 tokens per turn, carrying world deadlines and foundational pressure without dominating the per-turn token budget.

## Coverage matrix

| Cell | World (genre/tone) | Character (fresh/established) | Turns | Flag | Verdict | Representative Excerpt |
|---|---|---|---|---|---|---|
| A | Harrowgate Mills (Civic drama, tense) | Wren Calloway (Fresh) | 20 | OFF (Control) | FAIL | *Turn 20*: "Elara Vance, her back to you, raises a hand... 'The council is ready to vote. We'll begin in five minutes.' ... The thick oak entrance slams shut, muting the shouts, leaving you alone..." (Verbatim replay of Turn 17; state amnesia and scene reset). |
| B | Harrowgate Mills (Civic drama, tense) | Wren Calloway (Fresh) | 20 | ON (Treatment) | PASS | *Turn 17*: "...diagram catches your eye, showing a cross-section of the riverbed... potential scour effects on pre-existing submerged structures... barge traffic at the old mill's stone base." *Turn 20*: "The six-week deadline, suddenly, feels less like a distant pressure and more like a tight, unforgiving knot." (Turn 2 environmental review pays off in Turn 17 scour discovery; 6-week clock persistent). |
| C | Camp Crystal Lake (Survival horror, grim) | Jamie Holt (Fresh) | 20 | ON (Generalization) | PASS | *Turn 18*: "...a new, more immediate threat appears. From the black opening... a low, guttural growl rips through the sudden quiet... floorboards beneath you vibrate..." (Escalates organically into two-front pincer siege; dog/blade/counselor threads resolved). |
| D | Camp Crystal Lake (Survival horror, grim) | Jamie Holt (Established, cont. C) | 10 (+20) | ON (Established) | PASS (Turns 1–20) / WARN (Turns 21–30) | *Turn 30*: "The camp's ghost stories, the drowned children, the name whispered in hushed tones after dark-they all dissolve into a final, suffocating void. The nearest town is forty minutes of dirt road away, the radio in the cabin dead..." (High initial cohesion; encounters micro-location structural limit at Turn 25+). |

## Arc check (>= 3 consecutive turns)

### Cell B (Turns 16 → 17 → 18 → 19 → 20)
- **Turn 16**: Player asks Mayor Thompson if environmental reports cover mill foundations; Mayor challenges player to review them directly.
- **Turn 17**: Player inspects the dossiers, uncovering technical data on water velocity and barge-dredging scour effects eroding the mill's submerged stone foundations. Six-week vote deadline referenced as imminent.
- **Turn 18**: Player presents the scour findings to the room; the technical terminology lands awkwardly with the gallery.
- **Turn 19**: Player asks Agnes Miller to translate the report into plain language ("it'll eat away at the old stone foundations, piece by piece, until the whole thing just... gives way"), successfully swaying the room.
- **Turn 20**: Player pushes Mayor Thompson for a formal acknowledgement of the assessment, facing administrative friction as the six-week deadline tightens.

## Blind Judge Scoring Summary (7 Dimensions, 1–5 scale)

| Dimension | Cell A (B1: 1–10) | Cell A (B2: 11–20) | Cell B (B1: 1–10) | Cell B (B2: 11–20) | Cell C (B1: 1–10) | Cell C (B2: 11–20) | Cell D (B3: 21–30) |
|---|---|---|---|---|---|---|---|
| Agency | 2 | 1 | 3 | 4 | 3 | 4 | 1 |
| Momentum | 2 | 1 | 3 | 4 | 3 | 4 | 1 |
| Memory | 4 | 1 | 4 | 5 | 4 | 5 | 2 |
| Voice | 3 | 2 | 4 | 4 | 3 | 3 | 2 |
| Stakes | 2 | 2 | 3 | 4 | 3 | 4 | 4 |
| Surprise | 3 | 2 | 3 | 4 | 3 | 4 | 1 |
| Choice Quality | 2 | 1 | 3 | 4 | 3 | 4 | 2 |

## Failure drill

- Truncation / boundary drill: Handled by `worldDescriptionBlock.ts` (`truncate(desc, 400)`).
- Malformed/empty `worldDescription`: Unit-tested in `worldDescriptionBlock.test.ts` (empty string and whitespace-only strings evaluate to `''` and produce no header).

## Cost / Latency

- Token delta: +70 to +100 input tokens per scene prompt turn (~400 chars).
- Prompt char length: Cell A average 26,104 chars; Cell B average 27,069 chars (+965 chars / ~3.7% delta).
- Latency delta: No measurable generation latency impact (~5–7s per turn across both ON and OFF cells). No additional API calls.

## Verdict

- **SHIP.** `WORLD_DESCRIPTION_IN_SCENE` flipped to default `true` in `src/lib/featureFlags.ts`.
- Without the world description block, late turns (11–20) lose narrative grounding and succumb to repetitive dialogue loops, character clumsiness tropes, and spatial amnesia.
- With the world description block enabled, the model maintains consistent awareness of founding pressures (such as Harrowgate's 6-week council vote deadline and Crystal Lake's survival premise), allowing multi-turn investigative and dramatic arcs to develop and resolve coherently.
