# Issue #1046 Non-Game-Session Legacy Styling Audit

- Part of #1020
- Implements #1046
- Feeds #1047
- Last updated: 2026-02-08

## Inventory baseline captures

### Global gray footprint (repo-wide context for #1032 and #1047)

```text
gray-token-occur-all=1148
gray-token-files-all=150
gray-token-occur-non-game-session=1109
gray-token-files-non-game-session=142
```

### Non-game-session route candidate set (`src/app`, excluding `/play` and `/dev`)

```text
src/app/about/page.tsx
src/app/characters/[id]/edit/page.tsx
src/app/characters/[id]/page.tsx
src/app/characters/create/page.tsx
src/app/characters/page.tsx
src/app/page.tsx
src/app/settings/page.tsx
src/app/worlds/[id]/edit/page.tsx
src/app/worlds/[id]/page.tsx
src/app/worlds/create/page.tsx
src/app/worlds/page.tsx
```

### Shared wrapper/domain candidate set

```text
src/components/shared/wizard/styles/wizardStyles.ts
src/components/shared/cards/ActiveStateCard.tsx
src/components/shared/cards/CardActionGroup.tsx
src/components/shared/PageLayout.tsx
src/components/shared/SectionWrapper.tsx
src/components/Navigation/Navigation.tsx
src/components/Navigation/MobileNavigationMenu.tsx
src/components/Navigation/navigationDropdownStyles.ts
src/components/Navigation/Breadcrumbs.tsx
src/components/Navigation/RecentPagesDropdown.tsx
src/components/Journal/JournalPage.tsx
src/components/Journal/JournalEntryList.tsx
src/components/Journal/JournalEntryDetail.tsx
src/components/CharacterCard/CharacterCard.tsx
src/components/WorldCard/WorldCard.tsx
src/components/WorldCreationWizard/steps/*
src/components/CharacterCreationWizard/steps/*
src/components/devtools/*
```

### Domain-level legacy-pattern volume

Pattern used for counts: `gray-*`, `text-link-*`, `bg-white`, `border-gray-*`, `text-gray-*`, `space-y-*`, `bg-blue-*`, `border-blue-*`.

| Scope | Legacy pattern hits |
| --- | ---: |
| `src/components/devtools` | 320 |
| `src/components/WorldCreationWizard` | 80 |
| `src/components/Navigation` | 68 |
| `src/components/CharacterCreationWizard` | 44 |
| `src/components/shared/wizard` | 30 |
| `src/components/Journal` | 22 |
| `src/app/characters` | 21 |
| `src/components/CharacterCard` | 9 |
| `src/components/shared/cards` | 8 |
| `src/components/WorldCard` | 5 |
| `src/app/worlds` | 1 |
| `src/app/settings` | 1 |
| `src/components/shared/PageLayout.tsx` | 0 |
| `src/components/shared/SectionWrapper.tsx` | 0 |

### `wizardStyles` consumer set (cross-domain coupling)

```text
wizard-styles-consumers=21
src/components/CharacterCreationWizard/README.md
src/components/CharacterCreationWizard/steps/AttributesStep.tsx
src/components/CharacterCreationWizard/steps/SkillsStep.tsx
src/components/WorldCreationWizard/steps/AttributeReviewStep.tsx
src/components/WorldCreationWizard/steps/BasicInfoStep.tsx
src/components/WorldCreationWizard/steps/FinalizeStep.tsx
src/components/WorldCreationWizard/steps/SkillReviewStep.tsx
src/components/WorldCreationWizard/steps/TemplateStep.tsx
src/components/shared/PointPoolManager/PointPoolManager.tsx
src/components/shared/PreviewModal/PreviewModal.tsx
src/components/shared/RecentTemplates/RecentTemplates.tsx
src/components/shared/wizard/README.md
src/components/shared/wizard/WizardContainer.tsx
src/components/shared/wizard/WizardNavigation.tsx
src/components/shared/wizard/WizardProgress.tsx
src/components/shared/wizard/WizardStep.tsx
src/components/shared/wizard/components/FormComponents.tsx
src/components/shared/wizard/components/ToggleButton.tsx
src/components/shared/wizard/index.ts
src/components/shared/wizard/styles/wizardStyles.ts
src/components/world/SmartTemplates/TemplatePreview.tsx
```

### Per-file legacy pattern counts for key non-game-session surfaces

