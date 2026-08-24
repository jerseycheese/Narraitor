---
title: Naming Conventions
tags: [naming, conventions, code]
created: 2025-04-30
updated: 2025-06-26
---

# How We Name Things

File naming was getting inconsistent across the project, which makes it harder to find what you're looking for. Here's the approach that's been working:

## The Basic Rules

**React Components** get PascalCase because that's what React expects: `DevToolsPanel.tsx`, `WorldCard.tsx`. These are your main UI building blocks.

**Utility modules** use camelCase like `errorUtils.ts`, `sessionUtils.ts`, or `timestamp.ts`. Basically anything that's a helper function or shared logic that isn't a React component. There are no kebab-case module filenames anywhere under `src/lib/` or `src/utils/`.

**Store files** are camelCase: `worldStore.ts`, `characterStore.ts`. This keeps them distinct from components but still readable.

## CSS and Testing Stuff

**CSS Classes** - Styling is plain CSS keyed off semantic class names (there's no Tailwind), so you will write custom class names. Use kebab-case names that read as component-and-variant (`badge badge-success`, `manuscript-action-rail`) and follow the existing patterns in the per-theme CSS.

**Test IDs** use kebab-case like `world-card` or `delete-button`. These make it easy to find elements in tests without cluttering up the actual user-facing content.

**HTML IDs** are camelCase: `mainContentArea`, `worldEditor`. These are for when you need to reference specific elements programmatically.

## Why This Matters

The challenge here is that different parts of the codebase have different conventions (React wants PascalCase, CSS prefers kebab-case, etc.), but within each domain we want consistency. 

Keep names descriptive - `btn` tells you nothing, but `deleteWorldButton` tells you exactly what it does. Use ARIA attributes for accessibility, and make sure IDs are unique across the whole application because duplicate IDs break things in weird ways.

This isn't rocket science, but consistency makes the codebase much easier to navigate when you're hunting down a specific component or trying to understand how something works.