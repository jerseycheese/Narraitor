---
title: Repository Structure
aliases: [GitHub Structure, File Organization]
tags: [narraitor, documentation, architecture, github]
created: 2025-04-28
updated: 2025-05-16
---

# Narraitor Repository Structure

## Overview

This document outlines the current file and directory structure for the Narraitor GitHub repository after the complete App Router migration. This structure is optimized for the MVP phase with a focus on clear organization, domain-driven boundaries, and scalability for future enhancements.

## Current Structure

```
narraitor/
├── .github/
│   ├── workflows/
│   │   └── ci.yml               # Basic CI for tests and builds
│   └── PULL_REQUEST_TEMPLATE.md # Enforce the TDD approach
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home page
│   │   ├── error.tsx            # Error boundary
│   │   ├── loading.tsx          # Loading state
│   │   ├── globals.css          # Global styles
│   │   ├── about/               # About page
│   │   │   └── page.tsx
│   │   ├── simple-test/         # Test pages
│   │   │   └── page.tsx
│   │   ├── test/
│   │   │   └── page.tsx
│   │   └── dev/                 # Development test harnesses
│   │       ├── page.tsx         # Dev index
│   │       ├── layout.tsx       # Dev layout
│   │       ├── world-list-screen/
│   │       │   └── page.tsx
│   │       ├── test-nested/
│   │       │   └── page.tsx
│   │       ├── controls/
│   │       │   └── page.tsx
│   │       └── mocks/
│   │           └── page.tsx
│   ├── components/              # Shared UI components
│   │   ├── ui/                  # Basic UI components
│   │   ├── world/               # World-related components
│   │   ├── character/           # Character components
│   │   └── narrative/           # Narrative components
│   ├── lib/                     # Shared utilities and services
│   │   ├── ai-service.ts        # AI integration abstraction
│   │   ├── persistence.ts       # IndexedDB functionality
│   │   └── utils.ts             # General utilities
│   ├── state/                   # State management (Zustand)
│   │   ├── worldStore.ts        # World state
│   │   ├── characterStore.ts    # Character state
│   │   ├── narrativeStore.ts    # Narrative state
│   │   ├── journalStore.ts      # Journal state
│   │   └── inventoryStore.ts    # Inventory state
│   ├── types/                   # TypeScript type definitions
│   │   ├── world.types.ts
│   │   ├── character.types.ts
│   │   └── index.ts             # Type exports
│   └── utils/                   # Helper functions
├── public/                      # Static assets
│   ├── styles.css              # Temporary styles (CSS issue workaround)
│   └── favicon.ico
├── __tests__/                   # Test files
├── docs/                        # Project documentation
│   ├── architecture/
│   │   ├── app-router-migration.md  # NEW: Migration documentation
│   │   └── repository-structure.md  # THIS FILE
│   └── technical-guides/
├── .eslintrc.js                 # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── jest.config.cjs              # Jest configuration
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## Migration Complete

The migration from Next.js Pages Router to App Router is now complete. All Pages Router components and code have been removed from the project, and the application now exclusively uses the App Router architecture.

### App Router Structure

The `app` directory follows Next.js 15+ App Router conventions with:

1. Page components for routes (`page.tsx`)
2. Layouts for consistent UI shells (`layout.tsx`)
3. Dynamic routes with parameters (`[id]`)
4. Nested routes that reflect the application hierarchy
5. Server Components by default for better performance

### Clear Separation of Concerns

1. **Domain Logic**: State management in `state/` using Zustand
2. **UI Components**: Reusable interface elements in `components/`
3. **Utilities**: Shared functionality in `lib/` and `utils/`
4. **Types**: Shared type definitions in `types/`
5. **Routes**: Application pages in `app/`

### Testing Organization

Tests are located in `__tests__/` directory with a structure that mirrors the source code.

## State Management

The application uses Zustand for state management with domain-specific stores:

- `worldStore.ts`: World configuration state
- `characterStore.ts`: Character management state
- `narrativeStore.ts`: Narrative engine state
- `journalStore.ts`: Journal system state
- `inventoryStore.ts`: Inventory management state

Each store follows Zustand patterns and can be used in client components with the `'use client'` directive.

## Development Workflow

### Test Harnesses

Development test harnesses are available at `/dev/*`:

1. `/dev` - Index of all test harnesses
2. `/dev/world-list-screen` - World list component testing
3. `/dev/test` - Basic component testing
4. `/dev/test-nested` - Nested routing tests
5. `/dev/controls` - Developer controls interface
6. `/dev/mocks` - Mock services testing

### Known Issues

1. **CSS/Tailwind Configuration**: Currently experiencing issues with Tailwind CSS v4 and PostCSS in the App Router. Using inline styles as a temporary workaround.

## Future Considerations

While this structure supports the current MVP, it can evolve as the project grows:

1. **CSS Resolution**: Fix Tailwind CSS v4 configuration or downgrade to v3
2. **Test Updates**: Update all test files to use new App Router paths
3. **Additional Domains**: New domains can be added for future features
4. **Performance Optimization**: Leverage React Server Components more effectively
5. **Error Handling**: Enhance error boundaries with better user feedback

## Next Steps

1. Fix CSS/Tailwind configuration issue
2. Update test file imports
3. Optimize for React Server Components
4. Enhance documentation with migration learnings