| File | Legacy pattern count |
| --- | ---: |
| `src/components/shared/wizard/styles/wizardStyles.ts` | 37 |
| `src/components/Navigation/Navigation.tsx` | 16 |
| `src/components/Navigation/MobileNavigationMenu.tsx` | 14 |
| `src/components/Navigation/navigationDropdownStyles.ts` | 10 |
| `src/components/Navigation/Breadcrumbs.tsx` | 17 |
| `src/components/Navigation/RecentPagesDropdown.tsx` | 11 |
| `src/components/devtools/DevToolsPanel/DevToolsPanel.tsx` | 39 |
| `src/components/devtools/EndingImageDebugSection/EndingImageDebugSection.tsx` | 50 |
| `src/components/devtools/PortraitDebugSection/PromptBreakdown.tsx` | 38 |
| `src/components/devtools/ErrorSection/ErrorSection.tsx` | 34 |
| `src/components/CharacterCard/CharacterCard.tsx` | 9 |
| `src/components/WorldCard/WorldCard.tsx` | 5 |
| `src/components/shared/cards/CardActionGroup.tsx` | 8 |
| `src/components/shared/cards/ActiveStateCard.tsx` | 2 |
| `src/components/Journal/JournalPage.tsx` | 4 |
| `src/components/Journal/JournalEntryList.tsx` | 12 |
| `src/components/Journal/JournalEntryDetail.tsx` | 6 |
| `src/components/shared/PageLayout.tsx` | 0 |
| `src/components/shared/SectionWrapper.tsx` | 0 |

### Route shell legacy pattern counts (non-game-session)

| Route file | Legacy pattern count |
| --- | ---: |
| `src/app/characters/create/page.tsx` | 10 |
| `src/app/characters/page.tsx` | 8 |
| `src/app/characters/[id]/edit/page.tsx` | 2 |
| `src/app/characters/[id]/page.tsx` | 1 |
| `src/app/worlds/page.tsx` | 1 |
| `src/app/settings/page.tsx` | 1 |
| `src/app/page.tsx` | 0 |
| `src/app/about/page.tsx` | 0 |
| `src/app/worlds/create/page.tsx` | 0 |
| `src/app/worlds/[id]/page.tsx` | 0 |
| `src/app/worlds/[id]/edit/page.tsx` | 0 |

### Broad `globals.css` non-game-session hit list

| Category | Source hits |
| --- | --- |
| Base layers | `@layer base` at lines 54 and 222 |
| Main non-ending surface background | `main:not(.ending-screen)` at line 224 |
| Link defaults | `a`, `.prose a`, `p a`, `li a`, `span a` at lines 228-257 |
| Link utility classes | `.text-link-*` at lines 259, 263, 267, 271, 276 |
| Dark-background link exception rules | `.bg-gray-900 a:not([data-navigation])` and `.bg-gray-700 ...` at lines 279-286 |
| Space utility overrides | `.space-y-*` at lines 300, 304, 308, 313, 317, 321 |
| Legacy component helpers | `.card`, `.btn`, `.btn-primary` at lines 327, 335, 346, 352 |
| Devtools global block | `.devtools-panel*` at lines 358, 364-369, 376, 382, 392 |
| Utility layer | `@layer utilities` at line 397 |

### Storybook baseline for audited non-game-session surfaces

```text
src/stories/00-foundation/DesignTokens.stories.tsx
src/stories/00-foundation/DesignSystemShowcase.stories.tsx
src/stories/02-molecules/ui-components/cards/ActiveStateCard.stories.tsx
src/stories/02-molecules/ui-components/cards/CardActionGroup.stories.tsx
src/stories/03-organisms/navigation/Navigation.stories.tsx
src/stories/03-organisms/navigation/MobileNavigationMenu.stories.tsx
src/stories/03-organisms/navigation/RecentPagesDropdown.stories.tsx
src/stories/03-organisms/character/display/CharacterCard.stories.tsx
src/stories/03-organisms/world/display/WorldCard.stories.tsx
src/stories/03-organisms/journal/JournalPage.stories.tsx
src/stories/03-organisms/journal/JournalEntryList.stories.tsx
src/stories/03-organisms/journal/JournalEntryDetail.stories.tsx
src/stories/03-organisms/devtools/panels/DevToolsPanel.stories.tsx
src/stories/03-organisms/devtools/panels/AITestingPanel.stories.tsx
src/stories/03-organisms/devtools/sections/ErrorSection.stories.tsx
src/stories/03-organisms/devtools/sections/StateSection.stories.tsx
src/stories/04-templates/layouts/PageLayout.stories.tsx
src/stories/04-templates/layouts/WorldListScreen.stories.tsx
src/stories/04-templates/wizards/world/WorldCreationWizard.stories.tsx
src/stories/04-templates/wizards/character/CharacterCreationWizard.stories.tsx
src/stories/03-organisms/game-session/setup/QuickStartCharacters.stories.tsx
```

