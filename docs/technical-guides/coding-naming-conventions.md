---
title: "Component Naming Conventions"
type: guide
category: coding-standards
tags: [coding, naming, conventions, standards]
created: 2025-04-30
updated: 2025-06-08
---

# Component Naming Conventions

This document outlines the naming conventions for components in the Narraitor project.

## Classes

We use a BEM-like naming convention for CSS classes:

```
narraitor-[component]-[element]
```

*   `narraitor`: Prefix for all Narraitor-related classes.  
*   `[component]`: Name of the component (e.g., `button`, `header`, `page`).  
*   `[element]`: Name of a specific element within the component (e.g., `container`, `title`, `label`).

Example: `narraitor-button-primary`

## IDs

IDs should be unique across the entire application and use camelCase:

```
narraitorComponentName
```

Example: `narraitorMainContentArea`

## data-testid Attributes

`data-testid` attributes are used for testing purposes and should use kebab-case:

```
component-name-element
```

Example: `button-primary`

## File & Module Naming Patterns
- Modules under `scripts/user-stories/modules/` use kebab-case, e.g., `csv-utils.js`, `parser-utils.js`.
- Utility scripts under `scripts/utils/` use kebab-case, e.g., `cli-parser.js`, `issue-body-utils.js`.
- React component filenames use PascalCase, e.g., `DevToolsPanel.tsx`, `GameControlSection.tsx`.
## General Guidelines

*   Maintain existing Tailwind classes where used.  
*   Add ARIA attributes where appropriate to improve accessibility.  
*   Ensure IDs are unique across the application.