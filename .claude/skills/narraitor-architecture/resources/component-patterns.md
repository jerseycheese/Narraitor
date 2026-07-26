# Component Patterns in Narraitor

Follow existing component organization and keep UI code easy to discover.

## Organization
- Domain/feature components live under `src/components/` (e.g., `world/`, `character/`, `narrative/`, `journal/`, `inventory/`).
- Cross-domain components go in `src/components/shared/`.
- UI primitives (Button, Input, Dialog, Card, etc.) live in `src/components/ui/` and use lowercase filenames.

## Naming
- Use PascalCase for component files.
- Follow the casing and folder structure already used in the target area (some domain folders are lowercase).
- Use `index.ts` files for local re-exports when that pattern exists in the folder.

## Client vs server
- Components using hooks or browser APIs must include `'use client'` at the top.
- Keep data-loading logic in server components or route handlers when possible.

## Form controls
- Prefer existing `src/components/ui` primitives over raw HTML form elements.
- Use `var(--color-*)`, `var(--space-*)`, etc. design tokens for styling — plain CSS, no Tailwind.

## Storybook
- Place stories in `src/stories/` following existing folder patterns.
- When adding a new complex component, add at least a default and an edge-case story.