Baseline story gaps recorded for this audit:
- `src/app/characters/page.tsx` and `src/app/characters/create/page.tsx` have no route-level stories.
- `src/components/shared/wizard/styles/wizardStyles.ts` has no direct story and is only covered through wizard template stories.
- Devtools section components such as `EndingImageDebugSection`, `PromptBreakdown`, and `SectionVisibilityControls` have no direct stories.

## Scope and required surfaces

This audit is a decision artifact, not a production refactor. It inventories styling sources for non-game-session domains and assigns actions (`keep baseline`, `remove in #1038`, or `defer to migration issue`).

Required surfaces in this artifact:
- TS token layer: `src/lib/design-tokens/tokens/primitives.ts`, `src/lib/design-tokens/tokens/semantic.ts`, `src/lib/design-tokens/tokens/contextual.ts`, `tailwind.config.ts`
- CSS variables and global styles: `src/app/globals.css`
- Route shell layer: `src/app/page.tsx`, `src/app/worlds/*`, `src/app/characters/*`, `src/app/settings/page.tsx`
- Shared wrapper/domain layer: navigation, wizard system, shared cards/layout wrappers, journal UI, devtools UI
- Storybook contract layer: relevant `src/stories/` entries for navigation, wizards, cards, journal, devtools, layout templates, and foundations

## In scope

- Non-game-session routes and shared wrappers that can carry legacy styling debt into the redesign rollout.
- Gray-to-zinc implications across TS primitives, global CSS rules, and component-level utility chains.
- Dependency and handoff mapping for #1038 (global removals) and #1047 (non-game-session migration rollout).
- Storybook mapping (`surface -> story -> keep/update/deprecate`) for audited non-game-session surfaces.

## Not in scope

- Game-session rendering surfaces and gameplay composition changes tracked in #1037/#1038/#1034.
- Streaming behavior migration and scroll anchoring implementation tracked in #1033.
- Production code changes for this audit issue; implementation belongs to #1038 and #1047.

## Adjacent risks

- #1037 marked `.text-link-*` for removal in #1038, but #1046 inventory found active non-game-session callsites in 10 files; unsynchronized removal will regress navigation/workshop links.
- `wizardStyles` is a high-coupling shared layer used across world + character workflows; local fixes can reintroduce legacy neutral colors if migration is not centralized.
- Devtools components have heavy gray utility usage (`300` gray occurrences across `21` files), but global `.devtools-panel*` selectors appear orphaned and can drift from actual component styling.

## TS primitives layer findings

Pattern used for counts: `gray:\s*\{|primitiveColors\.gray|colors\.gray|neutral:\s*primitiveColors\.gray`

| File | Gray reference count | Current gray usage | Zinc migration intent | Candidate decision | Owner issue |
| --- | ---: | --- | --- | --- | --- |
| `src/lib/design-tokens/tokens/primitives.ts` | 1 | Defines canonical `primitiveColors.gray` scale. | Replace gray palette values with zinc equivalents. | Defer to migration issue. | #1032 |
| `src/lib/design-tokens/tokens/semantic.ts` | 52 | Semantic surfaces and dark variants rely on gray primitives. | Rebind semantic neutrals to zinc-backed primitives. | Defer to migration issue. | #1032 |
| `src/lib/design-tokens/tokens/contextual.ts` | 2 | Contextual `endingTones.mysterious` uses gray refs. | Keep contextual API shape, change neutral source to zinc-era values. | Defer to migration issue. | #1032 |
| `tailwind.config.ts` | 25 | Exposes gray/neutral aliases and prose colors from gray primitives. | Update generated utilities/prose paths to zinc-backed primitives. | Defer to migration issue. | #1032 |

