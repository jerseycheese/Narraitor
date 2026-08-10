# Releases

Releases get tagged manually from `develop` and fast-forwarded to `main`. Each entry below covers what's in the tag, what's known to still be in flight, and what's lined up next. The full release process lives in [release-process.md](public_docs/development/release-process.md).

---

## v1.1.0 - 2026-08-10

Where v1.0 got the loop working end to end, v1.1 is the pass that makes it look and feel like it's supposed to. The bolder DS3 redesign — real accent, a louder dot grid, drafting marks, a named type scale, a brand/product surface split — lands in full, plus the two accessibility gaps and the error-reporting gap named as known-incomplete in the v1.0 notes. The v1.1 milestone closed 16 issues; this tag also carries a batch of unmilestoned play-loop and UI work that shipped alongside it.

**What's in this release**

- Bolder DS3, all the way through — epic [#1543](https://github.com/jerseycheese/narraitor/issues/1543). A deeper ink-blue accent and a louder dot grid ([#1621](https://github.com/jerseycheese/narraitor/issues/1621)), a five-mark drafting-marks family at one weight ([#1617](https://github.com/jerseycheese/narraitor/issues/1617)), a real named type scale with the highest-traffic sizes migrated onto it ([#1622](https://github.com/jerseycheese/narraitor/issues/1622)), a brand-vs-product surface split so marketing pages read differently from the app ([#1623](https://github.com/jerseycheese/narraitor/issues/1623)), room for generated art in list-view cards ([#1625](https://github.com/jerseycheese/narraitor/issues/1625)), and a real page grid with defined widths, columns, and gutters ([#1677](https://github.com/jerseycheese/narraitor/issues/1677)). DESIGN.md got rewritten with the real values instead of DS1's leftover numbers ([#1626](https://github.com/jerseycheese/narraitor/issues/1626)).
- Two accessibility gaps named in the v1.0 notes are closed: full keyboard control with visible focus indicators ([#276](https://github.com/jerseycheese/narraitor/issues/276)), and touch targets floored at 44px app-wide, including small buttons that were only tall enough, not wide enough ([#1477](https://github.com/jerseycheese/narraitor/issues/1477)). `prefers-reduced-motion` is now honored across the app ([#1678](https://github.com/jerseycheese/narraitor/issues/1678)).
- Client-side error reporting exists now — production failures are visible instead of silent ([#1641](https://github.com/jerseycheese/narraitor/issues/1641)), the third gap named in the v1.0 notes.
- The critical bug from the milestone: cautious play could loop on clue-following indefinitely instead of escalating ([#1680](https://github.com/jerseycheese/narraitor/issues/1680)).
- Two story-loop improvements: narrative segment length now actually scales with decision weight instead of being wired to a dead 3-5 sentence template ([#1585](https://github.com/jerseycheese/narraitor/issues/1585)), and prose that reused the same phrases turn after turn now gets flagged and varied ([#1681](https://github.com/jerseycheese/narraitor/issues/1681)).
- Alongside the milestone: narrative prose streams in progressively instead of popping in after generation, portrait creation got preset avatars and image upload, journal entries got a table view, and skill inference now reads what a choice says rather than where it sits in the list.

**Known incomplete**

Multi-provider AI support ([#878](https://github.com/jerseycheese/narraitor/issues/878)) stays out — Gemini via BYO-key is still the only path. Platform and dependency upgrades ([#1368](https://github.com/jerseycheese/narraitor/issues/1368)) and visual-regression/test infrastructure work ([#1369](https://github.com/jerseycheese/narraitor/issues/1369)) don't need a release gate and stay on their own tracks. General polish batches ([#1475](https://github.com/jerseycheese/narraitor/issues/1475), [#1494](https://github.com/jerseycheese/narraitor/issues/1494)) and monetization ([#495](https://github.com/jerseycheese/narraitor/issues/495)) are deliberately out of scope for this tag.

**What's next**

- Commercialization track ([#495](https://github.com/jerseycheese/narraitor/issues/495)), platform upgrades ([#1368](https://github.com/jerseycheese/narraitor/issues/1368)), and whatever the next visual-identity or play-loop pass turns up.

---

## v1.0.0 - 2026-08-04

This is 1.0, and what makes it 1.0 is that the whole loop holds together now: describe a world, create a character who fits it, play a story that responds to what you choose, and reach an ending that reads like an ending. Narraitor started from wanting tabletop RPG sessions without coordinating four schedules, and this is the first tag where a stranger can open the app and get that without a walkthrough. The v1.0 milestone closed 60 issues across 554 commits since [v0.5.0](https://github.com/jerseycheese/narraitor/releases/tag/v0.5.0-design-system), most of them about making pieces that already existed work together in someone else's browser.

**What's in this release**

- Bring your own key. Generation runs on a Google Gemini key entered once under Settings, then Providers. It's encrypted in the browser and sent per request, so there's no server-held key, no account, and no sign-up ([#891](https://github.com/jerseycheese/narraitor/issues/891), [#892](https://github.com/jerseycheese/narraitor/issues/892), [#893](https://github.com/jerseycheese/narraitor/issues/893)).
- A public front door: a landing page ([#1365](https://github.com/jerseycheese/narraitor/issues/1365)), an About page with copy that says what this actually is rather than describing a generic storyteller chatbot ([#1421](https://github.com/jerseycheese/narraitor/issues/1421)), a privacy note and terms ([#1366](https://github.com/jerseycheese/narraitor/issues/1366)), cookieless funnel analytics ([#1367](https://github.com/jerseycheese/narraitor/issues/1367)), and share metadata so a pasted link previews properly ([#1636](https://github.com/jerseycheese/narraitor/issues/1636)).
- One design system. DS1, DS2, and DS3 collapsed down to DS3 alone under [ADR-013](https://github.com/jerseycheese/narraitor/pull/1526), which supersedes ADR-011. Light and dark is the only switch left. The legacy shadcn token layer went with it ([#1527](https://github.com/jerseycheese/narraitor/pull/1527)), theme selectors got flattened ([#1546](https://github.com/jerseycheese/narraitor/issues/1546)), and the app shell collapsed to a single chrome ([#1655](https://github.com/jerseycheese/narraitor/issues/1655)).
- Storybook is the single canon surface ([#1488](https://github.com/jerseycheese/narraitor/issues/1488), [ADR-012](https://github.com/jerseycheese/narraitor/issues/1484)). The old `/dev/design-system` living style guide is retired, and the stories run backend-free on MSW plus store decorators.
- The play loop got the attention it needed: inventory with generated item images, lore dedup that catches role aliases, decisions weighted Minor / Major / Critical with alignment and trust tracking, story summaries that stop retrying forever ([#1575](https://github.com/jerseycheese/narraitor/issues/1575)), epilogues that close a story instead of teasing another one ([#1578](https://github.com/jerseycheese/narraitor/issues/1578), [#1605](https://github.com/jerseycheese/narraitor/pull/1605)), lethality rebalanced so one bad roll doesn't end a run ([#1426](https://github.com/jerseycheese/narraitor/issues/1426)), and generation failures that surface instead of hanging the session ([#1429](https://github.com/jerseycheese/narraitor/issues/1429), [#1478](https://github.com/jerseycheese/narraitor/issues/1478)).
- Less surface to maintain. The world and character template systems came out entirely ([#1454](https://github.com/jerseycheese/narraitor/issues/1454), [#1455](https://github.com/jerseycheese/narraitor/issues/1455)), archetype generation went with them, and knip, skott, and a CSS audit now run in CI so dead code doesn't pile up quietly.
- Two QA passes fed the punch lists in [#1423](https://github.com/jerseycheese/narraitor/issues/1423)-[#1438](https://github.com/jerseycheese/narraitor/issues/1438) and [#1574](https://github.com/jerseycheese/narraitor/issues/1574)-[#1590](https://github.com/jerseycheese/narraitor/issues/1590), every one of which closed before this tag.

The last four issues ahead of the tag were about docs rather than code: a README rewrite that had been advertising a template system which no longer exists ([#1637](https://github.com/jerseycheese/narraitor/issues/1637)), a correctness sweep across `public_docs` ([#1638](https://github.com/jerseycheese/narraitor/issues/1638)), an archive pass over stale branches and dead config ([#1639](https://github.com/jerseycheese/narraitor/issues/1639)), and the share metadata above. The release tracking issues are [#1320](https://github.com/jerseycheese/narraitor/issues/1320) and [#1417](https://github.com/jerseycheese/narraitor/issues/1417).

**Known incomplete**

The bolder DS3 redesign is deferred to v1.1. What ships here is DS3 as it landed during the collapse, which is coherent but deliberately restrained. Epic [#1543](https://github.com/jerseycheese/narraitor/issues/1543) and its children cover the real accent treatment, the dot grid, a proper type scale, drafting marks, and the brand-versus-product surface split. DESIGN.md still carries type-scale numbers from the old DS1, which [#1626](https://github.com/jerseycheese/narraitor/issues/1626) fixes once that work lands.

Two accessibility gaps are worth naming up front. Full keyboard control with visible focus indicators is [#276](https://github.com/jerseycheese/narraitor/issues/276), and touch targets under the 44px WCAG 2.5.5 threshold are [#1477](https://github.com/jerseycheese/narraitor/issues/1477). Both are open, both are real, and both are deferred to v1.1.

There's no client-side error reporting, so a production failure in someone else's browser is invisible from here ([#1641](https://github.com/jerseycheese/narraitor/issues/1641)). Vercel Analytics is wired up for the launch funnel only and doesn't capture errors. That was a deliberate call for 1.0, not an oversight.

**What's next**

- `v1.1` - the bolder DS3 work from [#1543](https://github.com/jerseycheese/narraitor/issues/1543), plus the two deferred accessibility items ([#276](https://github.com/jerseycheese/narraitor/issues/276), [#1477](https://github.com/jerseycheese/narraitor/issues/1477)) and error reporting ([#1641](https://github.com/jerseycheese/narraitor/issues/1641)).

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
- [ADR-011](public_docs/architecture/ADR-011-three-design-systems.md) documenting the three-design-systems decision and the structural-differentiation roadmap.
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
