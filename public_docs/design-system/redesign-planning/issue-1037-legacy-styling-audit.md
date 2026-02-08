# Issue #1037 Legacy Styling Audit

- Part of #1020
- Implements #1037
- Feeds #1038
- Last updated: 2026-02-08

## Inventory baseline captures

### Global gray footprint (repo-wide context for #1032)

```text
gray-token-occur=1148
gray-token-files=150
```

### Game-session component candidate set (`src/components/GameSession`)

```text
src/components/GameSession/ActiveGameSessionChoicesColumn.tsx
src/components/GameSession/GameSessionSkeleton.tsx
src/components/GameSession/GameSession.tsx
src/components/GameSession/EndingSuggestionBanner.stories.tsx
src/components/GameSession/hooks/useActiveGameSessionEffects.ts
src/components/GameSession/hooks/useGameSessionState.ts
src/components/GameSession/hooks/useActiveGameSessionJournal.ts
src/components/GameSession/hooks/useActiveGameSessionEffects.test.ts
src/components/GameSession/hooks/__tests__/useActiveGameSessionActions.test.ts
src/components/GameSession/hooks/useActiveGameSessionActions.ts
src/components/GameSession/hooks/useActiveGameSessionEnding.ts
src/components/GameSession/hooks/useStoryCheckpointManager.ts
src/components/GameSession/hooks/useGameSessionState.test.ts
src/components/GameSession/GameSessionResume.tsx
src/components/GameSession/__tests__/ActiveGameSessionNarrativeColumn.test.tsx
src/components/GameSession/__tests__/EndingScreen.yourStory.test.tsx
src/components/GameSession/__tests__/SessionBoundaryLogging.sessionEnd.test.tsx
src/components/GameSession/__tests__/ActiveGameSessionChoicesColumn.test.tsx
src/components/GameSession/__tests__/ChoiceHistorySection.test.tsx
src/components/GameSession/__tests__/StorySummarySection.test.tsx
src/components/GameSession/__tests__/SessionBoundaryLogging.testHelpers.tsx
src/components/GameSession/__tests__/SessionBoundaryLogging.lifecycle.test.tsx
src/components/GameSession/__tests__/CharacterSummary.test.tsx
src/components/GameSession/__tests__/EndingSuggestionBanner.test.tsx
src/components/GameSession/__tests__/README.session-boundary-logging-tests.md
src/components/GameSession/__tests__/ActiveGameSessionControls.test.tsx
src/components/GameSession/__tests__/SessionBoundaryLogging.sessionStart.test.tsx
src/components/GameSession/EndingSuggestionBanner.tsx
src/components/GameSession/README.md
src/components/GameSession/ActiveGameSessionNarrativeColumn.tsx
src/components/GameSession/EndingScreen.tsx
src/components/GameSession/SessionControls.tsx
src/components/GameSession/ChoiceHistorySection.tsx
src/components/GameSession/CharacterSummary.tsx
src/components/GameSession/GameSessionError.tsx
src/components/GameSession/ActiveGameSessionControls.tsx
src/components/GameSession/ActiveGameSession.tsx
src/components/GameSession/GameSessionLoading.tsx
src/components/GameSession/StorySummarySection.tsx
src/components/GameSession/GameSessionConfirmationDialog.tsx
```

### Per-file gray counts for key game-session surfaces

| File | `gray-*` count |
| --- | ---: |
| `src/components/GameSession/ActiveGameSession.tsx` | 0 |
| `src/components/GameSession/ActiveGameSessionNarrativeColumn.tsx` | 0 |
| `src/components/GameSession/ActiveGameSessionChoicesColumn.tsx` | 6 |
| `src/components/GameSession/CharacterSummary.tsx` | 13 |
| `src/components/GameSession/GameSessionSkeleton.tsx` | 6 |

### Broad `globals.css` styling hit list

