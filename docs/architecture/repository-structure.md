---
title: Repository Structure
tags: [architecture, structure, files]
created: 2025-04-28
updated: 2025-06-26
---

# Repository Structure

Next.js App Router project structure with domain-driven organization.

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
├── docs/                        # Documentation
├── .eslintrc.js                 # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── jest.config.cjs              # Jest configuration
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## Domain Organization

**Zustand Stores**: Each domain has its own store (`worldStore`, `characterStore`, etc.)
**Components**: Organized by domain with shared UI components
**Types**: TypeScript definitions grouped by domain
**Pages**: App Router structure with nested routes

## Key Features

**Development Harnesses**: `/dev/*` routes for testing components
**API Security**: Server-side API routes with rate limiting
**State Persistence**: IndexedDB integration with Zustand
**Component Development**: Storybook for isolated component testing
**Type Safety**: Comprehensive TypeScript coverage

## Configuration Files

- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS v4 setup
- `jest.config.cjs` - Testing configuration
- `.storybook/` - Storybook configuration
- `CLAUDE.md` - AI assistant instructions
