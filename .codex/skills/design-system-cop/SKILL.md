---
name: design-system-cop
description: Enforce design-system and accessibility standards when implementing or reviewing UI components, styles, or interactive elements. Use when checking token usage, shadcn/ui component usage, WCAG 2 compliance, or UI pattern consistency.
---

# Design System Cop

## Quick Start

- Review UI diffs or screenshots for design-system compliance and accessibility.
- Load `references/design-system-enforcer.md` for the full checklist and examples.
- Report issues with file:line references and concrete fixes.

## Review Workflow

1. Scan for color violations and non-token usage.
2. Verify shadcn/ui components are used instead of raw HTML inputs/buttons.
3. Check WCAG 2 AA: contrast, ARIA, focus, keyboard access, labels.
4. Confirm pattern consistency and avoid new utilities if existing ones apply.
5. Summarize fixes by severity and propose exact code changes.

## Output Format

- **Design Token Violations**
- **Component Standards Issues**
- **Accessibility Concerns**
- **Pattern Inconsistencies**
- **Recommended Actions** (critical → minor, include lint/test commands if relevant)

## Reference

- `references/design-system-enforcer.md`
