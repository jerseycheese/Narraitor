# Product

<!-- impeccable:product-schema 1 -->

*Verified against the tree on 2026-09-10, at v1.6.0. Every claim below is checkable from a
path in this file. When one stops matching the code, fix it here rather than working around
it, and re-date this line.*

## Platform

web

## Users

Solo players and storytellers running a single-player, browser-based narrative RPG. They bring
their own model key, and all their data lives in the browser. The draw, in README's words, is a
solo role-playing game "where the story answers to the world you built": no group to schedule
and no game master to find. Context is building a world, creating characters, then reading
prose and making choices over long sessions.

## Product Purpose

Narraitor is a world-adaptive storytelling app. You define a fictional world's rules,
attributes, and tone; create characters that fit it; and play a generated, choice-driven story
with tracked consequences, inventory, and a journal. The story adapts to your world's voice
rather than defaulting to generic fantasy. Success is an immersive, coherent, replayable story
loop that stays out of its own way. v1.6 shipped on 2026-09-10. v1.7 is in progress, and its
flagship work charges world costs to the decisions that incur them.

## Positioning

The world you define is what steers the prose. Most generated-story products hand you a
character inside someone else's setting, or a chat box with a genre preset. Narraitor makes the
world a first-class authored object. Its attributes, skills, tone, and rules are data the
generator reads on every turn, so a hardboiled noir world and a high-fantasy world produce
measurably different narration from the same engine.

Two structural commitments a neighboring product can't casually copy. Choices carry tracked
consequences across turns, meaning an alignment axis and a trust contract rather than branching
text. And there's no server-side account or database, so the player's key and the player's data
both stay on their machine.

## Operating Context

Long reading sessions in a browser tab, desktop and mobile. The core loop: build a world,
create a character in it, then play turns of generated prose, picking from offered choices,
with inventory, journal, and consequence state accumulating alongside.

Before any of that, the player configures a provider in the wizard at
`src/components/ai/ProviderWizard.tsx`. For Gemini, OpenRouter and OpenAI that means leaving
the app, creating a key at the provider's own console, and pasting it back in. That is real
onboarding friction, it happens outside the app, and any surface that sells the product has to
survive the ask honestly. Ollama is the exception, and it matters before writing onboarding
copy: it carries `requiresApiKey: false`, so the wizard takes a blank key field and asks only
for a model.

Sessions are resumable and long-lived. Players return to worlds and characters they made
earlier, so the app is as much a library of your own stuff as it is a game.

## Capabilities and Constraints

The stack itself lives in CLAUDE.md and is not repeated here.

- Styling is plain CSS with design tokens. Tailwind, `cva` and `cn()` were all removed
  deliberately, and none of them are coming back.
- State lives in Zustand stores under `src/state/`, persisted to IndexedDB. There is no backend
  database and no user account system.
- Generation runs through `src/lib/ai/`, keyed by the player's own provider key. Gemini
  (`gemini-2.5-flash`, per `src/lib/ai/config.ts`) is the default and the longest-proven.
  OpenRouter, Ollama and OpenAI are available too. The rest of the presets in
  `src/lib/ai/presets.ts` stay out of reach until someone runs a live streamed turn through
  each.
- Storybook is the canon design surface (ADR-012). The retired `/dev/design-system*` style
  guide is not coming back.
- Terminology: worlds, characters, narrative/turns, choices, consequences, inventory, journal,
  lore. "AI" never appears in player-facing copy, not in labels and not in marketing text.
- Undecided: pricing and licensing. No surface should imply a paid tier.
- Settled the other way: accounts and hosted persistence. ADR-014 keeps Narraitor browser-local
  until one of three named triggers fires, so no issue may assume server state or a multiplayer
  tier.

## Brand Commitments

These are settled and binding. Design work inherits them rather than relitigating them.

- **DS3, "The Mechanical Manuscript"** is the design system: aged paper, drafting ink, dot
  grid. ADR-013 (superseding ADR-011) collapsed three design systems into this one. It was
  chosen deliberately rather than drifted into. The system isn't switchable; only light/dark
  is.
- **Three fonts, all loaded via `next/font/google`** and mapped to semantic roles in
  `src/lib/theme/themes/ds3.css`: Newsreader (`--font-narrative`), Fira Code (`--font-system`),
  DM Sans (`--font-interface`).
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
entertainment software: immersive, unobtrusive, calm typographic restraint, with the generated
story as the hero. The generation machinery is never named or themed in player-facing copy.

## Anti-references

- "Game UI" sheen, neon, glassmorphism. The app is deliberately not entertainment software.
- Flashy AI-gimmick products: robot/chatbot aesthetics, "powered by AI" badges, sparkle icons.
  Narraitor keeps "AI" out of UI strings entirely.
- Sterile corporate SaaS dashboards: gray-on-gray enterprise chrome, soulless admin panels.

## Evidence on Hand

Real, usable:

- The product itself. Every route runs locally, and the story loop works end to end with a key.
  Captures of actual play are the strongest proof material on hand.
- Three current screenshots at `public_docs/images/readme-{landing,play,world-creation}.png`,
  embedded in README. These show the shipped DS3 surface.
- Architecture decisions of record at `public_docs/architecture/` (ADR-001 through ADR-014).
- Seven images under `public/visual-assets/`. Four world illustrations sit in `worlds/` as
  `.webp` (`debt-court`, `normandy`, `port-city`, `survey-ship`), which the landing page
  renders per world. The three older PNGs (`world-cyberpunk`, `portrait-cyberpunk`,
  `portrait-fantasy`) serve `/about`, Storybook, and test fixtures.
- The project is open source at https://github.com/jerseycheese/Narraitor, and `/about` links
  to it.
- Site copy already written in `src/app/layout.tsx`: the title is "Narraitor: play a story that
  answers to the world you built", and the description is "Build a world, create a character,
  and make the choices that steer the story. A solo role-playing game that runs in your
  browser."

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
