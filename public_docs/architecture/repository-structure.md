---
title: Repository Structure
tags: [architecture, structure, files]
created: 2025-04-28
updated: 2025-06-26
---

# Repository Structure

This the project structure follows domain-driven design principles with Next.js App Router. The idea is to group related functionality together rather than organizing by file type: which makes finding related code much easier.

## Structure

```
narraitor/
├── .github/
│   ├── workflows/
│   │   └── ci.yml               # Basic CI for tests and builds
│   └── PULL_REQUEST_TEMPLATE.md # Enforce the TDD approach
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # API routes (server-side only)
│   │   ├── dev/                 # Development test harnesses
│   │   ├── world/               # World management pages
│   │   ├── character/           # Character management pages
│   │   └── game/                # Game session pages
│   ├── components/              # React components by domain
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── forms/               # Form components
│   │   ├── world/               # World components
│   │   ├── character/           # Character components
│   │   └── narrative/           # Narrative components
│   ├── lib/                     # Utilities and integrations
│   │   ├── ai/                  # AI service integration
│   │   ├── storage/             # IndexedDB persistence
│   │   └── utils/               # Shared utilities
│   ├── state/                   # Zustand stores
│   │   ├── worldStore.ts
│   │   ├── characterStore.ts
│   │   ├── narrativeStore.ts
│   │   ├── journalStore.ts
│   │   └── sessionStore.ts
│   ├── types/                   # TypeScript definitions
│   │   ├── common.types.ts
│   │   ├── world.types.ts
│   │   ├── character.types.ts
│   │   └── narrative.types.ts
│   └── stories/                 # Storybook stories
├── public/                      # Static assets
├── __tests__/                   # Jest tests
├── .storybook/                  # Storybook configuration
├── public_docs/                 # Public documentation
├── docs/                        # Private/local docs (gitignored)
├── eslint.config.mjs            # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── jest.config.cjs              # Jest configuration
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## How Domain Organization Works

Instead of having all components in one giant folder, they're grouped by what part of the app they serve:

- **`components/world/`** - Everything related to world creation and management
- **`components/character/`** - Character creation, editing, display components
- **`components/narrative/`** - Story generation, choice presentation, narrative flow
- **`components/ui/`** - Shared shadcn/ui components used everywhere

Same pattern for stores, types, and pages. When you're working on character creation, all the related files are in the same area.

## Notable Features

**Development routes** - The `/dev/*` pages let you test components in isolation with real data. Really helpful for debugging complex interactions.

**API security** - All AI requests go through server-side routes with rate limiting. API keys never touch the browser.

**State persistence** - Zustand stores automatically sync with IndexedDB, so game sessions persist across browser restarts.

**Type safety** - TypeScript everywhere with domain-specific type definitions. Makes refactoring much safer.
