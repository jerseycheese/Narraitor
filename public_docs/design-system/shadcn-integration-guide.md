# shadcn/ui Integration Guide

> **Heads up — this guide is mostly historical.** The component library started from shadcn/ui,
> but the design-system migration took it through a "clean slate" pass (`#1051`, `#1097`) that
> **removed Tailwind, `cva`, `tailwind-merge`, and the `cn()` utility**. The Radix accessibility
> primitives and the general component shapes stayed; the styling moved entirely onto plain CSS
> driven by design tokens. So the old "install Tailwind + cn() + cva, add `tailwind.config.ts`"
> setup below no longer applies.

## What's actually in place now

The `src/components/ui/` directory still holds the shadcn-derived primitives (Button, Badge,
Alert, and so on, several built on `@radix-ui/*`). What changed is how they're styled:

- **No Tailwind.** There's no `tailwindcss` dependency, no `tailwind.config.ts`, and no
  `@tailwind` directives. PostCSS runs autoprefixer only.
- **Class composition uses `clsx`.** There is no `cn()` helper and no `tailwind-merge`.
  Components compose semantic class names instead of utility strings:

  ```tsx
  import { clsx } from 'clsx';

  <div className={clsx('badge', `badge-${variant}`, `badge-${size}`, className)} />
  ```

- **Styling lives in CSS, keyed off those class names**, and resolves design tokens via
  `var(--token-name)`. The current token values live in `src/lib/theme/themes/ds3.css`
  under `:root` and `:root.dark`; `_shared-tokens.css` holds shared primitives.
- **Variants are plain string props**, not `cva` configs. A Badge takes `variant`/`size`
  props and turns them into `badge-${variant}`/`badge-${size}` classes; the CSS does the rest.

## Where to look

- [Design tokens](./design-tokens.md) — the primitives/semantic/contextual token model
- [Global styles](./global-styles.md) — global CSS and theme wiring
- [ADR-013: Collapse to a single design system (DS3)](../architecture/ADR-013-collapse-to-single-design-system-ds3.md) — why there's one design system now (supersedes ADR-011)
- [DESIGN.md](../../DESIGN.md) — the AI-readable token/component reference at the repo root

The components themselves under `src/components/ui/` are the source of truth for their props and
class names.
