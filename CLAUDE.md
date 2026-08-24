# CLAUDE.md — Narraitor

Canonical instructions for coding agents in this repo. `AGENTS.md` is gitignored here, so
this tracked file is the single canon — edit it, not a copy.

Narraitor is an AI-driven narrative RPG framework. You build a world (its theme, attributes,
skills, and tone), create characters in it, and play through a generated, choice-driven story
with a tracked inventory and journal. Single-player web app: no backend database, player data
lives in the browser (IndexedDB via Zustand persistence), and AI generation runs through the
player's own provider key.

## Stack

- **Next.js 15** (App Router) + **React 19**, TypeScript strict. Node >= 20, npm.
- **Zustand 5** — one store per domain under `src/state/` (`characterStore`, `inventoryStore`,
  `journalStore`, `worldStore`, ...), persisted to IndexedDB via `persistence.ts`.
- **Plain CSS + design tokens** — `var(--token)` plus `clsx`. **No Tailwind** (removed in the
  design-system migration); no `cn()`, no `cva`, no `tailwind-merge`.
- AI generation through `src/lib/ai/` (Google Gemini via `@google/genai`), keyed by the
  player's own provider key rather than a server-held key.
- Secrets in `.env.local`. Never commit them.

## Run it

```bash
npm run dev          # scripts/dev.sh — port 3000 in the main checkout; worktrees auto-select
npm run storybook    # port 6006
npm run kill         # emergency: pkill -f 'next dev'
```

Check whether a dev server is already running before starting one (`lsof -iTCP:3000`).
rcv-simulator-va's main checkout also defaults to 3000 — don't run both at once.
Verify: `curl -s localhost:3000 | head -1` returns HTML; Storybook responds on 6006.

## The quality gate

Run before any commit — CI runs these separately and the production build enforces lint
and types anyway:

```bash
npm test                   # Jest unit/integration
npm run type-check         # tsc --noEmit
npm run lint               # ESLint (Next + test/script globs, JSX/markup hygiene)
npm run lint:css           # Stylelint over **/*.css — run after ANY .css edit
```

Targeted runs: `npm test -- <path>` for one file, `npm test -- -t "name"` for one case.

Other gates, by what you touched:

- `npm run knip` (unused files/exports/deps) and `npm run audit:css` (unused selectors) — CI gates.
- `npm run lint:layout-usage` — enforces non-self-closing `PageLayout`.
- `npm run lint:ds-canon` — design-system canon check.
- **Structural changes** (imports crossing domains): `npm run deps:validate`, dependency-cruiser
  against the known-violations baseline. `deps:validate:strict` shows everything; re-baseline
  only deliberately with `deps:baseline`. `npm run deps:check` is the other half of the ratchet —
  it fails when a baseline entry no longer reproduces, so fixing a violation means re-baselining.
- **Visual work:** `npm run test:visual` (Playwright, chromium). Specs seed their own state via
  `seedTestData(page)`, so there's no separate seed step. Update snapshots deliberately with
  `test:visual:update`; prune orphans with `test:visual:prune`. User-facing specs should cover
  light and dark, or carry an inline reason and tracking issue for a single-scheme exception.
- `npm run test:e2e:critical` — Playwright critical path.
- `npm run build` — production build (includes a Storybook build step).
- If local Jest runs out of memory, `npm run test:ci` exists for that (4GB Node heap).

## Layout

`src/` is domain-driven: `app/` (routes + API routes), `components/` (by domain, or `ui/`
for generic), `state/` (Zustand stores — the source of truth for app data, plus
`persistence.ts`), `lib/` (non-UI: `ai/`, `api/`, `theme/`, `generators/`, `devtools/`,
`utils/logger`), then `services/`, `hooks/`, `utils/`, `types/`, `styles/`, `stories/`.

## Conventions

### General

- **Target `develop` for PRs, never `main`.** `main` holds tagged releases only — never push
  to it, never target PRs at it, never do automated work against it. It moves only when the
  maintainer fast-forwards it to a release. If anything looks like it's about to push to
  `main` or open a PR against it, stop; that's the maintainer's release flow.
- Absolute imports with the `@/` alias. Group: React/Next -> external -> internal components
  -> utils/hooks -> types -> styles.
- Prettier: 2 spaces, single quotes, trailing commas. Avoid `any`.
- KISS by default, in implementation and in tests — MVP-level tests, not exhaustive coverage.
  Never rig a test to pass.
- Look for an existing pattern or utility before adding a new one. One canon version per file —
  no `simple` / `enhanced` variants.
- No wrapper services (ExportService was removed on purpose). Use `clsx` directly. Extract
  hooks and helpers before things get clever.
- Issue work runs the standard global pipeline: `analyze-issue`, then `tdd-implement`, then
  `post-merge`.

### Components

- `src/components/<Domain>/<ComponentName>.tsx`. PascalCase components, camelCase hooks.
- Functional only: `export const Component = () => { ... }`. Props interface named
  `ComponentNameProps`, exported.
