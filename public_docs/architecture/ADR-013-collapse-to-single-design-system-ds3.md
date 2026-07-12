---
title: "ADR-013: Collapse to a single design system (DS3)"
tags: [architecture, decision, adr, design-system, theming]
created: 2026-07-11
updated: 2026-07-11
---

# ADR-013: Collapse to a single design system (DS3)

**Status**: Accepted
**Date**: 2026-07-11

Supersedes [ADR-011](ADR-011-three-design-systems.md) in full — the three-design-system architecture, `data-theme` switching, and structural-differentiation principle it documents are retired. [ADR-012](ADR-012-storybook-single-canon-surface.md)'s decision is separate and unaffected: Storybook stays the single canon surface, it just renders one theme now instead of three.

## The Situation

Three structurally-different design systems have shipped together since [ADR-011](ADR-011-three-design-systems.md): DS1 "The Drafting Table," DS2 "Warm Earth," DS3 "The Mechanical Manuscript." Users picked one in a theme switcher, and the differences were real — different fonts, different corner radii, different spacing rhythm, not just a palette swap.

Nobody ever asked for that choice. Across the life of the project, there's no record of a user requesting the ability to switch design systems, and it was never wired to anything that would have made switching meaningful, like a world's genre — ADR-011 explicitly ruled per-world theming out as scope creep. It was a feature that existed because the token architecture made it *possible*, not because anyone needed it.

Meanwhile it kept costing real engineering effort. Every visual surface had to be checked across three themes times two color schemes — six render contexts per screen instead of two. The presentation layer (CSS plus Storybook stories) sat at roughly 1.6x the size of `src/lib/ai`, the actual AI engine that's the point of the app. Visual regression coverage had grown to around 215 macOS-only Playwright baselines, which can't run in cloud CI at all — verifying a visual change meant a local Mac or the dedicated macOS CI job, every time.

And of the three, only one ever had a real point of view. DS1 was `DEFAULT_THEME` — the theme nobody deliberately chose, just where new work landed because it was first. DS2 was a second data point proving the token system could produce something structurally different, not a design anyone was chasing. DS3 — dot-grid texture, aged-paper tone, drafting-ink accent — was the only one of the three that read as an actual idea rather than a default or a proof of concept. It was also the least-exercised in practice, precisely because it was never the theme anyone landed on without deliberately switching to it.

## What We Decided

Collapse to one design system: **DS3**. Delete DS1 and DS2 entirely — their CSS files, their JSX branches, their fonts, the design-system picker in the theme menu, and the visual specs that compared all three. DS3 stops being *a* theme and becomes the only design system Narraitor has. It's not configurable and not switchable; there's nothing left for a component to reason about beyond what a token resolves to.

Light/dark color-scheme toggling is untouched. That's a different axis from design-system choice — an accessibility and personal-preference control, not a visual-identity choice — and it was never in question here. The Appearance menu stays; it just controls light/dark/system now instead of also offering a design-system picker.

The `data-theme="ds3"` attribute, the `ds3.css` filename, and the `DesignSystem`/`THEMES` types in `src/lib/theme/index.ts` all stay exactly as they are in this PR, even though they now name a system of one. That's deliberate — see Implementation Notes.

## Why This Made Sense

The switching mechanism was pure carrying cost with no offsetting benefit. If nobody was choosing DS2 over DS1 for a reason connected to how they wanted to play, keeping both running wasn't preserving a feature anyone used — it was preserving the tax that came with pretending someone might.

DS3 was the deliberate survivor, not the path of least resistance. Keeping DS1 — the existing default — would have been the smaller migration: no `DEFAULT_THEME` change, no SSR attribute change. But DS1 is the theme nobody chose, and it's also the least differentiated of the three. DS3 is the one with an actual identity, even an underdeveloped one, and it's the one a future bolder-design pass (see Implementation Notes) has the most to build on.

### What Else We Considered

- **Keep all three, cut the QA cost some other way** — lazy-load theme CSS, sample fewer visual baselines, drop dark-mode coverage for two of three themes. Rejected: none of that addresses the real problem, which is that two of the three themes serve nobody. Trimming how thoroughly you verify unused code is still carrying unused code.
- **Keep DS1 as the survivor instead of DS3**, since it's the current default and the smaller diff. Rejected — DS1 is the least differentiated of the three and was never a deliberate choice by anyone, including the team. Standardizing on the theme with the least point of view just because it's already the default would lock in the wrong outcome to save a day of migration work.
- **Gate switching behind a feature flag instead of deleting DS1/DS2.** Rejected — a flag with no realistic path back to "on" is dead code with extra ceremony. It still has to type-check, still has to get reasoned about in every future refactor, still shows up in `deps:validate` and `skott`. Deleting is honest about a decision that's already made; a flag pretends it's reversible when it isn't going to be reversed.
- **Bundle this with the "make DS3 bolder" redesign pass.** Rejected — collapsing three themes to one and redesigning the survivor are different kinds of risk (deletion risk vs. design risk), and mixing them makes a large diff impossible to review cleanly. This ADR covers only the collapse; a bolder DS3 is its own follow-up (see Implementation Notes).

