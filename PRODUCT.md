# Product

## Register

product

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

## Brand Personality

Archival and literary. The interface borrows from drafting tables, manuscripts, and design
notebooks — surfaces that imply care and craft. It should read like writing tools, not
entertainment software: immersive, unobtrusive, calm typographic restraint, with the
generated story (not the UI, and never the AI) as the hero. The AI is never named or themed
in player-facing copy.

## Anti-references

- "Game UI" sheen, neon, glassmorphism — the app is deliberately not entertainment software.
- Flashy AI-gimmick products — robot/chatbot aesthetics, "powered by AI" badges, sparkle
  icons. Narraitor keeps "AI" out of UI strings entirely.
- Sterile corporate SaaS dashboards — gray-on-gray enterprise chrome, soulless admin panels.

## Design Principles

- Reading first — long-form narrative is the load-bearing surface; line length, rhythm, and
  legibility win over everything else.
- Three systems, one soul — DS1/DS2/DS3 differ structurally (ADR-011), never just reskinned;
  tokens carry the variation, components stay theme-blind.
- Storybook is canon — when production drifts from Storybook, production is wrong (ADR-012).
- No seams showing — never surface the generation machinery in player-facing copy.
- Earn density — show consequence / state / inventory affordances only when there's data
  behind them.

## Accessibility & Inclusion

WCAG 2.1 AA. 4.5:1 minimum text contrast, verified in light and dark across all three design
systems (the open #1379 release gate is an AA contrast miss). Visible focus indicators in
every theme; no color-only signaling; full keyboard operation; text resizes to 200% without
breaking; touch targets at least 44px (#1477); honor reduced-motion.