- Default to Server Components; add `'use client'` only for state, effects, or event listeners.
- Put an identifying class attribute on every component.
- New components get a Storybook story under `src/stories/` — that's the only glob in
  `.storybook/main.cjs`, so stories do NOT live beside their components.

### State

- `create<StoreInterface>()(...)` in `src/state/`. CRUD-style store methods. `persist`
  middleware for state that survives reloads.
- Cross-store events via `storeEvents` / `StoreEventTypes`. Static imports only.
- Wizard step state goes through sessionStorage (`generated-world-data`); theme prefs
  through localStorage.

### Styling

- **One design system: DS3 ("Mechanical Manuscript"), and it is not switchable** — only
  light/dark is. Components stay theme-blind: no `theme === 'dsN'` branching in JSX; tokens
  carry the variation, defined per theme in `src/lib/theme/themes/`. The old
  `/dev/design-system*` showcase routes were deleted and stay deleted.
- **NEVER** hardcode hex, named colors, or rgb/rgba in product CSS — use `var(--token-name)`.
  Stylelint fails the build on it. Theme files have scoped overrides. Avoid `!important`.
- Semantic class names (`badge badge-success`), composed with
  `clsx('base', condition && 'conditional', className)`.
- **Storybook is the single canon visual surface** — when production drifts from Storybook,
  production is wrong. `00-Foundation/Design System Showcase` is the foundation story. The
  toolbar has a light/dark switcher; verify any visual change in both before merging.
- `DESIGN.md` is the AI-readable map of tokens, components, and the don'ts list. Treat it as
  authoritative, but note it flags its own stale DS1-era type-scale values inline.

### AI integration

- Lives in `src/lib/ai/`, SDK `@google/genai`.
- **NEVER** expose API keys or AI calls on the client. All AI interactions happen in Server
  Actions or API routes.

### Error handling

- `createStoreError` for store errors. The internal `Logger` (`@/lib/utils/logger`) for logging.
- `ErrorBlock` to surface errors to users.

## Workflow

Read the related files before writing — don't guess types or props. Run
`npm test -- <relevant_file>` immediately after a logic change, not just at the end.
New logic gets a unit test in `__tests__/` or a co-located `*.test.tsx`, deterministic,
with network calls and AI responses mocked. JSDoc on exported functions and complex
components.

### Pull requests

- **Always render the body from `.github/PULL_REQUEST_TEMPLATE.md`.** Read it first.
- Keep every template heading in the submitted body. Fill non-applicable sections with
  "Not applicable." or a short explanation — don't delete them.
- This applies to PRs created through the GitHub connector or API too: pass a body generated
  from the template, don't rely on connector defaults or shorter skill summaries.
- Check only the boxes actually verified in this workflow, and note any skipped checks.

## Known failure modes

- Port 3000 taken -> an orphan `next dev` or rcv-simulator-va's main checkout.
- Stylelint color failures -> a raw color landed outside a theme file; route it through tokens.
- `deps:validate` failures -> fix the boundary violation, or (rarely, deliberately) re-baseline.
- `deps:check` failures -> a violation got fixed but its baseline entry is still there; run
  `deps:baseline` and commit the smaller file.

## Pointers

README.md (product overview), RELEASES.md (one section per version), CONTEXT.md (domain
vocabulary — world, turn, decision, provider — referenced by several local skills),
DESIGN.md (design-system map), `public_docs/architecture/` (ADRs),
`public_docs/development/release-process.md`.

## Claude Code specifics

Everything above applies to any coding agent. These bits apply only to Claude Code.

### Local skills and agents

`.claude/skills/` and `.claude/agents/` ship with this repo and self-describe — invoke them
by name, don't wait to be asked. Two that carry the strongest "run me" contract:
`narraitor-architecture` before writing new components, stores, or API routes, and
`narraitor-pattern-alignment-skill` after any change under `src/`, before committing.
`.claude/skills/` is the full list; don't enumerate it here, it rots.

### Running in Claude Code cloud

Cloud sessions clone this repo fresh, so the `SessionStart` hook in `.claude/settings.json`
runs `scripts/install_pkgs.sh` to `npm ci` on startup. Unit tests, type-check, lint, and
build all work on the Linux cloud VM.

**Don't run the visual-regression or E2E suites in cloud** (`test:visual`, `test:e2e:*`) —
the Playwright baselines are macOS-only and will fail on pixel diffs against a Linux runner.
Those belong on a local Mac or the macOS CI job.

### Automation directives

Slash commands here may carry `# AUTO-APPROVE: ALL` / `# AUTO-ACCEPT-EDITS: ALL` at the top
of the file. For truly automatic execution, pick "Yes, and don't ask again this session" on
the first prompt. Helper scripts are pre-approved in `.claude/settings.local.json`
(machine-local, not committed).
