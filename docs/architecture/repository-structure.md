---
title: Repository Structure
aliases: [GitHub Structure, File Organization]
tags: [narraitor, documentation, architecture, github]
created: 2025-04-28
updated: 2025-04-28
---

# NarrAItor Repository Structure

## Overview

This document outlines the recommended file and directory structure for the NarrAItor GitHub repository. This structure is optimized for the MVP phase with a focus on clear organization, domain-driven boundaries, and scalability for future enhancements.

## Structure

```
narraitor/
├── .github/
│   ├── workflows/
│   │   └── ci.yml               # Basic CI for tests and builds
│   └── PULL_REQUEST_TEMPLATE.md # Enforce the TDD approach
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Landing page
│   │   ├── world/               # World management routes
│   │   │   ├── create/          # World creation wizard
│   │   │   ├── [id]/            # Single world view/edit
│   │   │   └── page.tsx         # World selection
│   │   ├── character/           # Character routes
│   │   │   ├── create/          # Character creation wizard
│   │   │   ├── [id]/            # Character view/edit
│   │   │   └── page.tsx         # Character selection
│   │   └── play/                # Game session routes
│   │       ├── [id]/            # Specific game session
│   │       └── journal/         # Journal routes
│   ├── domains/                 # Domain-specific logic
│   │   ├── world/               # World domain
│   │   │   ├── actions.ts       # World-specific actions
│   │   │   ├── reducer.ts       # World state reducer 
│   │   │   ├── hooks.ts         # World-specific hooks
│   │   │   └── types.ts         # World-specific types
│   │   ├── character/           # Character domain
│   │   ├── narrative/           # Narrative domain
│   │   ├── journal/             # Journal domain
│   │   └── ai/                  # AI service domain
│   ├── components/              # Shared UI components
│   │   ├── ui/                  # Basic UI components
│   │   ├── world/               # World-related components
│   │   ├── character/           # Character components
│   │   └── narrative/           # Narrative components
│   ├── lib/                     # Shared utilities
│   │   ├── ai-service.ts        # AI integration abstraction
│   │   ├── persistence.ts       # IndexedDB functionality
│   │   └── utils.ts             # General utilities
│   ├── state/                   # Global state management
│   │   ├── provider.tsx         # State provider component
│   │   ├── reducer.ts           # Root reducer
│   │   └── initial-state.ts     # Initial app state
│   ├── types/                   # Shared type definitions
│   │   └── index.ts             # Type exports
│   └── templates/               # World templates for MVP
│       ├── western.ts
│       ├── sitcom.ts
│       └── adventure.ts
├── public/                      # Static assets
├── tests/                       # Test files
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
├── .eslintrc.js                 # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── jest.config.js               # Jest configuration
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## Key Organization Principles

### Domain-Driven Organization

The repository is organized around key domains (world, character, narrative, journal, AI) rather than technical concerns. This approach:

1. Keeps related functionality together
2. Aligns code structure with business domains
3. Makes it easier to understand responsibilities
4. Supports future modularity if needed

### App Router Structure

The `app` directory follows Next.js 14 App Router conventions with:

1. Page components for routes (`page.tsx`)
2. Layouts for consistent UI shells (`layout.tsx`)
3. Dynamic routes with parameters (`[id]`)
4. Nested routes that reflect the application hierarchy

### Clear Separation of Concerns

1. **Domain Logic**: Business rules and state management in `domains/`
2. **UI Components**: Reusable interface elements in `components/`
3. **Utilities**: Shared functionality in `lib/`
4. **Types**: Shared type definitions in `types/`
5. **Routes**: Application pages in `app/`

### Testing Organization

Tests follow the same structure as the application code but are kept in a separate `tests` directory to keep the source directory clean and focused.

## Implementation Approach

### Phase 1: Repository Setup

1. Initialize the Next.js project with TypeScript
2. Configure ESLint, Prettier, and other tooling
3. Set up the basic folder structure
4. Create GitHub repository and configure branch protection
5. Add CI workflow for testing

### Phase 2: Core Infrastructure

1. Implement shared type definitions
2. Set up state management architecture
3. Create persistence layer with IndexedDB
4. Implement basic UI components
5. Set up routing and layouts

### Phase 3: Domain Implementation

Implement each domain incrementally, starting with World domain:

1. Define domain-specific types
2. Create reducers and actions
3. Implement basic UI components
4. Create domain-specific hooks
5. Connect to persistence layer

## Rationale for Structure

### Why Domain-Driven Organization?

This approach is chosen specifically for NarrAItor because:

1. The application has clearly defined domain boundaries (world, character, narrative, journal)
2. Each domain has its own state, actions, and UI concerns
3. It will make it easier to implement and maintain the MVP
4. Future extensions (NPC system, combat, inventory) can be added as new domains

### Why App Router vs. Pages Router?

App Router provides several benefits for NarrAItor:

1. Better support for nested layouts (important for the game interface)
2. Improved data loading and state management
3. Better performance through server components
4. More flexible routing patterns for dynamic game sessions

## Next Steps

1. Initialize the repository with this structure
2. Implement the core type definitions
3. Set up state management foundation
4. Create basic UI components
5. Implement the World domain

## Future Considerations

While this structure is optimized for the MVP, it can evolve as the project grows:

1. **Storybook Integration**: Add Storybook for component development in Phase 2
2. **Microservice Architecture**: Domain structure simplifies future extraction into services
3. **Additional Domains**: New domains can be added for NPC system, inventory, etc.
4. **Internationalization**: i18n support can be added within the app directory