| Category | Source hits |
| --- | --- |
| Narrative scroll rules | `scroll-snap-type` at line 8 |
| Narrative typography overrides | `.narrative-content*` at lines 18, 25, 29, 33, 39, 44, 49 |
| Base layer blocks | `@layer base` at lines 54 and 222 |
| Ending tone classes | `.ending-*` at lines 200, 204, 208, 212, 216 |
| Link utility classes | `.text-link-*` at lines 259, 263, 267, 271, 276 |
| Space utilities | `.space-y-*` at lines 300, 304, 308, 313, 317, 321 |
| Component layer | `@layer components` at line 326 with `.card`, `.btn`, `.btn-primary` |
| Devtools block | `.devtools-panel*` at lines 358, 364-369, 376, 382, 392 |
| Utility layer | `@layer utilities` at line 397 |

### Storybook baseline for audited surfaces

```text
src/stories/05-pages/game-session/EndingScreen.stories.tsx
src/stories/05-pages/game-session/GameSessionLoading.stories.tsx
src/stories/05-pages/game-session/ActiveGameSession.stories.tsx
src/stories/05-pages/game-session/GameSessionError.stories.tsx
src/stories/00-foundation/DesignTokens.stories.tsx
src/stories/00-foundation/DesignSystemShowcase.stories.tsx
src/stories/03-organisms/narrative/display/NarrativeDisplay.stories.tsx
src/stories/03-organisms/narrative/display/LoreViewer.stories.tsx
src/stories/03-organisms/narrative/display/NarrativeHistory.stories.tsx
src/stories/03-organisms/narrative/core/Narrative.stories.tsx
src/stories/03-organisms/character/display/CharacterDetailsDisplay.stories.tsx
src/stories/03-organisms/character/display/CharacterCard.stories.tsx
src/stories/03-organisms/character/display/CharacterHeader.stories.tsx
src/stories/03-organisms/character/display/CharacterSummary.stories.tsx
src/stories/03-organisms/narrative/controls/NarrativeController.stories.tsx
src/stories/03-organisms/narrative/controls/ChoiceSelector.stories.tsx
```

Baseline story gaps recorded for this audit:
- `src/components/GameSession/GameSessionSkeleton.tsx` has no dedicated story.
- `src/components/GameSession/ActiveGameSessionNarrativeColumn.tsx` and `src/components/GameSession/ActiveGameSessionChoicesColumn.tsx` have no direct stories and are currently covered only through `ActiveGameSession` page stories.

## Scope and required surfaces

This audit is a decision artifact, not a production refactor. It inventories all styling sources currently coupled to game-session rendering and assigns a candidate action (`keep baseline`, `remove in #1038`, or `defer to migration issue`).

Required surfaces in this artifact:
- TS token layer: `src/lib/design-tokens/tokens/primitives.ts`, `src/lib/design-tokens/tokens/semantic.ts`, `src/lib/design-tokens/tokens/contextual.ts`, `tailwind.config.ts`
- CSS variables and global styles: `src/app/globals.css`
- Game-session component layer: `src/components/GameSession/ActiveGameSession.tsx`, `src/components/GameSession/ActiveGameSessionNarrativeColumn.tsx`, `src/components/GameSession/ActiveGameSessionChoicesColumn.tsx`, `src/components/GameSession/CharacterSummary.tsx`, `src/components/GameSession/GameSessionSkeleton.tsx`
- Storybook contract layer: `src/stories/00-foundation/*`, `src/stories/05-pages/game-session/*`, `src/stories/03-organisms/character/display/CharacterSummary.stories.tsx`

## In scope

- Game-session styling surfaces and shared layers that directly affect game-session rendering.
- Gray-to-zinc mapping implications across TS primitives, CSS variables/global rules, and direct component class usage.
- Legacy globals decisioning for link utilities, card/button helpers, narrative overrides, and supporting utilities.
- Storybook surface mapping for audited files so #1038 removals have explicit story actions.

## Not in scope

