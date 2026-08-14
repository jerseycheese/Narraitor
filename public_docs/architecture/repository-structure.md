---
title: Repository Structure
tags: [architecture, structure, files]
created: 2025-04-28
updated: 2026-05-22
---

# Repository Structure

The project follows domain-driven organization on top of the Next.js App Router. Code is
grouped by what part of the app it serves rather than by file type, so when you're working on
character creation the components, state, types, and pages for it sit near each other instead
of being scattered across `components/`, `state/`, and `pages/` folders that each hold a bit of
everything.

## Structure

```
narraitor/
├── .github/
│   ├── workflows/                # CI, CodeQL, Storybook deploy/preview, tutorial Playwright
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── src/
│   ├── app/                      # Next.js App Router (pages + API routes)
│   │   ├── api/                  # Server-side API routes (all AI calls live here)
│   │   ├── dev/                  # Component test harnesses + DS showcase routes
│   │   ├── worlds/               # World list, create, detail, edit, play
│   │   ├── characters/           # Character list, create, detail, edit
│   │   ├── play/                 # Standalone play entry
│   │   ├── settings/
│   │   └── about/
│   ├── components/               # React components, grouped by domain
│   │   ├── ui/                   # shadcn/ui-based shared primitives
│   │   ├── shared/               # Cross-domain pieces (wizard, cards, selectors)
│   │   ├── forms/  layout/  devtools/  inventory/
│   │   ├── world/  character/  characters/
│   │   └── GameSession/  Narrative/  WorldCreationWizard/  ...  # feature components (PascalCase dirs)
│   ├── lib/                      # Domain logic, integrations, utilities
│   │   ├── ai/                   # Gemini integration via @google/genai
│   │   ├── promptContext/  promptTemplates/   # Prompt assembly + token budgeting
│   │   ├── narrative/  narrativeStreaming/    # Narrative generation
│   │   ├── lore/  inventory/  journal/  world/  generators/
│   │   ├── storage/             # IndexedDB persistence helpers
│   │   ├── state/               # storePubSub cross-store event bus
│   │   ├── theme/               # ThemeProvider + design-token CSS (ds3.css, _shared-tokens.css)
│   │   ├── tutorial/  routing/  services/  devtools/  api/
│   │   └── utils/  hooks/  constants/  test-utils/
│   ├── state/                    # Zustand stores (see note below)
│   ├── services/  hooks/  utils/
│   ├── types/                    # TypeScript definitions, by domain
│   ├── stories/                  # Storybook stories (00-foundation ... 06-patterns)
│   ├── styles/
│   └── __tests__/
├── tests/visual/                 # Playwright visual-regression specs (self-seeding)
├── scripts/                      # Build, audit (audit-css.mjs), and agent scripts
├── public/                       # Static assets
├── public_docs/                  # Public documentation (this directory)
├── docs/                         # Private/local docs (gitignored)
├── .storybook/                   # Storybook configuration
├── eslint.config.mjs             # ESLint (flat config)
├── .stylelintrc.json             # Stylelint (design-token enforcement)
├── .prettierrc                   # Prettier
├── jest.config.cjs               # Jest
├── playwright.config.ts          # Playwright (visual regression)
├── stryker.config.json           # Mutation testing
├── knip.json                     # Unused-code detection
├── .dependency-cruiser.cjs       # Architecture/dependency rules
├── next.config.ts                # Next.js
├── tsconfig.json                 # TypeScript
└── package.json
```

There's no `tailwind.config.ts` because there's no Tailwind — styling is plain CSS driven by
design-token custom properties, with per-theme CSS files under `src/lib/theme/themes/`. See the
design-system docs for how tokens and themes are wired.

## How domain organization works

Components are grouped by the part of the app they serve, not lumped into one giant folder:

- **`components/world/`, `WorldCreationWizard/`, etc.** — world creation, editing, and display.
- **`components/character/`, `CharacterCreationWizard/`, etc.** — character creation, editing, display.
- **`components/Narrative/`, `GameSession/`** — story generation, choice presentation, gameplay flow.
- **`components/ui/`** — shared shadcn/ui-based primitives used everywhere.
- **`components/shared/`** — cross-domain pieces like the wizard framework and card layouts.

The same domain grouping carries through `lib/`, `state/`, and `types/`. One thing to note: the
casing is mixed — feature components live in PascalCase directories (`GameSession/`,
`WorldCreationWizard/`) while broader groupings are lowercase (`world/`, `shared/`, `ui/`).

## State

State lives in `src/state/` as Zustand stores, one per domain — fourteen of them today
(`useWorldStore`, `useCharacterStore`, `useNarrativeStore`, `useJournalStore`,
`useSessionStore`, `useAiContextStore`, `useNPCStore`, `useInventoryStore`, `useGoalStore`,
`useNavigationStore`, `useLoreStore`, `useProviderStore`, `useCalibrationStore`,
`useContinuityStore`). Alongside them, `persistence.ts` holds the IndexedDB
storage adapter and `crudStore.types.ts` holds the shared `CrudStore<T>` type contract.
Cross-store cascades go through the event bus in `src/lib/state/storePubSub.ts`. The
[State Management Guide](state-management-guide.md) covers the patterns in detail.

## Notable features

The `/dev/*` routes are component test harnesses — they render components in isolation with
real seeded data, which makes debugging complex interactions (and reviewing the design system)
much easier. All AI requests go through server-side routes under `src/app/api/`, so the browser never calls
Gemini directly. Stores persist to IndexedDB automatically, so game sessions
survive a browser restart. And TypeScript runs strict throughout, with domain-specific type
definitions in `src/types/` that make refactoring safer.
