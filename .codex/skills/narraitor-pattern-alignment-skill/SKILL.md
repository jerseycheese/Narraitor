---
name: narraitor-pattern-alignment-skill
description: Review Narraitor code changes for alignment with established project patterns (components, design tokens, error handling, state/store conventions, tests, types, domain boundaries, and accessibility). Use during code review, refactors, or when asked to check consistency in this repo.
---

# Narraitor Pattern Alignment

## Review workflow
- Confirm the scope (files, feature, or diff) before reviewing.
- Check for existing utilities or patterns before suggesting new code.
- Evaluate the change against the core alignment areas below.
- Report issues first (ordered by severity) with file:line and concrete fixes.

## Core alignment areas
- Components and structure (naming, file size, shadcn/ui usage)
- Design tokens and color usage (no hardcoded colors)
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
