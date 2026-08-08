# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Solo players and storytellers running a single-player, browser-based narrative RPG. They
bring their own AI provider key (BYO-key); all data lives locally (IndexedDB). The draw, in
the README's words: tabletop-style RPG experiences "without coordinating schedules or finding
a game master." Context: building a world, creating characters, then reading prose and making
choices over long sessions.

## Product Purpose

Narraitor is a world-adaptive AI storytelling app. You define a fictional world's rules,
attributes, and tone; create characters that fit it; and play a generated, choice-driven
story with tracked consequences, inventory, and a journal. The story adapts to your world's
voice rather than defaulting to generic fantasy. No backend database; generation runs through
the player's own key. Success is an immersive, coherent, replayable story loop that stays out
of its own way. Currently in v1.0 polish + launch-gate phase.

## Positioning

The world you define is what steers the prose. Most generated-story products hand you a
character inside someone else's setting, or a chat box with a genre preset. Narraitor makes
the world a first-class authored object; its attributes, skills, tone, and rules are data the
generator reads on every turn, so a hardboiled noir world and a high-fantasy world produce
measurably different narration from the same engine.

Two structural commitments a neighboring product can't casually copy. Choices carry tracked
consequences across turns (an alignment axis and a trust contract, not just branching text).
And there's no server-side account or database, so the player's key and the player's data
both stay on their machine.

## Operating Context

Long reading sessions in a browser tab, desktop and mobile. The core loop: build a world,
create a character in it, then play turns of generated prose, picking from offered choices,
with inventory, journal, and consequence state accumulating alongside.

Before any of that, the player has to supply their own Gemini API key. That's a real
onboarding step with real friction, and it happens outside the app. The player goes to
Google's console, creates a key, and pastes it back in. Any surface that sells the product
has to survive that ask honestly.

Sessions are resumable and long-lived. Players return to worlds and characters they made
earlier, so the app is as much a library of your own stuff as it is a game.

## Capabilities and Constraints

- Next.js 15 (App Router) + React 19, TypeScript. Plain CSS with design tokens. No Tailwind,
  no `cva`/`cn()` (both removed deliberately).
- Zustand 5 stores under `src/state/`, persisted to IndexedDB. There is no backend database
  and no user account system.
- Generation runs through `src/lib/ai/` against Google Gemini (`gemini-2.5-flash`), keyed by
  the player's own provider key. Gemini is the only provider.
- Storybook is the canon design surface (ADR-012). The retired `/dev/design-system*` style
  guide is not coming back.
- Terminology: worlds, characters, narrative/turns, choices, consequences, inventory, journal,
  lore. "AI" never appears in player-facing copy, not in labels and not in marketing text.
- Undecided: pricing, licensing, and any hosted or multiplayer tier. v1.0 shipped free and
  single-player; nothing beyond that has been settled, and no surface should imply otherwise.

## Brand Commitments

These are settled and binding. Design work inherits them rather than relitigating them.

- **DS3, "The Mechanical Manuscript"** is the design system: aged paper, drafting ink, dot
  grid. ADR-013 (superseding ADR-011) collapsed three design systems into this one. It was
  chosen deliberately rather than drifted into. The system isn't switchable; only light/dark
  is.
- **Three fonts, all loaded via `next/font/google`** and mapped to semantic roles in
  `src/lib/theme/themes/ds3.css`: Newsreader (`--font-narrative`), Fira Code
  (`--font-system`), DM Sans (`--font-interface`).
- **Tokens carry the variation.** Colors, spacing, and type live in
  `src/lib/theme/themes/ds3.css` and `_shared-tokens.css`; components stay theme-blind.
  Stylelint enforces it, rejecting raw hex, named colors, and `rgb()` in product CSS.
- **Name and mark**: "Narraitor". Logo at `public/narraitor-logo.svg` (and `.png`), favicon at
  `public/favicon.svg`.
- **Don't introduce a third chrome.** There are two surfaces, app and manuscript. A new page
  picks one. The last time a surface was added to differentiate part of the product, the two
  shells drifted until the same three links looked like two different apps.

## Brand Personality

Archival and literary. The interface borrows from drafting tables, manuscripts, and design
notebooks, surfaces that imply care and craft. It should read like writing tools rather than
entertainment software: immersive, unobtrusive, calm typographic restraint, with the
generated story (not the UI, and never the AI) as the hero. The AI is never named or themed
in player-facing copy.

## Anti-references

- "Game UI" sheen, neon, glassmorphism. The app is deliberately not entertainment software.
- Flashy AI-gimmick products: robot/chatbot aesthetics, "powered by AI" badges, sparkle
  icons. Narraitor keeps "AI" out of UI strings entirely.
- Sterile corporate SaaS dashboards: gray-on-gray enterprise chrome, soulless admin panels.

## Evidence on Hand

Real, usable:

- The product itself. Every route runs locally, and the story loop works end to end with a
  key. Screenshots and captures of actual play are available and are the strongest proof
  material on hand.
- Architecture decisions of record at `public_docs/architecture/` (ADR-001 through ADR-013).
- Three generated images at `public/visual-assets/`: `world-cyberpunk.png`,
  `portrait-cyberpunk.png`, `portrait-fantasy.png`. Both `/` and `/about` currently use the
  same `world-cyberpunk.png`.
- The project is open source at https://github.com/jerseycheese/Narraitor, and `/about`
  already says so.
- Site copy already written in `src/app/layout.tsx`: "play a story in any world you can
  imagine" and "Build a world, create a character, and make the choices that steer the story."

Absent, and not to be fabricated:

- No users, no user counts, no testimonials, no reviews, no case studies.
- No press, no awards, no third-party logos.
- No benchmarks, uptime figures, or performance claims.
- No pricing and no licensing terms. Never describe the product as "free" in public copy.

## Product Principles

- Reading first. Long-form narrative is the load-bearing surface; line length, rhythm, and
  legibility win over everything else.
- One system, not a skin. DS3 is structurally deliberate rather than just recolored; tokens
  carry the variation, components stay theme-blind.
- Storybook is canon. When production drifts from Storybook, production is wrong (ADR-012).
- No seams showing. Never surface the generation machinery in player-facing copy.
- Earn density. Show consequence, state, and inventory affordances only when there's data
  behind them.

## Accessibility & Inclusion

WCAG 2.1 AA. 4.5:1 minimum text contrast, verified in light and dark. Visible focus indicators
in both light and dark; no color-only signaling; full keyboard operation; text resizes to 200%
without breaking; touch targets at least 44px; honor reduced-motion.
