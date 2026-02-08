# Design System Prototype Source

This directory is the source-of-truth for the generated file:

- Output: `/Users/jackhaas/Projects/narraitor/public_docs/design-system/redesign-planning/design-system.html`
- Published copy: `/Users/jackhaas/Projects/narraitor/public/design-system/index.html` (served on Vercel at `/design-system`)
- Build command: `npm run docs:design-system:build`

## Editing workflow

1. Edit source files in this folder (not the generated output).
2. Run `npm run docs:design-system:build`.
3. Commit source changes and regenerated `design-system.html`.

## File map

- `template.html`: document scaffold + placeholders
- `styles.css`: inline style block content
- `content-top/*.html`: ordered body fragments before `#game-session-compositions`
- `sections/game-session-compositions.html`: `#1031` prototype section
- `content-bottom/*.html`: ordered body fragments after `#game-session-compositions`
- `scripts/design-system.js`: inline script block content

## Why this exists

The generated HTML is large. Splitting it into focused source files keeps prototype work manageable and reduces merge conflicts, especially for issue-scoped edits in `#1031`.
