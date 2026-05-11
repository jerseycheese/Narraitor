# Releases

Narraitor is pre-1.0, so releases get tagged manually from `develop` and fast-forwarded to `main`. Each entry below covers what's in the tag, what's known to still be in flight, and what's lined up next. The full release process lives in [release-process.md](public_docs/development/release-process.md).

---

## v0.5.0-design-system — 2026-05-11

This is where the multi-theme design system migration goes public. Phases 0-2 of the Mechanical Manuscript redesign are in — the umbrella epic is [#1020](https://github.com/jerseycheese/narraitor/issues/1020), which closed yesterday once the last gate items merged. Token-level theming ships here; the structural differentiation piece between themes is what v0.6.0 picks up.

**What's in this release**

- Three switchable design systems — DS1 (sharp/archival), DS2 (warm/literary), DS3 (mechanical/manuscript) — each with light and dark mode. Theme choice persists across sessions.
- Full token migration: hardcoded colors, spacing, typography, and shadows in TSX/CSS replaced with design tokens. Tailwind dependency removed entirely ([#1086](https://github.com/jerseycheese/narraitor/pull/1097)).
- Per-theme token files (`src/lib/theme/themes/ds{1,2,3}.css`) plus `ThemeProvider`, `useTheme()` hook, and a wired-up Storybook theme switcher.
- Game session redesign: manuscript overlay styling, per-theme game-session layout, narrative streaming stability (CLS < 0.10 sign-off), marginalia term definition system, progressive disclosure behind feature flags.
- Non-game-session surfaces brought into the system: home, worlds list, world detail/edit, characters list, character detail/edit, journal, settings, dev tooling.
- Cross-theme audit pass and follow-on cleanup — wizard layouts, form wrappers, collapsible toggles, journal panes, classless buttons all resolved across DS1/DS2/DS3.
- [DESIGN.md](DESIGN.md) at the repo root as the canonical AI-readable summary of the system. Canon order pinned: showcase pages > Storybook > app code.
- [ADR-011](public_docs/decisions/adr-011-three-design-systems.md) documenting the three-design-systems decision and the structural-differentiation roadmap.
- Release model itself ([#1170](https://github.com/jerseycheese/narraitor/pull/1210)): `main` is release-only, `develop` is rolling, branch protection rebuilt accordingly.

The headline integration PR is [#1081](https://github.com/jerseycheese/narraitor/pull/1081). The last two gate items — GuidedFirstTimeExperience wizard styling ([#1199](https://github.com/jerseycheese/narraitor/issues/1199)) and worlds journal DS treatment ([#1159](https://github.com/jerseycheese/narraitor/issues/1159)) — closed together via [#1200](https://github.com/jerseycheese/narraitor/pull/1200), which is what cleared the way for this release.

**Known incomplete**

DS1, DS2, and DS3 currently differ at the token layer — color, font, shadow — but share the same component layouts. The structural differentiation pass (distinct spacing scales, shape vocabularies, density per theme) is tracked in epic [#1165](https://github.com/jerseycheese/narraitor/issues/1165) with children [#1163](https://github.com/jerseycheese/narraitor/issues/1163), [#1166](https://github.com/jerseycheese/narraitor/issues/1166), [#1167](https://github.com/jerseycheese/narraitor/issues/1167), [#1168](https://github.com/jerseycheese/narraitor/issues/1168), [#1169](https://github.com/jerseycheese/narraitor/issues/1169), and lands in v0.6.0. That's the work that turns the three themes from a palette swap into three genuinely distinct points of view.

A handful of low-priority polish items are still open and don't block the release — world card placeholder images going white in dark mode ([#1113](https://github.com/jerseycheese/narraitor/issues/1113)), range sliders and checkboxes missing aria-labels ([#1118](https://github.com/jerseycheese/narraitor/issues/1118)), and a cosmetic field-concatenation bug on review/journal screens ([#1205](https://github.com/jerseycheese/narraitor/issues/1205)). AI-inferred skill checks ([#918](https://github.com/jerseycheese/narraitor/issues/918), with [#1207](https://github.com/jerseycheese/narraitor/issues/1207) as related context) is still on the queue, separate from this slice of work.

**What's next**

- `v0.6.0-theme-differentiation` — the structural differentiation work from [#1165](https://github.com/jerseycheese/narraitor/issues/1165) and its children, picking up where this release leaves off.

---

## v0.4.0-pre-design-system — 2026-05-10

This is the baseline tag, cut right before the multi-theme design system migration lands publicly. The idea is to give anyone who's pinned to a SHA today a stable point they can keep using while the design work plays out on `develop`.

**What's in this release**

- World creation wizard with AI-assisted attributes and skills
- Character creation, journal, and the AI-driven narrative engine (Gemini-backed, all calls routed server-side)
- IndexedDB persistence so sessions survive a refresh
- Three template worlds out of the box: Western, Sitcom, Adventure
- Secure API key handling and per-IP rate limiting (#478)

**Known incomplete**

The design system migration is mid-flight on `develop`. Phases 0–2 already merged via #1081, the structural differentiation piece is tracked in #1165, and #1020 is the umbrella epic that ties the whole thing together. A few smaller items are also still open — AI-inferred skill checks (#918, with #1207 as related context) and a stale `narraitor-character-store` localStorage cleanup that hasn't gotten its own issue yet.

**What's next**

- `v0.5.0-design-system` — cuts as soon as the #1020 epic closes out, brings the multi-theme tokens public
- `v0.6.0-theme-differentiation` — structural differentiation work from #1165 follows that
