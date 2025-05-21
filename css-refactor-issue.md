---
name: Enhancement
about: Suggest an enhancement to an existing feature
title: "Refactor global CSS to prevent overriding of Tailwind utility classes"
labels: enhancement
assignees: ''
---

## Plain Language Summary
The global CSS currently overrides specific Tailwind utility classes, creating styling inconsistencies and requiring workarounds. This enhancement will refactor our CSS architecture to follow best practices.

## Current Feature
Our application uses a combination of global CSS (in globals.css) and Tailwind utility classes. Currently, the global CSS selectors override explicitly defined Tailwind utilities in components, which creates inconsistencies and requires workarounds like adding `!important` flags or creating specific exclusions.

## Domain
- [x] Other: Design System

## Enhancement Description
We need to refactor the global CSS structure to prevent it from overriding explicit Tailwind utility classes. Specifically:

1. Review all global CSS rules to identify those that override Tailwind utilities
2. Restructure global selectors to reduce specificity where appropriate
3. Consider implementing a proper CSS architecture pattern (like ITCSS)
4. Ensure base styles provide defaults without conflicting with component-specific styling
5. Update documentation regarding CSS best practices for the project

## Reason for Enhancement
This enhancement will:
- Improve developer experience by making styling more predictable
- Reduce the need for workarounds like `!important` flags
- Make the codebase more maintainable
- Align with CSS and Tailwind best practices
- Prevent future styling conflicts

## Possible Implementation
1. Audit globals.css to identify problematic selectors
2. Refactor global selectors to use lower specificity patterns
3. Use selector patterns that are less likely to conflict with Tailwind
4. For elements like form controls that need consistent styling:
   - Create component-level styles instead of global styles
   - Use Tailwind's component layer for shared styles
   - Or create specific utility classes that can be applied consistently

Examples:
- Instead of styling `input, select, textarea` directly, create component wrappers or specific utilities
- Use the Tailwind theme system for consistent styling primitives
- Make global styles provide base defaults that can be easily overridden

## Alternatives Considered
1. Continue using `!important` flags and specific overrides as needed (creates technical debt)
2. Abandon global CSS entirely in favor of Tailwind-only styling (too extreme and would require significant refactoring)
3. Custom intermediate layer between globals and components (adds complexity)

## Additional Context
Recent example: We needed to modify globals.css to specifically exclude range inputs from general input styling, as the input styling was overriding Tailwind classes in the SkillRangeEditor component. This required modifying global selectors when the issue was actually component-specific.