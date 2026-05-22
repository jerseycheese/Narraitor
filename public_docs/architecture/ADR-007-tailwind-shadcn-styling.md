---
title: "ADR-007: Tailwind CSS + shadcn/ui as the styling foundation"
tags: [architecture, decision, adr, styling, tailwind, shadcn, superseded]
created: 2025-04-28
updated: 2026-05-22
---

# ADR-007: Tailwind CSS + shadcn/ui as the styling foundation

**Status**: Superseded by [ADR-011](ADR-011-three-design-systems.md) (and the Tailwind removal, #1097)
**Date**: 2025-04-28

> Backfilled 2026-05-22. This records the *original* styling decision so the later reversal makes
> sense. It was accurate at inception and is no longer how the app is styled — see the Status note
> and "What Changed Since" below. Reconstructed from the codebase and git history.

## The Situation

At inception, Narraitor needed a styling approach that let a solo developer move fast without
hand-rolling a component library or a CSS architecture from scratch. The initial commit
(2025-04-28) set up Tailwind, and shadcn/ui was integrated shortly after (#500).

## What We Decided

Use **Tailwind CSS for utility-first styling and shadcn/ui for the component foundation**.
shadcn/ui components (built on Radix UI primitives) were copied into `src/components/ui/`,
styled with Tailwind utilities and `class-variance-authority` variants, composed with a `cn()`
helper (`clsx` + `tailwind-merge`), with theme values exposed as CSS variables consumed by
Tailwind's semantic classes.

## Why This Made Sense

Tailwind plus shadcn/ui is a fast path to a consistent, accessible UI: Radix handles the
accessibility hard parts, shadcn gives ready-made component shapes, and Tailwind utilities make
iterating on layout and spacing quick. For an early-stage solo project, not building a design
system from zero was the right call.

### What Else We Considered

- **CSS Modules / plain CSS from the start**: more control, but slower to get a coherent,
  accessible component set off the ground.
- **A full component library (MUI, Chakra)**: batteries-included, but heavier and harder to
  restyle into a distinctive look later.
- **CSS-in-JS (styled-components/Emotion)**: viable, but Tailwind + shadcn had more momentum and
  better ergonomics for rapid iteration at the time.

## What Changed Since (Why This Is Superseded)

As the product pushed toward supporting wildly different fictional worlds, a single
Tailwind/shadcn look stopped being enough, and token-only theming over shadcn's shape language
kept reading as "the same app in different paint." The design-system migration
([ADR-011](ADR-011-three-design-systems.md), Epic #1020) introduced three structurally distinct
design systems and, as part of that, **removed Tailwind entirely** in a "clean slate" pass
(#1051, #1097). `cva`, `tailwind-merge`, and the `cn()` helper went with it.

The current reality: styling is plain CSS driven by design-token custom properties, composed
with `clsx` and semantic class names. The shadcn/Radix components still exist in
`src/components/ui/`, but de-Tailwinded. See [ADR-011](ADR-011-three-design-systems.md), the
[design-tokens](../design-system/design-tokens.md) and [global-styles](../design-system/global-styles.md)
docs, and `DESIGN.md` for how styling works now.

## What This Means Going Forward

This ADR is historical. Don't follow its guidance for new work — there's no Tailwind, no `cn()`,
and no `cva` in the codebase. It's retained so the "why was Tailwind here, and why is it gone"
question has an answer in one place.

## Related Decisions

- [ADR-011: Three structurally-differentiated design systems](ADR-011-three-design-systems.md) — supersedes this
- [Design tokens](../design-system/design-tokens.md), [global styles](../design-system/global-styles.md), [shadcn integration guide (historical)](../design-system/shadcn-integration-guide.md)