- Wizard/library/settings page markup and page-specific styling, unless a shared global rule couples those pages to game-session behavior.
- Applying production code changes for token migration or layout migration (execution belongs to #1032, #1034, #1038).
- Feature-flag design details (tracked in #1039; this artifact only records dependency requirements).

## Adjacent risks

- `src/components/shared/wizard/styles/wizardStyles.ts` may overlap with shared card/gray conventions and could reintroduce legacy gray usage post-cutover if not audited in the broader prep scope (`#1046`).
- `src/app/globals.css` shared classes (`.card`, `.btn`, `.text-link-*`, `.space-y-*`) are cross-domain and can create regressions outside game session if removals are not scoped by replacement readiness.

Storybook contract note for migration boundaries:
- Any surface changed in #1038 or later migration tickets must update corresponding stories in the same PR.
- `npm run build-storybook` is a migration gate.
- Landing strategy decision: **Option A** (land `migration-plan.md` Storybook contract updates in the #1037 PR so scope and execution expectations are explicit before #1038 starts).

## TS primitives layer findings

Pattern used for counts: `gray:\s*\{|primitiveColors\.gray|colors\.gray|neutral:\s*primitiveColors\.gray`

| File | Gray reference count | Current gray usage | Zinc migration intent | Candidate decision | Owner issue |
| --- | ---: | --- | --- | --- | --- |
| `src/lib/design-tokens/tokens/primitives.ts` | 1 | Defines canonical `primitiveColors.gray` scale (100/300/500/700/900). | Replace gray palette values with zinc equivalents during token migration pass. | Defer to migration issue. | #1032 |
| `src/lib/design-tokens/tokens/semantic.ts` | 52 | Semantic surfaces and dark variants depend heavily on `primitiveColors.gray`. | Rebind semantic neutrals to zinc-backed primitives; preserve semantic API shape. | Defer to migration issue. | #1032 |
| `src/lib/design-tokens/tokens/contextual.ts` | 2 | `endingTones.mysterious` uses gray background/border values. | Align mysterious tone to zinc-era neutral mapping while preserving narrative tone semantics. | Defer to migration issue. | #1032 |
| `tailwind.config.ts` | 25 | Exposes `gray` and `neutral` from primitives; typography plugin prose colors use gray extensively. | Update generated utility/prose neutral paths to zinc-backed primitives. | Defer to migration issue. | #1032 |

Coverage check:
- TS layer hit categories (`primitiveColors.gray`, `colors.gray`, `neutral`) map directly to this table with an owner issue for every file.

## CSS variables + globals findings

| Source area | Current behavior | Gray/zinc implication | Candidate decision | Owner issue |
| --- | --- | --- | --- | --- |
| `@layer base` root + dark CSS variables (`src/app/globals.css`) | Shadcn variable layer carries gray-era neutrals (`--secondary`, comments and mappings to gray family). | Requires synchronized zinc shift with TS primitives to prevent utility vs CSS-variable mismatch. | Defer to migration issue. | #1032 |
| `@layer base` link defaults (`a`, `.prose a`, `p a`, `li a`, `span a`) | Global link behavior is applied broadly and partly duplicated by utility classes. | Not specifically gray-bound but overlaps with link utility system and can conflict during migration. | Keep baseline for #1038; consolidate in migration pass. | #1034 |
| `.text-link-primary`, `.text-link-secondary`, `.text-link-nav`, `.text-link-nav-dark` | Legacy utility class family in global CSS; includes explicit gray/blue coupling. | Gray-specific nav-dark and secondary styles are part of neutral migration surface. | Remove in #1038 (replace by tokenized component patterns). | #1038 |
| `.narrative-content*` block | Forces `system-ui`, justification, and segment-specific formatting in global CSS. | Conflicts with target narrative typography direction (Mechanical Manuscript serif emphasis). | Remove in #1038 (reintroduced only where needed via scoped components). | #1038 |
| Narrative scroll snap (`.narrative-history-container [data-radix-scroll-area-viewport]`) | Global scroll-snap and smooth scroll behavior for narrative viewport. | Must be reconciled with buffered streaming/anchoring behavior. | Defer to migration issue. | #1033 |
| `.ending-*` classes | Global ending tone classes map to ending CSS variables. | `mysterious` currently gray-driven; other tones non-gray. | Keep baseline in #1038; retune values in #1032. | #1032 |
| `@layer components` `.card`, `.btn`, `.btn-primary` | Legacy component helper classes duplicate shadcn component responsibility. | Gray border and blue button defaults create parallel styling system. | Remove in #1038. | #1038 |
| `.space-y-*` utility redefinitions | Explicit margin stack utilities replicated in globals. | Not directly gray-dependent, but duplicates framework utility behavior and increases coupling. | Remove in #1038 after validating no remaining call sites depend on custom override behavior. | #1038 |
| `.devtools-panel*` block | Out-of-layer devtools styling with gray-heavy palette. | Gray-specific but non-player-facing; can remain until devtools migration path is planned. | Defer to migration issue. | #1046 |
| `@layer utilities` custom animation and touch utilities | Non-color utility helpers (`slide-up`, `fade-in`, touch helpers). | No direct gray/zinc dependency. | Keep baseline. | #1038 |

Source-to-table coverage check categories mapped:
- `scroll-snap-type`, `.narrative-content`, `.text-link-*`, `.ending-*`, `.btn`, `.card`, `@layer base`, `@layer components`, `@layer utilities`, `.devtools-panel`, `.space-y-*`

### Foundation-story impact notes

- `src/stories/00-foundation/DesignTokens.stories.tsx`
  - Impact: direct gray token visualization depends on `primitiveColors.gray` and semantic neutrals.
  - Expected update timing: primarily #1032.
  - #1037 action: annotate dependency only.
- `src/stories/00-foundation/DesignSystemShowcase.stories.tsx`
  - Impact: showcase examples include token-driven neutrals and at least one hardcoded blue button instance.
  - Expected update timing: primarily #1032 (token shift) and #1034 (surface polish).
  - #1037 action: annotate dependency only.

## Component-level findings

Pattern coverage used: `narrativeMaxHeight|lg:flex-row|bg-gray-|border-gray-|text-gray-`

| Component | Gray count | Legacy pattern | Problem statement | Candidate decision | Owner issue |
| --- | ---: | --- | --- | --- | --- |
| `src/components/GameSession/ActiveGameSession.tsx` | 0 | `lg:flex-row` two-column shell, `narrativeMaxHeight` propagation | Layout shell and max-height cap conflict with manuscript-first composition target. | Defer to migration issue. | #1034 |
| `src/components/GameSession/ActiveGameSessionNarrativeColumn.tsx` | 0 | `narrativeMaxHeight` style override | Hard cap makes narrative viewport behavior coupled to legacy two-column affordance. | Remove in #1034. | #1034 |
| `src/components/GameSession/ActiveGameSessionChoicesColumn.tsx` | 6 | Gray skeleton classes (`bg-gray-*`, `border-gray-*`) | Loading skeleton styling is hardcoded to gray utility chain instead of semantic tokens. | Defer to migration issue. | #1032/#1034 |
| `src/components/GameSession/CharacterSummary.tsx` | 13 | Gray-heavy card/text/border styles | Character panel is visually coupled to old neutral scale and legacy link utility class. | Defer to migration issue. | #1032/#1034 |
| `src/components/GameSession/GameSessionSkeleton.tsx` | 6 | `lg:flex-row` shell + gray skeleton classes | Skeleton duplicates old page layout and gray utility chain; should follow migrated layout/token system. | Defer to migration issue. | #1032/#1034 |

Required one-off pattern classifications:
- `narrativeMaxHeight` constraint pattern: remove in #1034.
- Two-column shell classes (`flex flex-col lg:flex-row ...`): replace in #1034.
- Gray skeleton classes in choice/loading shells: migrate in #1032/#1034.
- `CharacterSummary` gray-heavy surface: migrate in #1032/#1034.
- `GameSessionSkeleton` gray-heavy surface: migrate in #1032/#1034.

Component source-to-table coverage check:
- All hits for `narrativeMaxHeight`, `lg:flex-row`, `bg-gray-*`, `border-gray-*`, `text-gray-*` are represented above with explicit owner issues.

## Keep/remove/defer decision rubric

- `keep baseline`: keep as-is for clean-slate baseline because it is either non-problematic or required to avoid breaking unrelated areas before migration work lands.
- `remove in #1038`: remove as part of clean-slate cutover before migration layering.
- `defer to migration issue`: leave in place for #1038 and migrate in the owning implementation issue.

## Canonical decision matrix

| Layer | Surface | Decision | Owner issue | Notes |
| --- | --- | --- | --- | --- |
| TS token layer | `primitives.ts` gray primitives | Defer to migration issue | #1032 | Zinc replacement executed in token migration PR. |
| TS token layer | `semantic.ts` gray semantic references | Defer to migration issue | #1032 | Requires synchronized semantic + primitive update. |
| TS token layer | `contextual.ts` mysterious tone gray refs | Defer to migration issue | #1032 | Keep tone semantics, update neutral source. |
| TS token layer | `tailwind.config.ts` gray/neutral aliases + prose refs | Defer to migration issue | #1032 | Update generated utilities and prose defaults together. |
| Globals/CSS layer | `.text-link-*` | Remove in #1038 | #1038 | Replace with component-level/link token patterns. |
| Globals/CSS layer | `.narrative-content*` overrides | Remove in #1038 | #1038 | Remove global typography override coupling. |
| Globals/CSS layer | `.card`, `.btn`, `.btn-primary` | Remove in #1038 | #1038 | Legacy helpers duplicate shadcn responsibilities. |
| Globals/CSS layer | `.space-y-*` overrides | Remove in #1038 | #1038 | Remove duplicate utility behavior after callsite check. |
| Globals/CSS layer | Scroll snap rules | Defer to migration issue | #1033 | Needs alignment with streaming stability work. |
| Globals/CSS layer | `.ending-*` | Keep baseline | #1032 | Retune token values during palette migration. |
| Globals/CSS layer | `.devtools-panel*` | Defer to migration issue | #1046 | Out of current game-session cutover scope. |
| Globals/CSS layer | `@layer utilities` animations/touch helpers | Keep baseline | #1038 | No neutral-token conflict detected. |
| Component layer | `narrativeMaxHeight` pattern | Defer to migration issue | #1034 | Remove as part of manuscript layout migration. |
| Component layer | Two-column shell classes | Defer to migration issue | #1034 | Replace with manuscript layout in migration. |
| Component layer | Choices/skeleton gray classes | Defer to migration issue | #1032/#1034 | Token and layout migration are both required. |
| Component layer | CharacterSummary gray-heavy styling | Defer to migration issue | #1032/#1034 | Requires token + layout/system rewrite pass. |

## Conflict/duplication map

| Conflict area | Sources in conflict | Why this conflicts | Resolution direction |
| --- | --- | --- | --- |
| Link styling ownership | Global `a` and `.text-link-*` rules vs component-level link styling | Global defaults and utility classes both attempt to own link behavior. | Remove `.text-link-*` in #1038, keep minimal base links, then consolidate in #1034. |
| Card/button ownership | Global `.card`/`.btn` helpers vs shadcn `Card`/`Button` components | Two parallel component systems with overlapping semantics. | Remove legacy globals in #1038; keep shadcn/tokenized component path. |
| Narrative typography ownership | `.narrative-content*` global overrides vs migrated manuscript typography intent | Global typography forces `system-ui` and justified text against target narrative spec. | Remove in #1038 and reintroduce scoped typography in #1034/#1032. |
| Neutral token ownership | TS primitive/semantic gray + tailwind prose refs + CSS variable neutrals + component `gray-*` classes | Multiple layers can drift and produce mixed neutral palettes. | Execute coordinated gray-to-zinc migration in #1032 and sweep direct class usage in #1034. |

## Feature-flag dependency notes

| Finding area | Flag needed? | Dependency issue | Owner issue |
| --- | --- | --- | --- |
| Streaming behavior migration (scroll snap/anchoring changes) | Yes | #1039 | #1033 |
| Progressive disclosure migration | Yes | #1039 | #1035 |
| Virtualization and deferred optimization | No (deferred) | #1036 | #1036 |

## Storybook mapping table (surface -> story -> keep/update/deprecate)

| Surface | Story file(s) | Story action | Story gap handling |
| --- | --- | --- | --- |
| `src/components/GameSession/ActiveGameSession.tsx` | `src/stories/05-pages/game-session/ActiveGameSession.stories.tsx` | Update in #1034 | Existing story remains the parent integration surface. |
| `src/components/GameSession/ActiveGameSessionNarrativeColumn.tsx` | Covered by `src/stories/05-pages/game-session/ActiveGameSession.stories.tsx` | Update in #1034 | No direct story; parent story coverage accepted for now. |
| `src/components/GameSession/ActiveGameSessionChoicesColumn.tsx` | Covered by `src/stories/05-pages/game-session/ActiveGameSession.stories.tsx` | Update in #1034 | No direct story; parent story coverage accepted for now. |
| `src/components/GameSession/CharacterSummary.tsx` | `src/stories/03-organisms/character/display/CharacterSummary.stories.tsx` | Update in #1032/#1034 | Story exists and should track token/layout migration. |
| `src/components/GameSession/GameSessionSkeleton.tsx` | No dedicated story | **Update in #1038/#1034 (gap)** | Add dedicated story or add explicit loading-state coverage in `ActiveGameSession` stories. |
| Ending tone classes (`.ending-*`) | `src/stories/05-pages/game-session/EndingScreen.stories.tsx` | Keep baseline, update in #1032 | Existing ending story is the validation surface for tone token updates. |
| Foundation token surfaces | `src/stories/00-foundation/DesignTokens.stories.tsx`, `src/stories/00-foundation/DesignSystemShowcase.stories.tsx` | Update in #1032 | #1037 only records dependency and owner issue. |

Explicit required callout:
- `GameSessionSkeleton.tsx` has no direct story and is a current coverage gap. The preferred path is adding a dedicated story in #1038; fallback is explicit loading-state stories under `ActiveGameSession` in #1034.

## Handoff checklist for #1038

### Safe removals for #1038 now

- Remove legacy link utility classes: `.text-link-primary`, `.text-link-secondary`, `.text-link-nav`, `.text-link-nav-dark`.
- Remove legacy global component helpers: `.card`, `.btn`, `.btn-primary`.
- Remove legacy narrative global typography block: `.narrative-content*`.
- Remove duplicated global `.space-y-*` overrides after validating current callsites do not require override-specific behavior.

### Deferred removals blocked by dependencies

- Keep scroll snap behavior until #1033 defines replacement behavior under streaming migration.
- Keep TS neutral token layer (`primitives/semantic/contextual/tailwind`) until #1032 executes synchronized zinc migration.
- Keep `narrativeMaxHeight` and two-column shell cleanup for #1034, where layout migration is implemented.
- Keep progressive disclosure dependencies waiting on #1039 feature-flag infrastructure.

### Phase 2 migration transfers (`#1032/#1033/#1034/#1035`)

- #1032: complete gray->zinc migration across TS token files, tailwind neutral aliases, and foundation stories.
- #1033: replace or remove current scroll-snap behavior in favor of streaming-stable scroll strategy behind flag dependencies.
- #1034: replace two-column shell and `narrativeMaxHeight` pattern, migrate page-level story coverage accordingly.
- #1035: progressive disclosure rollout depends on #1039 and should not be mixed into #1038 removals.

### Storybook follow-up actions required in #1038 PR

- Update story mappings touched by any removal in the same PR.
- Add a dedicated story for `GameSessionSkeleton` or explicitly cover loading skeleton states in `ActiveGameSession` stories.
- Keep `EndingScreen` story valid for tone-class behavior until #1032 token migration updates it.
- Run `npm run build-storybook` as required migration gate.

### Done-when checklist copied from #1037

- [x] Keep/remove/defer map exists.
- [x] Gray->zinc mapping spans TS + CSS + component class usage.
- [x] Legacy globals are flagged with action decisions.
- [x] Every in-scope source has an action decision.
- [x] Handoff to #1038 is explicit.
