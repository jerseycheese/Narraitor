---
title: Naming Conventions
tags: [naming, conventions, code]
created: 2025-04-30
updated: 2025-06-26
---

# How We Name Things

So file naming was getting inconsistent across the project, which makes it harder to find what you're looking for. Here's the approach that's been working:

## The Basic Rules

**React Components** get PascalCase because that's what React expects: `DevToolsPanel.tsx`, `WorldCard.tsx`. These are your main UI building blocks.

**Utility modules** use kebab-case like `csv-utils.js` or `parser-utils.js`. Basically anything that's a helper function or shared logic that isn't a React component.

**Store files** are camelCase: `worldStore.ts`, `characterStore.ts`. This keeps them distinct from components but still readable.

## CSS and Testing Stuff

**CSS Classes** - We're using Tailwind utilities and shadcn/ui classes, so you shouldn't need to write custom CSS class names much. When you do, follow the existing pattern.

**Test IDs** use kebab-case like `world-card` or `delete-button`. These make it easy to find elements in tests without cluttering up the actual user-facing content.

**HTML IDs** are camelCase: `mainContentArea`, `worldEditor`. These are for when you need to reference specific elements programmatically.

## Why This Matters

The challenge here is that different parts of the codebase have different conventions (React wants PascalCase, CSS prefers kebab-case, etc.), but within each domain we want consistency. 

Keep names descriptive - `btn` tells you nothing, but `deleteWorldButton` tells you exactly what it does. Use ARIA attributes for accessibility, and make sure IDs are unique across the whole application because duplicate IDs break things in weird ways.

This isn't rocket science, but consistency makes the codebase much easier to navigate when you're hunting down a specific component or trying to understand how something works.