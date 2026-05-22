---
title: Tailwind CSS Configuration (obsolete)
type: guide
category: styling
tags: [tailwind, css, styling, obsolete]
created: 2025-05-16
updated: 2026-05-22
---

# Tailwind CSS Configuration (obsolete)

This guide is kept only as a pointer. The project doesn't use Tailwind CSS anymore, so the
setup and migration notes that used to live here no longer describe reality.

## What the project actually uses

Styling is hand-written CSS driven by a design-token system — CSS custom properties like
`var(--color-surface)`, `var(--space-4)`, and `var(--radius-md)`, with `clsx` composing
semantic class names (`badge badge-success`, `manuscript-action-rail`, and so on). There's no
`tailwindcss` dependency, no `tailwind.config.ts`, no `@tailwind` directives, and PostCSS runs
autoprefixer only. The components started from shadcn/ui but were taken through a "clean slate"
pass that removed `cva` and the Tailwind utility classes while keeping the Radix accessibility
primitives.

The three design systems (DS1/DS2/DS3) work by swapping the values behind those CSS variables
per theme, scoped with `[data-theme="ds1"]` selectors, rather than by toggling utility classes.

## Where to look instead

- [Design tokens](../design-system/design-tokens.md) — the token model (primitives, semantic, contextual)
- [Global styles](../design-system/global-styles.md) — global CSS and theme wiring
- [ADR-011: Three design systems](../architecture/ADR-011-three-design-systems.md) — why and how the theme system is structured
- [DESIGN.md](../../DESIGN.md) — the AI-readable token/component reference at the repo root