TS coverage note:
- Non-game-session migration (#1047) depends on #1032 landing first, then sweeping remaining direct `gray-*` class chains in component files.

## CSS variables + globals findings

| Source area | Current behavior | Non-game-session implication | Candidate decision | Owner issue |
| --- | --- | --- | --- | --- |
| `@layer base` root + dark CSS variables | Core CSS variable neutrals still gray-era. | Non-game-session shadcn surfaces inherit gray-era tone even when component classes migrate. | Defer to migration issue. | #1032 |
| `main:not(.ending-screen)` background rule | Forces gray-100 default canvas for most routes. | Route shells keep legacy neutral backdrop even with tokenized components. | Defer to migration issue. | #1032/#1047 |
| `a` + `.prose a`/`p a`/`li a`/`span a` link defaults | Global blue link behavior is broad and partially overlaps utility classes. | Link ownership conflicts with component-level link patterns during rollout. | Keep baseline in #1038; consolidate in #1047. | #1047 |
| `.text-link-primary`, `.text-link-secondary`, `.text-link-nav`, `.text-link-nav-dark` | Legacy utility family still used in 10 non-game-session files. | Immediate removal in #1038 will regress navigation and workshop links. | Defer removal until non-game-session callsites are migrated. | #1047 (then #1038 cleanup) |
| `.space-y-*` overrides | Re-declares utility behavior globally. | Widespread usage but behavior duplicates framework semantics, causing redundant ownership. | Remove in #1038 after Storybook smoke-check. | #1038 |
| `@layer components` `.card`, `.btn`, `.btn-primary` | Legacy helper classes duplicate shadcn/shared-component responsibilities. | No direct non-test callsites were found in audited non-game-session sources. | Remove in #1038. | #1038 |
| `.devtools-panel*` block | Global devtools selectors are defined outside layers. | No `.devtools-panel` class callsites found in current devtools components; block appears dead/orphaned. | Remove in #1038. | #1038 |
| `@layer utilities` custom animation/touch utilities | Non-color utility helpers. | No direct neutral-token conflict found in audited domains. | Keep baseline. | #1038 |

Coverage check categories mapped:
- `@layer base`, `main:not(.ending-screen)`, link defaults, `.text-link-*`, `.space-y-*`, `.card`, `.btn`, `.devtools-panel`, `@layer utilities`.

## Component-level findings (non-game-session)

### Route shell findings

| Route surface | Legacy count | Legacy pattern | Problem statement | Candidate decision | Owner issue |
| --- | ---: | --- | --- | --- | --- |
| `src/app/characters/create/page.tsx` | 10 | `min-h-screen bg-gray-100`, `bg-white`, `text-gray-*`, hardcoded shell spacing | Route bypasses shared layout primitives and carries high legacy neutral coupling. | Defer to migration issue. | #1047 |
| `src/app/characters/page.tsx` | 8 | `.text-link-primary` + gray utility copy and wrappers | Characters index still depends on legacy link utility + gray copy conventions. | Defer to migration issue. | #1047 |
| `src/app/characters/[id]/edit/page.tsx` | 2 | `className="bg-gray-100"` + `.text-link-primary` | Edit route reintroduces gray backdrop inside `PageLayout`. | Defer to migration issue. | #1047 |
| `src/app/worlds/page.tsx` | 1 | `space-y-*` usage in modal content | World index route is mostly tokenized; remaining legacy exposure is low. | Keep baseline. | #1047 |
| `src/app/settings/page.tsx` | 1 | `space-y-*` wrapper utility | Settings is already mostly semantic/shadcn-based. | Keep baseline. | #1047 |
| `src/app/worlds/create/page.tsx`, `src/app/worlds/[id]/page.tsx`, `src/app/worlds/[id]/edit/page.tsx` | 0 | No significant gray/text-link dependency in route shell | These routes primarily compose shared components with minimal legacy shell styling. | Keep baseline. | #1047 |

### Shared wrapper/domain findings

| Surface group | Legacy count | Legacy pattern | Problem statement | Candidate decision | Owner issue |
| --- | ---: | --- | --- | --- | --- |
| Navigation stack (`Navigation`, `MobileNavigationMenu`, `Breadcrumbs`, `RecentPagesDropdown`, `navigationDropdownStyles`) | 70 | `bg-gray-900`, `text-gray-*`, `text-link-nav*`, `bg-blue-*` action accents | Primary nav system still depends on global link utility family and gray palette classes. | Defer to migration issue. | #1047 |
| Shared wizard style system (`wizardStyles.ts` + world/character wizard steps) | 113 | Centralized gray/blue utility chains, legacy card/button style tokens | High coupling layer can reintroduce legacy neutrals across workshop routes. | Defer to migration issue. | #1047 |
| Shared cards + card consumers (`ActiveStateCard`, `CardActionGroup`, `CharacterCard`, `WorldCard`) | 24 | Gray/blue defaults in shared action and card wrappers | Shared wrappers still carry legacy neutrals and button colors used across domains. | Defer to migration issue. | #1047 |
| Journal surfaces (`JournalPage`, `JournalEntryList`, `JournalEntryDetail`) | 22 | System-event gray branch styles and mixed neutral conventions | Journal visual hierarchy is split across amber + legacy gray utility chains. | Defer to migration issue. | #1047 |
| Devtools surfaces (`DevToolsPanel` + section components) | 320 | Dense gray utility chains across 21 files | Largest remaining non-game-session neutral debt; currently non-player-facing but cross-cutting. | Defer to migration issue. | #1047 |
| Shared layout wrappers (`PageLayout`, `SectionWrapper`) | 0 | Semantic tokenized layout wrappers | Baseline wrappers are already aligned and should stay stable. | Keep baseline. | #1047 |

Required one-off pattern classifications:
- `.text-link-*` dependency across 10 non-game-session files: migrate callsites in #1047 before deleting global classes.
- `wizardStyles` centralized gray/blue chain: replace with tokenized style primitives in #1047.
- Character route shells (`min-h-screen bg-gray-100`) should be normalized to shared layout wrappers in #1047.
- Global `.devtools-panel*` block is orphaned and can be removed in #1038.

## Conflict/duplication map

| Conflict area | Sources in conflict | Why this conflicts | Resolution direction |
| --- | --- | --- | --- |
| Link styling ownership | Global `.text-link-*` + base `a` rules vs component-level navigation/link styles | Global utility removal in #1038 conflicts with active non-game-session link dependencies. | Keep compatibility until #1047 migrates callsites; remove global utilities after migration coverage. |
| Card/button ownership | Legacy shared wrappers (`CardActionGroup`, `ActiveStateCard`) vs tokenized shadcn/button variants | Two style systems define action button and surface states in parallel. | Consolidate on semantic variants in #1047 and retire legacy class chains. |
| Wizard styling ownership | `wizardStyles.ts` centralized legacy classes vs redesign token/component targets | Shared wizard layer affects world + character + template flows, increasing regression blast radius. | Migrate wizard style system as a single #1047 scope slice, not piecemeal edits. |
| Devtools styling ownership | Orphaned global `.devtools-panel*` vs inline utility-heavy devtools components | Global selectors no longer reflect live component markup; both layers drift independently. | Remove orphaned global block in #1038, then migrate component utilities in #1047. |
| Route shell ownership | Per-route gray wrappers in character routes vs `PageLayout`/shared layout wrappers | Route-level wrappers bypass shared layout system and reintroduce legacy neutrals. | Move route shells to shared wrappers + semantic tokens in #1047. |

## Feature-flag dependency notes

| Finding area | Flag needed? | Dependency issue | Owner issue |
| --- | --- | --- | --- |
| Non-game-session styling migration (navigation/wizards/journal/cards/devtools) | No | None required for purely visual/tokenized rollout. | #1047 |
| Shared global class removals (`.text-link-*`, `.space-y-*`, `.card`, `.btn`, `.devtools-panel*`) | No | Must follow Storybook contract and same-PR story updates. | #1038/#1045 |
| Non-game-session pages that link into play flow | No new flag | Existing feature flag infra from #1039 remains unchanged for game-session flags. | #1047/#1039 |

## Storybook mapping table (surface -> story -> keep/update/deprecate)

| Surface | Story file(s) | Story action | Story gap handling |
| --- | --- | --- | --- |
| Navigation shell + dropdowns | `src/stories/03-organisms/navigation/Navigation.stories.tsx`, `src/stories/03-organisms/navigation/MobileNavigationMenu.stories.tsx`, `src/stories/03-organisms/navigation/RecentPagesDropdown.stories.tsx` | Update in #1047 | Existing coverage is strong for visible nav surfaces. |
| Shared cards + world/character cards | `src/stories/02-molecules/ui-components/cards/ActiveStateCard.stories.tsx`, `src/stories/02-molecules/ui-components/cards/CardActionGroup.stories.tsx`, `src/stories/03-organisms/world/display/WorldCard.stories.tsx`, `src/stories/03-organisms/character/display/CharacterCard.stories.tsx` | Update in #1047 | Keep these as primary regression surfaces for card/action style migration. |
| World/character wizard templates | `src/stories/04-templates/wizards/world/WorldCreationWizard.stories.tsx`, `src/stories/04-templates/wizards/character/CharacterCreationWizard.stories.tsx` | Update in #1047 | Add focused story variants when wizard style migration changes state styling significantly. |
| Journal surfaces | `src/stories/03-organisms/journal/JournalPage.stories.tsx`, `src/stories/03-organisms/journal/JournalEntryList.stories.tsx`, `src/stories/03-organisms/journal/JournalEntryDetail.stories.tsx` | Update in #1047 | Existing stories cover key branches (list/detail/system-entry styling). |
| Devtools panel and core sections | `src/stories/03-organisms/devtools/panels/DevToolsPanel.stories.tsx`, `src/stories/03-organisms/devtools/panels/AITestingPanel.stories.tsx`, `src/stories/03-organisms/devtools/sections/ErrorSection.stories.tsx`, `src/stories/03-organisms/devtools/sections/StateSection.stories.tsx` | Update in #1047 | Add missing section stories for high-debt devtools modules. |
| Shared layout wrappers | `src/stories/04-templates/layouts/PageLayout.stories.tsx`, `src/stories/04-templates/layouts/WorldListScreen.stories.tsx` | Keep baseline / update as needed | Route-shell migrations should keep these stories aligned with page composition. |
| Quick start character surface | `src/stories/03-organisms/game-session/setup/QuickStartCharacters.stories.tsx` | Update in #1047 | Story currently lives under `game-session/setup`; keep linked to character-create migration scope. |
| Character index/create route shells | No dedicated route stories | **Update in #1047 (gap)** | Add standalone route-shell story fixtures or equivalent template stories in #1047. |
| `wizardStyles.ts` foundation contract | No direct story | **Update in #1047 (gap)** | Add direct wizard-style coverage or explicit visual test fixtures. |

## Handoff checklist for #1038 and #1047

### Safe removals for #1038 now

- Remove legacy global component helpers: `.card`, `.btn`, `.btn-primary` (no active non-test callsites found in audited non-game-session surfaces).
- Remove orphaned global `.devtools-panel*` block (no class callsites in current devtools component tree).
- Remove duplicate global `.space-y-*` overrides after Storybook smoke check confirms no override-specific dependence.

### Deferred removals blocked by non-game-session dependencies

- Keep `.text-link-*` in place until #1047 migrates all non-game-session callsites.
- Keep broad base link defaults until navigation/workshop link ownership is consolidated in #1047.
- Keep wizard, navigation, journal, card, and route-shell gray/blue utility chains for migration execution in #1047 (do not fold into #1038 clean-slate PR).

### Phase 2 migration transfers (`#1032` and `#1047`)

- #1032: land synchronized gray->zinc token migration across TS primitives + semantic/contextual layers + Tailwind configuration.
- #1047: migrate non-game-session route shells (characters/worlds/settings wrappers), navigation, wizard styling system, shared cards, journal views, and devtools sections to semantic token patterns.
- #1047: remove remaining `.text-link-*` callsites and convert to component-level/tokenized link patterns.

### Storybook follow-up actions required in #1047 PRs

- Update corresponding stories in the same PR for each touched surface.
- Add route-shell coverage for character index/create flows (currently story gaps).
- Add direct coverage for wizard style system changes (story gap today).
- Add missing devtools section stories for high-change modules (EndingImageDebug, PromptBreakdown, SectionVisibilityControls, LoreManagement tabs).
- Run `npm run build-storybook` as migration verification gate.

### Done-when checklist copied from #1046

- [x] Non-game-session surfaces have an explicit keep/remove/defer map.
- [x] TS token usage, globals.css dependencies, and component utility chains are included.
- [x] Storybook mapping exists for audited non-game-session surfaces.
- [x] Adjacent shared patterns (`wizardStyles`, shared cards/layout wrappers) are explicitly called out.
- [x] Migration-ready handoff is explicit for downstream rollout issue(s).
