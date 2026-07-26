---
name: narraitor-pattern-alignment-skill
description: >
  Automatically run after any code change in this repo (components, stores, API routes, CSS, tests, types).
  Triggers on: new files, refactors, feature additions, or any edit touching src/.
  Reviews changes for alignment with established project patterns — design tokens, state conventions, error handling, domain boundaries, accessibility.
  Do NOT wait for user to ask; run as a post-edit check before committing.
---

## When to invoke (auto-trigger)

Invoke automatically whenever:
- A `.tsx`, `.ts`, `.css`, or `.test.*` file under `src/` is created or substantially edited
- A new component, store, or API route is added
- A refactor touches more than one file

Do NOT invoke for: documentation-only edits, config changes, or trivial one-line fixes.

# Narraitor Pattern Alignment

## Review workflow
- Confirm the scope (files, feature, or diff) before reviewing.
- Check for existing utilities or patterns before suggesting new code.
- Evaluate the change against the core alignment areas below.
- Report issues first (ordered by severity) with file:line and concrete fixes.

## Core alignment areas
- Components and structure (naming, file size, DOM clarity)
- Design tokens and color usage (no hardcoded colors; use `var(--color-*)` directly, but wrap status/domain tokens like `--success`/`--alignment-*` in `hsl(var(--...))` — see `public_docs/design-system/design-tokens.md`)
- Error handling and user-friendly errors
- State management and persistence patterns
- Type safety and domain types
- Testing (behavior-first, Testing Library queries)
- Accessibility (WCAG 2.1 AA)
- Domain boundaries and cross-domain coordination
- Docs style (if docs touched)

## Output format
- Issues first, ordered by severity, with file:line references.
- Call out missing tests explicitly.
- Briefly list aligned patterns after issues.

## References
- `references/patterns.md` (detailed checks and examples)
- `references/accessibility.md`
- `references/utilities.md`
