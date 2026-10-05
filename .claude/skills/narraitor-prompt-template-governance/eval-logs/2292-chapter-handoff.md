# Prompt/template eval log — chapter hand-off boundary beat, recap, and recap prompt slot (#2292)

- Change: Introduce CHAPTERS feature flag (`NEXT_PUBLIC_FEATURE_CHAPTERS`, default off); route story checkpoint prompt generation through registered template `narrative/storyCheckpoint`; add chapter boundary instructions and recap prompt slot `chapterBlock` in `initialSceneTemplate` and `sceneTemplate`; provide chapter recap mode in checkpoint route and generator with <= 850 character 5-line structure.
- Diff: `src/lib/featureFlags.ts`, `.env.example`, `src/lib/promptTemplates/templates/narrative/context.ts`, `src/lib/promptTemplates/templates/narrative/chapterBlock.ts`, `src/lib/promptTemplates/templates/narrative/storyCheckpointTemplate.ts`, `src/lib/promptTemplates/templates/narrative/initialSceneTemplate.ts`, `src/lib/promptTemplates/templates/narrative/sceneTemplate.ts`, `src/lib/promptTemplates/templates/narrative/index.ts`, `src/lib/ai/storyCheckpointGenerator.ts`, `src/app/api/narrative/story-checkpoint/route.ts`, `src/lib/narrative/chapters.ts`, `src/lib/narrative/chapterCheckpoint.ts`, `src/components/Narrative/ChapterHandoffPrompt.tsx`, `src/components/Narrative/SessionBreakPrompt.tsx`, plus tests.
- Date / evaluator: 2026-10-05, prompt governance and isolation evaluation.
- Parent: #2265 [EPIC] 10-turn chapters with recap hand-off; issue #2292.

## Governance Gates (narraitor-prompt-template-governance)

### G1: Input Contract
- `NarrativeTemplateContext` in `src/lib/promptTemplates/templates/narrative/context.ts` explicitly extended with:
  - `chapter?: Omit<ChapterContext, 'recentSegments'>`
  - `checkpoint?: StoryCheckpointRequestBody`
  - `checkpointToneInstructions?: string`
- No data is smuggled through existing string fields.

### G2: Leakage
- Chapter context exposes only `number`, `isOpening`, `isEnding`, and `recap`.
- Checkpoint payload sanitizes cast, holding, and open threads to safe trimmed strings with length caps.
- Hidden meta state, raw store internals, and player secrets are not exposed to prompts.

### G3: Determinism Expectations
- Flag-off behavior is strictly byte-identical to `origin/develop` across all templates (`initialSceneTemplate`, `sceneTemplate`, and checkpoint prompt).
- Chapter recap response structure requires strict 5-line labeled format (`Previously:`, `Where it stopped:`, `Cast:`, `Holding:`, `Open threads:`) under 850 characters.
- Non-conforming or failed responses fall back deterministically to recorded canon via `fallbackChapterRecap` without repeating generation calls.

### G4: Evaluation Matrix
- Live output narrative quality and matrix evaluation is explicitly deferred to parent epic #2265 per issue specification.
- Prompt byte-isolation and assembly are fully verified in regression tests:
  - `src/lib/promptTemplates/templates/narrative/__tests__/chapters.test.ts`
  - `src/app/api/narrative/story-checkpoint/__tests__/route.test.ts`
  - `src/lib/ai/__tests__/storyCheckpointGenerator.test.ts`

### G5: Regression
- Verified byte-identical output with `CHAPTERS=false` against `origin/develop` base across genres (noir, fantasy) and character states (fresh, established):
  - `initialSceneTemplate`: 0 byte difference.
  - `sceneTemplate`: 0 byte difference.
  - `storyCheckpoint`: 0 byte difference.
- Character backstory slot in `initialSceneTemplate` and `sceneTemplate` is preserved alongside the dedicated recap slot.

### G6: Cost / Latency
- Token impact measured via `estimateTokenCount` (`/tmp/chapter-prompt-evidence.cjs`):
  - `initialSceneTemplate` (noir / fresh): 1453 tokens off -> 1556 tokens on (+103 tokens delta)
  - `initialSceneTemplate` (noir / established): 1465 tokens off -> 1568 tokens on (+103 tokens delta)
  - `initialSceneTemplate` (fantasy / fresh): 1453 tokens off -> 1556 tokens on (+103 tokens delta)
  - `initialSceneTemplate` (fantasy / established): 1465 tokens off -> 1568 tokens on (+103 tokens delta)
  - `sceneTemplate` (noir / fresh): 1736 tokens off -> 1839 tokens on (+103 tokens delta)
  - `sceneTemplate` (noir / established): 1761 tokens off -> 1864 tokens on (+103 tokens delta)
  - `sceneTemplate` (fantasy / fresh): 1736 tokens off -> 1839 tokens on (+103 tokens delta)
  - `sceneTemplate` (fantasy / established): 1761 tokens off -> 1864 tokens on (+103 tokens delta)
  - `storyCheckpointTemplate`: 544 tokens (recap mode).
- Recap size bound to <= 850 characters keeps subsequent chapter prompt expansion tightly bounded.

### G7: Integration
- Unit and integration tests passing:
  - `src/lib/narrative/__tests__/chapters.test.ts`
  - `src/lib/narrative/__tests__/chapterCheckpoint.test.ts`
  - `src/lib/narrative/__tests__/turnResolver.test.ts`
  - `src/components/Narrative/__tests__/ChapterHandoffPrompt.test.tsx`
  - `src/components/Narrative/__tests__/SessionBreakPrompt.test.tsx`
  - `src/app/api/narrative/story-checkpoint/__tests__/route.test.ts`
  - `src/lib/ai/__tests__/storyCheckpointGenerator.test.ts`

## Verdict
- Flag-off isolation and contract integrity verified. Quality evaluation deferred to #2265.