## What This Means Going Forward

### Upsides

Measured against `develop` right before this docs pass landed: 151 files changed, +452/-8,549 lines. The more legible breakdown:

- **13 visual spec files deleted outright** (`tests/visual/*-themes.spec.ts` and `theme-switcher.spec.ts`), taking exactly 91 baseline PNGs with them. A handful of surviving specs (about/privacy/terms/welcome/providers pages, choice-consequences, mobile-overflow) got converted from three-theme loops down to one DS3 shot each, dropping more baselines beyond that 91.
- **`ds1.css` and `ds2.css` are gone** — 593 lines. The DS1/DS2 blocks interleaved into the seven shared route stylesheets (`dashboard.css`, `wizard.css`, `legal.css`, `landing.css`, `workshop.css`, `about.css`, `manuscript-session.css`) are stripped too, for roughly another 4,900 net lines — past the ~4,380 the pre-execution plan estimated, once the two full theme files are counted alongside the block-strip.
- **Six components lost their DS1/DS2 JSX branches** (`ChoiceSelector`, `ManuscriptFloatingHud`, `ActiveGameSession`, `ManuscriptSessionShell`, `NarrativeHistory`, the `/dev/game-session` theme-forcer). `ManuscriptFloatingHud` alone collapsed to a single unconditional render path.
- **Fonts went from nine `next/font/google` families to three** (Newsreader, Fira Code, DM Sans survive; Lora, IBM Plex Mono, IBM Plex Sans, Crimson Pro, JetBrains Mono, and Manrope are gone).
- **Every screen's render surface drops from six contexts to two** (3 themes × light/dark down to just light/dark). That's the real QA win; the line counts above are a side effect of it, not the point.
- The macOS-only constraint on the visual suite doesn't go away — Playwright baselines are still platform-pinned regardless of theme count — but there's a third fewer of them to carry in the first place.

### Downsides

Per-theme personalization is gone. If someone genuinely preferred DS2's warmth over DS3's ink-on-paper feel, that option doesn't exist anymore. That's a real loss in the abstract, but weighed against zero recorded users ever exercising it, it's the right trade: a feature nobody used isn't worth 3x the render and QA cost of keeping it around.

DS3 as shipped is still somewhat timid about its own concept. The dot grid is subtle, the ink accent doesn't lean hard into "drafting tool," and there's no real type scale — `DESIGN.md`'s sizing guidance is still DS1's numbers, not yet rewritten for DS3 (see the honesty-pass note added to `DESIGN.md` in this same PR). Collapsing to DS3 doesn't fix any of that on its own; it just means there's one thing left to make bolder instead of three things to keep in sync while doing it.

## Implementation Notes

This PR keeps the `ds3` name everywhere on purpose: the `data-theme="ds3"` attribute, the `ds3.css` filename, and the `DesignSystem`/`THEMES` identifiers in [src/lib/theme/index.ts](../../src/lib/theme/index.ts) all still say "ds3" even though there's nothing left to disambiguate it from. Flattening those to `:root`/bare selectors and deleting the now-vestigial `DesignSystem` type, `THEMES` array, and the `theme`/`setTheme` surface on `useTheme()` is a deliberate follow-up PR, not this one. The flatten shifts selector specificity (`[data-theme="ds3"] .foo` at `(0,1,1)` collapsing to `.foo` at `(0,1,0)`) across roughly 518 selectors, which can move real pixels — that risk deserves its own isolated baseline regen rather than getting folded into this collapse's diff, where it would make an already-large baseline regen harder to attribute.

Also deferred, on purpose, and separately from each other:

- **A bolder DS3** — deeper ink-blue accent, a louder dot grid, drafting marks, a real type scale, a brand-vs-product surface split. A design pass, not a code cleanup, and it changes token values again, which is exactly why this PR doesn't try to update `DESIGN.md`'s numbers yet (see the note added there).
- **The `DESIGN.md` rewrite** that follows the bolder-DS3 pass, once there are real DS3 numbers worth documenting as canon instead of DS1's leftover values.

Since resolved:

- **Removing the legacy shadcn HSL token layer** (`--primary`, `--background`, etc. in [ds3.css](../../src/lib/theme/themes/ds3.css)) — done in #1474. The onboarding tour was the last consumer once the shadcn `ui/*` primitives were re-skinned onto `--color-*`; it now reads the `--color-*` family too, and the legacy block was removed from ds3.css.

## Related Decisions

- [ADR-011](ADR-011-three-design-systems.md) — the three-design-system architecture this supersedes.
- [ADR-012](ADR-012-storybook-single-canon-surface.md) — Storybook as the single canon surface; unaffected by this change, it just renders one theme now instead of three.
- [DESIGN.md](../../DESIGN.md) — the AI-readable design surface, updated with an honesty-pass note pointing here; still documents DS1's old token values pending the deferred rewrite.
- [Design system overview](../design-system/README.md) — landing page for the design-system docs.
