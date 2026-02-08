# Design System Migration Plan

**Status:** Planning
**Created:** February 2026
**Context:** Solo dev, part-time work, practical execution over process

---

## GitHub Issues

**Epic:** [#1020 - Design System Migration](https://github.com/jerseycheese/Narraitor/issues/1020)

**Phase 0: Prototype (build in design-system.html)**
- [#1029 - Build typography & color prototypes](https://github.com/jerseycheese/Narraitor/issues/1029)
- [#1030 - Build streaming stability demo](https://github.com/jerseycheese/Narraitor/issues/1030)
- [#1031 - Build component & layout prototypes](https://github.com/jerseycheese/Narraitor/issues/1031)

**Phase 1: Clean Slate (remove existing styling before migration)**
- [#1037 - Audit legacy styling before clean-slate migration](https://github.com/jerseycheese/Narraitor/issues/1037)
- [#1046 - Audit legacy styling beyond game-session surfaces](https://github.com/jerseycheese/Narraitor/issues/1046)
- [#1045 - Define Storybook migration contract and coverage mapping](https://github.com/jerseycheese/Narraitor/issues/1045)
- [#1038 - Remove legacy styling and establish clean slate](https://github.com/jerseycheese/Narraitor/issues/1038)
- [#1039 - Set up feature flag infrastructure](https://github.com/jerseycheese/Narraitor/issues/1039)

**Phase 2: Migrate (apply to actual app)**
- [#1032 - Migrate typography & colors to app](https://github.com/jerseycheese/Narraitor/issues/1032)
- [#1033 - Migrate streaming stability to app](https://github.com/jerseycheese/Narraitor/issues/1033)
- [#1034 - Migrate components & layout to app](https://github.com/jerseycheese/Narraitor/issues/1034)
- [#1035 - Migrate progressive disclosure to app](https://github.com/jerseycheese/Narraitor/issues/1035)
- [#1047 - Roll out design system to non-game-session surfaces](https://github.com/jerseycheese/Narraitor/issues/1047)

**Phase 3: Polish (deferred)**
- [#1036 - Polish & optimization (only when pain appears)](https://github.com/jerseycheese/Narraitor/issues/1036)

---

## Git Strategy for This Epic

This redesign touches a lot of shared UI surfaces, so this plan uses a dedicated integration branch for the epic instead of merging every issue branch straight into `develop`.

**Branch model**
- `develop` stays the main integration line for the repo.
- Create one long-lived epic integration branch from `develop`: `codex/1020-design-system-integration`
- Create one short-lived branch per issue from the integration branch:
  - `codex/1029-prototype-typography`
  - `codex/1030-prototype-streaming`
  - `codex/1037-clean-slate-audit`
  - etc.

**PR flow**
1. Issue branch -> `codex/1020-design-system-integration`
2. After each phase is stable, PR `codex/1020-design-system-integration` -> `develop`
3. Repeat for next phase

**Why this approach**
- Keeps cross-cutting redesign churn isolated while the work is in-flight
- Lets the combined redesign state be tested before landing on `develop`
- Reduces noisy partial migrations on `develop`

**Rules to keep it healthy**
- Merge `develop` into `codex/1020-design-system-integration` at least daily (or before every merge to integration)
- Keep feature flags working in integration (`FEATURE_BUFFERED_STREAMING`, `FEATURE_PROGRESSIVE_DISCLOSURE`)
- Close issues only when the related work lands in `develop`, not just in integration
- If urgent fixes go directly to `develop`, back-merge them into integration immediately

**Merge criteria for integration -> develop**
- Phase acceptance criteria met
- Relevant tests and manual checks complete
- No known regressions on core game-session flow

---

## Overview

Migrating Narraitor to the Mechanical Manuscript design system. The approach is incremental and pragmatic—**prototype, strip to a clean slate, then migrate**.

No fixed timelines. Work happens in "Prototype / Clean Slate / Migrate / Polish" phases.

**Key principle:** Build working examples in design-system.html first. Validate designs work before touching production code.

---

## Token Architecture

The codebase has a two-layer token system that must be updated in sync during migration:

**Layer 1: TypeScript Primitives → Tailwind**
- Source: `src/lib/design-tokens/tokens/primitives.ts`, `semantic.ts`, `contextual.ts`
- Consumed by: `tailwind.config.ts` (generates utility classes like `bg-gray-100`, `text-gray-900`)
- Affects: All Tailwind utility classes in component JSX

**Layer 2: CSS Variables → shadcn/ui**
- Source: `src/app/globals.css` (`:root` and `.dark` blocks)
- Consumed by: shadcn/ui components via `hsl(var(--background))`, `hsl(var(--foreground))`, etc.
- Affects: All shadcn component styling (Button, Card, Input, etc.)

**Critical:** Updating one layer without the other creates mismatches between Tailwind utilities and shadcn components. Both layers need synchronized updates during #1032.

### Gray → Zinc Palette Migration

The Mechanical Manuscript spec uses Tailwind's **Zinc** palette (Zinc-50 `#fafafa`, Zinc-200 `#e4e4e7`, Zinc-950 `#09090b`) but the current codebase runs on the **Gray** palette (gray-100 `#f3f4f6`, gray-300 `#d1d5db`, gray-900 `#111827`). These are different hex values, not just a naming difference.

This palette swap touches three surfaces:
1. `src/lib/design-tokens/tokens/primitives.ts` — TS color definitions feeding Tailwind
2. `src/app/globals.css` — CSS variables feeding shadcn/ui
3. Component files using `gray-*` Tailwind classes directly

The #1037 and #1046 audits map gray references across these three layers so #1032 can execute a coordinated replacement for both game-session and non-game-session domains.

---

## Storybook Role in Migration

Storybook is part of the migration safety net, not optional documentation.

- Storybook loads app globals via `.storybook/preview.js` importing `src/app/globals.css`, so token/global CSS changes are visible there immediately.
- Storybook build is already a CI gate (`npm run build-storybook`), so migration PRs should treat story breakage as a blocking regression.
- For each migrated surface, update or add corresponding stories in the same PR. This keeps design intent, implementation, and regression checks aligned.
- Use [`issue-1045-storybook-migration-contract.md`](./issue-1045-storybook-migration-contract.md) as the canonical migration contract for mapping format, gap policy, and per-issue Storybook obligations.

---

## Current Pain Points

**Performance issues:**
- Content jumping during AI streaming (annoying, impacts reading flow)
- Layout shifts when suggested actions appear
- Long game sessions feel sluggish (might need virtualization, but test first)

**Visual inconsistency:**
- Typography all over the place (mix of system fonts and custom choices)
- No clear hierarchy
- Tailwind utilities everywhere, hard to maintain
- Markup bloat: components have deep div nesting and long className strings (80-150 chars) from stacking utilities

**Accessibility gaps:**
- Missing ARIA attributes
- Keyboard navigation doesn't work everywhere
- Some contrast issues
- No screen reader testing done yet

**What works fine:**
- Basic responsive design
- Core game mechanics
- Data persistence

---

## Non-Negotiables

These happen regardless of anything else:

1. **Clean-slate cutover** - Remove legacy visual styling from target surfaces before applying redesign tokens/components
2. **Minimal markup** - Each migrated component uses the least markup needed; no wrapper divs for single styling concerns, no long utility chains where a semantic class suffices
3. **Streaming stability** - Fix CLS during AI text generation (buffered rendering, scroll anchoring)
4. **Typography foundation** - Set up CSS variables and semantic tokens (enables everything else)
5. **Keyboard navigation** - All interactive elements accessible via keyboard
6. **Color contrast** - Meet WCAG AA minimums (4.5:1 text, 3:1 UI)
7. **No regressions** - Existing functionality keeps working during migration

Everything else is negotiable or deferrable.

---

## Migration Approach: Prototype / Clean Slate / Migrate / Polish

### Phase 0: Prototype (Build in design-system.html)

**Goal:** Build working examples in design-system.html. Validate designs work before touching production code.

**Where to build:** `public_docs/design-system/redesign-planning/design-system.html`

**Typography & Color Prototypes**
- Build complete typography examples in design-system.html
- Show heading hierarchy, body text, system labels with actual fonts loaded
- Demonstrate color palette with contrast ratios
- Create semantic token examples
- Test readability, make sure fonts render properly

**Streaming Behavior Demo**
- Build working streaming text demo in design-system.html
- Implement buffered rendering (50-100ms, `insertAdjacentText`)
- Demo scroll anchoring behavior
- Show skeleton states
- Measure CLS, verify < 0.10
- Test with realistic narrative text lengths

**Component Examples**
- Build all core components in design-system.html first
- Buttons, inputs, badges, alerts, cards, drawer pattern
- Show all states (default, hover, active, disabled, loading)
- Test interactions, make sure they feel right
- Get the aesthetic working before touching real app

**Layout Prototypes**
- Build Manuscript layout example in design-system.html
- Single-column narrative, bottom-docked input, floating HUD
- Add drafting grid background
- Test with long text content
- Verify layout doesn't break at different viewport sizes

**Game Session Composition Prototypes**

The current design-system.html has generic components (buttons, inputs, cards) and schematic layout placeholders. These game-session-specific compositions need prototyping before migration to validate the Manuscript archetype works with real content patterns:

- **Narrative reading surface** — EB Garamond body text at proper measure (max-w-3xl), line-height, and paragraph spacing. Test with realistic narrative lengths (short paragraph, full page, multi-paragraph). This is the most important thing to get right.
- **Streaming text container** — Simulated token-by-token text appearance with buffered rendering. Show skeleton → streaming → complete states. (#1030 scope)
- **Choice selector in Manuscript context** — Suggested actions positioned within or below the narrative column. Show how choices relate spatially to narrative text. Current implementation uses a separate column; prototype needs to validate single-column alternative.
- **Bottom-docked input field** — Real input with send button, character count, streaming-in-progress disabled state. Not just a placeholder box.
- **Character stat HUD** — Floating, collapsible panel showing character vitals. Show collapsed (minimal) and expanded states. Maps to current `CharacterSummary` component concept.
- **Narrative scroll with history** — Multiple narrative segments in a scrollable container. Test scroll anchoring behavior with new content appearing at bottom.
- **Choice outcome callout** — Inline consequence display within narrative text (maps to `ChoiceOutcomeCallout` component). Shows how choice results integrate visually.
- **Loading/skeleton states** — Skeleton treatment for AI response containers during generation.
- **Drawer/marginalia patterns** — Character details, inventory, journal entries as progressive disclosure overlays. (#1035 scope but prototype in Phase 0)

**Progressive Disclosure Prototypes**
- Build marginalia examples
- Build drawer component prototypes
- Build suggested actions examples
- Test interactions, make sure they don't distract from reading

**Accessibility Testing on Prototypes**
- Test keyboard navigation on all prototype components
- Check color contrast with WebAIM
- Test focus indicators
- Manual keyboard-only navigation test

**Done when:**
- All designs working in design-system.html
- Can demo streaming behavior without jank
- Components look and feel right
- Validated that designs solve the problems
- Ready to define exactly what legacy styling has to be removed before migration

### Phase 1: Clean Slate (Remove Existing Styling Before Migration)

**Goal:** Remove legacy visual styling on game session surfaces so migration layers onto a neutral baseline, not a mixed old/new system.

**Why this exists:** Without a clean-slate pass, migration work becomes additive. Old Tailwind-heavy styling sticks around, token intent gets blurred, and regressions are harder to isolate.

**Style Inventory & Removal Map**
- Inventory style sources that affect game session visuals (component classes, global overrides, one-off styles)
- Mark each source as keep for baseline, remove now, or defer
- Identify conflicting style responsibilities and duplicate visual rules
- Track this audit in [#1037](https://github.com/jerseycheese/Narraitor/issues/1037)
- Use [`issue-1037-legacy-styling-audit.md`](./issue-1037-legacy-styling-audit.md) as the source-of-truth for #1038 removal scope and Storybook follow-up actions
- Track non-game-session audit coverage in [#1046](https://github.com/jerseycheese/Narraitor/issues/1046)
- Use [`issue-1046-non-game-session-legacy-styling-audit.md`](./issue-1046-non-game-session-legacy-styling-audit.md) as the source-of-truth for #1047 migration scope and #1038 shared-global removal readiness
- Use [`issue-1045-storybook-migration-contract.md`](./issue-1045-storybook-migration-contract.md) as the source-of-truth for Storybook mapping format, gap policy, and `npm run build-storybook` migration gating

**Clean-Slate Cutover**
- Remove or neutralize legacy game-session styling based on the audit
- Keep only minimal baseline styles required for usability/layout stability
- Ensure no old theme-specific visual treatment remains on target surfaces
- Track implementation in [#1038](https://github.com/jerseycheese/Narraitor/issues/1038)

**Done when:**
- Game session renders from a neutral baseline without legacy visual artifacts
- Migration issues can apply new tokens/components without fighting old classes
- Old styling debt for target surfaces is either removed or explicitly deferred with issue links

### Phase 2: Migrate (Apply to Actual App)

**Goal:** Apply validated designs from prototypes to production code, on top of clean-slate surfaces. Low risk because designs are proven and legacy styling was already stripped.

**Typography & Color Migration**
- Update TypeScript design tokens (`src/lib/design-tokens/tokens/primitives.ts`) — gray → zinc palette swap
- Update CSS variables in `globals.css` to match zinc palette
- Verify both layers produce consistent colors (Tailwind utilities match shadcn components)
- Load fonts in app (Google Fonts or local)
- Apply semantic tokens to game session page first
- Test in production, verify typography renders correctly

**Streaming Stability Migration**
- Port buffered rendering code to actual game session
- Implement scroll anchoring in production
- Add skeleton states to real AI response containers
- Test with real API calls, verify CLS < 0.10
- Feature flag: `FEATURE_BUFFERED_STREAMING`

*Rendering pipeline to target:*
`NarrativeController` (hidden, generates) → `NarrativeHistoryManager` (state) → `NarrativeHistory` (Radix ScrollArea container) → `NarrativeDisplay` → `FormattedNarrativeContent`

Buffered rendering intercept likely at NarrativeHistoryManager or NarrativeHistory level.

*Note:* `globals.css` already has `scroll-snap-type: y mandatory` on `.narrative-history-container [data-radix-scroll-area-viewport]`. Evaluate whether this conflicts with new scroll anchoring behavior — may need replacement rather than layering.

**Component Migration**
- Port components from prototypes to app component library
- Replace old components gradually (one page at a time)
- Keep old components around until proven stable
- Test each migrated component in context
- Update matching Storybook stories in the same PR as component/layout migration work

**Layout Migration**
- Restructure `ActiveGameSession.tsx` from two-column flex layout to single-column Manuscript
  - Current: `ActiveGameSessionNarrativeColumn` (flex-[2]) + `ActiveGameSessionChoicesColumn` (flex-[1])
  - Target: Single-column narrative with integrated/bottom-positioned choices
- Evaluate PageLayout/Hero wrapper at `worlds/[id]/play/page.tsx` — game session may need different wrapping than standard pages
- Remove `narrativeMaxHeight` constraint pattern (conflicts with Manuscript concept)
- Port drafting grid background
- Implement bottom-docked input
- Add floating HUD
- Test with real game sessions

**Markup Simplification (Per Component)**

When each component is touched during Phase 2, strip its markup back to the minimum needed. This is not a separate pass -- it happens naturally as part of migration.

Simplification targets:
- **Reduce wrapper divs**: Remove single-purpose spacing/padding wrappers when the parent or child can absorb the style
- **Shorten className strings**: Replace long Tailwind utility chains with semantic design token classes or component-level styles. A 15-class string is a sign the component needs a design system abstraction.
- **Flatten nesting**: If a component has 6+ levels of div nesting, restructure during migration
- **Extract conditional styling**: Move complex ternary className logic into named variants or data-attribute-driven CSS
- **Retire wizardStyles.ts pattern**: Replace centralized raw-Tailwind string objects with semantic token classes as wizard components are migrated

Rule of thumb: After migration, a component's JSX should be readable without scrolling horizontally through className attributes.

**Progressive Disclosure Migration - High Risk, Feature Flag**
- Port marginalia system
- Port drawer components
- Add suggested actions in margins
- Feature flag: `FEATURE_PROGRESSIVE_DISCLOSURE`
- Test with flag on/off

**Done when:**
- Game session page using new design system
- No content jumping during streaming
- All interactive elements keyboard accessible
- No contrast violations
- Can toggle risky features on/off via flags

### Phase 3: Polish (Only When Needed)

**Virtualization** - Add only if long game sessions (200+ turns) show measurable slowdown. Test first, implement if needed.

**Full Accessibility Audit** - One manual screen reader pass on core game session flow. Use NVDA or VoiceOver. Fix critical issues only.

**Theming System** - World-specific themes nice-to-have, not required for launch. CSS variables already support it, just need examples when someone asks for it.

**Library/Wizard Pages** - Workshop layout for creation flows. Lower priority than game sessions (less used, less critical).

**Animation Polish** - Subtle transitions, `prefers-reduced-motion` support. Add if time permits, not blocking.

**Bundle Optimization** - Code splitting, lazy loading. Add only if initial load feels slow (measure first).

---

## Defer Until Pain Appears

Don't build these unless they become actual problems:

**Virtualization**
- Trigger: Game sessions over 200 turns feel sluggish
- Test: Profile performance first, verify it's actually the DOM (not API calls, not state updates)
- Then: Add React Virtuoso or similar

**Formal Documentation System**
- Trigger: Can't remember how components work or someone else needs to contribute
- Until then: Brief comments in code sufficient

**Multiple Themes**
- Trigger: User explicitly asks for world-specific theming
- Until then: CSS variables prepared but no example themes needed

**Comprehensive Test Suite**
- Trigger: Regressions start appearing frequently
- Until then: Manual testing on key flows sufficient

**Advanced Accessibility**
- Trigger: User with disability reports issue or wants to help test
- Until then: WCAG AA floor + one manual screen reader pass sufficient

**Performance Monitoring Dashboard**
- Trigger: Can't tell if performance is improving or regressing
- Until then: Browser DevTools + manual testing sufficient

---

## Rollback Rules

**When to rollback immediately:**
- Streaming changes break AI text generation
- Layout changes make game unplayable
- Performance gets measurably worse (not just feels different)
- Critical accessibility regression (keyboard nav breaks, focus traps introduced)

**How to rollback:**
- **CSS changes:** Revert CSS variable values, fallback to old styles
- **Streaming logic:** Feature flag to disable buffering, fall back to old real-time rendering
- **Progressive disclosure:** Feature flag to hide new patterns, show old UI
- **Component changes:** Keep old components around until migration proven stable

**Feature flags for high-risk changes:**
- `FEATURE_BUFFERED_STREAMING` - Buffered token rendering vs real-time
- `FEATURE_PROGRESSIVE_DISCLOSURE` - New drawer/HUD patterns vs old UI
- `FEATURE_VIRTUALIZATION` - Virtualized long sessions vs render everything

Don't need feature flags for:
- Typography changes (CSS-only, easy to revert)
- Color changes (CSS-only, easy to revert)
- Component refactors that don't change UX

---

## Component Migration Priority

Migrate in this order based on impact and dependencies:

**Must migrate (blocks everything else):**
- Game session layout (Manuscript archetype)
- Input field (bottom-docked, streaming-aware)
- AI response container (buffered rendering, scroll anchoring)

**Should migrate (high value):**
- Character stats HUD
- Suggested actions
- Dice roll display

**Can migrate later (nice to have):**
- Library pages
- Wizard flows
- Settings pages
- Admin interfaces

**Don't migrate (low traffic or scheduled for removal):**
- One-off legacy pages
- Experimental features
- Deprecated flows

---

## Testing Strategy

Keep it simple and practical.

**Before shipping any change:**
- Manual test on game session page (most critical path)
- Use dev harness routes for isolated component testing: `/dev/game-session` and `/dev/game-session-components`
- Test on mobile viewport (Chrome DevTools responsive mode)
- Test keyboard navigation (Tab through everything)
- Check contrast with browser extension (axe DevTools free version)
- Build Storybook and verify updated stories render for touched surfaces (`npm run build-storybook`)

**Before shipping progressive disclosure changes:**
- Feature flag on, test full game session
- Feature flag off, verify old UI still works
- Test drawer open/close doesn't shift content

**Once during migration:**
- Manual screen reader test (NVDA or VoiceOver) on game session flow
- Profile long game session (DevTools Performance tab) to check if virtualization needed

**Don't need:**
- Formal test plans
- Cross-browser testing matrix (target modern browsers, Chrome/Firefox/Safari latest)
- Automated visual regression tests (too much overhead for solo dev)
- Unit tests for components (integration testing via manual usage sufficient)

---

## Migration Checklist

Use this to track progress and know when each phase is done.

**Phase 0: Prototype (Build in design-system.html)**
- [ ] Typography examples built (all heading levels, body text, system labels)
- [ ] Fonts loaded and rendering correctly (EB Garamond, JetBrains Mono, Inter)
- [ ] Color palette examples with contrast ratios shown
- [ ] Semantic token examples created
- [ ] Streaming text demo working (buffered rendering, scroll anchoring)
- [ ] CLS measured on prototype (< 0.10)
- [ ] Skeleton state examples built
- [ ] Core components built (buttons, inputs, badges, alerts, cards, drawers)
- [ ] All component states shown (hover, active, disabled, loading)
- [ ] Manuscript layout prototype built
- [ ] Drafting grid background working
- [ ] Bottom-docked input prototype
- [ ] Floating HUD prototype
- [ ] Marginalia examples built
- [ ] Drawer component prototypes working
- [ ] Suggested actions examples
- [ ] Game-session composition prototypes:
  - [ ] Narrative reading surface with EB Garamond at proper measure/line-height
  - [ ] Streaming text container (skeleton → streaming → complete states)
  - [ ] Choice selector positioned within Manuscript layout
  - [ ] Bottom-docked input with send button and streaming-disabled state
  - [ ] Character stat HUD (collapsed and expanded states)
  - [ ] Narrative scroll with multiple history segments
  - [ ] Choice outcome callout inline with narrative
  - [ ] Drawer/marginalia for character details, inventory, journal
- [ ] Keyboard navigation tested on all prototypes
- [ ] Contrast checked with WebAIM
- [ ] Prototypes validated and ready to migrate

**Phase 1: Clean Slate (Remove Existing Styling Before Migration)**
- [ ] Legacy style source audit complete for game session surfaces
- [ ] Legacy style source audit complete for non-game-session surfaces (#1046)
- [ ] Gray → zinc palette mapping documented across all three token layers
- [ ] Legacy CSS classes flagged (`.btn`, `.btn-primary`, `.card`, `.text-link-*` in globals.css)
- [ ] Existing scroll snap CSS on `.narrative-history-container` evaluated
- [ ] TS design-tokens directory (`src/lib/design-tokens/`) included in audit scope
- [ ] Storybook mapping table created for audited game-session surfaces (keep/update/deprecate)
- [ ] Storybook mapping table created for audited non-game-session surfaces (keep/update/deprecate)
- [ ] Feature flag infrastructure set up (#1039)
- [ ] Keep/remove/defer map written and linked to #1037
- [ ] Keep/remove/defer map written and linked to #1046
- [ ] Legacy visual classes/styles removed or neutralized per plan
- [ ] Game session still usable on neutral baseline
- [ ] No unresolved styling conflicts blocking migration issues

**Phase 2: Migrate (Apply to Actual App)**
- [ ] TS design-tokens updated (`src/lib/design-tokens/tokens/primitives.ts`) — gray → zinc
- [ ] CSS variables updated in globals.css — gray → zinc
- [ ] Both token layers verified consistent
- [ ] Fonts loaded in production app
- [ ] Semantic tokens applied to game session
- [ ] Buffered streaming ported to production (targeting NarrativeHistoryManager/NarrativeHistory level)
- [ ] Existing scroll snap CSS evaluated/replaced
- [ ] Scroll anchoring implemented in app
- [ ] Skeleton states added to real containers
- [ ] Feature flag: FEATURE_BUFFERED_STREAMING added
- [ ] CLS verified < 0.10 in production
- [ ] Components ported to app component library
- [ ] Game session using new components
- [ ] ActiveGameSession restructured: two-column → single-column Manuscript
- [ ] narrativeMaxHeight constraint removed
- [ ] PageLayout/Hero wrapper evaluated for game session
- [ ] Drafting grid background in production
- [ ] Bottom-docked input implemented
- [ ] Floating HUD added
- [ ] Marginalia system ported
- [ ] Contextual drawers migrated
- [ ] Suggested actions in production
- [ ] Feature flag: FEATURE_PROGRESSIVE_DISCLOSURE added
- [ ] Tested with flags on/off
- [ ] No content jumping in production
- [ ] Keyboard navigation works on production game session
- [ ] Migrated components use minimal markup (no unnecessary wrapper divs, no 10+ class utility chains)
- [ ] Storybook stories updated for migrated components/layouts in same PR
- [ ] `npm run build-storybook` passes after migration changes

**Phase 3: Polish (As Needed)**
- [ ] Virtualization (if long sessions slow)
- [ ] Manual screen reader pass (NVDA or VoiceOver)
- [ ] Example theme (if requested)
- [ ] Workshop layout (library/wizards)
- [ ] Animation polish
- [ ] Bundle optimization (if load slow)

---

## What Got Cut from Original Plan

**Removed (overengineered for solo dev):**
- Fixed weekly timelines (unrealistic for part-time work)
- Formal phase gates and stakeholder approval
- Team communication plans (standups, demos, updates)
- Adoption metrics (80% component usage, etc.)
- Comprehensive documentation system
- Formal accessibility compliance program
- Performance monitoring dashboard
- End-to-end test automation
- Visual regression testing
- Gradual rollout percentages (10% → 50% → 100%)
- Emergency rollback procedures with database migrations
- Design system governance committee
- Breaking change policy and versioning

**Kept (actually useful):**
- Priority order (Now/Next/Later)
- Non-negotiables checklist
- Rollback rules for risky changes
- Feature flags for high-risk UX changes
- Manual testing approach
- Practical accessibility floor (WCAG AA basics)
- Component migration priority
- "Defer until pain appears" triggers

---

## Success Criteria

**Phase 0 (Prototype) successful when:**
- All designs working in design-system.html
- Streaming demo shows no content jumping (CLS < 0.10)
- Components look and feel right in prototypes
- Keyboard navigation works on all prototype elements
- Validated that designs solve the stated problems
- Confident enough to apply to production

**Phase 1 (Clean Slate) successful when:**
- Legacy game-session styling debt is removed from migration target surfaces
- Neutral baseline is stable and usable
- Migration can proceed without inheriting old visual artifacts
- Storybook mapping is complete for affected surfaces and identifies stale stories for cleanup

**Phase 2 (Migrate) successful when:**
- Production game session using new design system
- Can play full game session without content jumping
- Typography consistent across migrated pages
- All interactive elements keyboard accessible
- No contrast violations in main UI
- Progressive disclosure patterns feel natural (or can be toggled off)
- No measurable performance regression from migration
- Storybook build passes with updated stories reflecting migrated UI behavior

**Measure success by:**
- CLS score < 0.10 in production (DevTools Performance tab)
- Can navigate game session entirely with keyboard
- Contrast checker shows no failures on production
- Long game sessions (100+ turns) don't feel slow

**Qualitative success:**
- Prototypes validated the approach before migration
- Migration was low-stress (designs already proven)
- Game sessions feel more polished
- Reading AI text more comfortable
- Advanced features more discoverable

---

## Next Actions

- [ ] Validate this prototype-first, clean-slate-second approach
- [ ] Create epic integration branch: `codex/1020-design-system-integration` from latest `develop`
- [ ] Measure current CLS baseline (DevTools Performance tab on game session) for comparison
- [ ] Set up feature flag infrastructure (see #1039 — simple config for risky changes, prerequisite for Phase 2)
- [ ] Start Phase 0: Build typography examples in design-system.html
- [ ] Build game-session-specific composition prototypes in design-system.html (narrative surface, choice selector, HUD, docked input)
- [ ] Build streaming demo in design-system.html to test buffered rendering
- [ ] Start Phase 1: Complete style inventory and removal map (#1037)
- [ ] Complete non-game-session style inventory and removal map (#1046)
- [ ] Build Storybook surface mapping for game-session migration targets (stories to keep/update/deprecate)
- [ ] Execute clean-slate cutover on game-session surfaces (#1038)
- [ ] Keep epic #1020 issue checklist updated as phases move
