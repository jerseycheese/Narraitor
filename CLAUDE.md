# CLAUDE.md — Narraitor

Narraitor is an AI-driven narrative RPG framework. You build a world (its theme, attributes, skills, and tone), create characters in it, and play through a generated, choice-driven story with a tracked inventory and journal. It's a single-player web app — there's no backend database; player data lives in the browser (IndexedDB via Zustand persistence), and AI generation runs through the player's own provider key.

## Stack

- **Next.js 15** (App Router) + **React 19**, TypeScript.
- **Zustand 5** for state — one store per domain under `src/state/` (`characterStore`, `inventoryStore`, `journalStore`, `worldStore`, etc.), persisted to IndexedDB.
- **Plain CSS + design tokens** for styling: `var(--token)` values plus `clsx` for conditional classes. There is **no Tailwind** (it was removed) — don't add utility classes or reintroduce `cva`/`cn()`.
- AI generation goes through `src/lib/ai/` (Google Gemini via `@google/genai`), keyed by the player's own provider key rather than a server-held key.

## Run it

```bash
npm run dev          # scripts/dev.sh — port 3000 in the main checkout; worktrees auto-select their own port
npm run storybook    # port 6006
npm run kill         # emergency: pkill -f 'next dev'
```

- Check whether a dev server is already running before starting one (`lsof -iTCP:3000`). rcv-simulator-va's main checkout also defaults to 3000 — don't run both at once.
- Verify: `curl -s localhost:3000 | head -1` returns HTML; Storybook responds at http://localhost:6006.

## The quality gate

Run before any commit — CI runs these separately and the production build enforces lint and types anyway:

```bash
npm test                   # Jest unit/integration suite
npm run type-check         # tsc --noEmit
npm run lint               # ESLint (Next + test/script globs)
npm run lint:css           # Stylelint over **/*.css — run after ANY .css edit
```

- `npm run build` — production build (includes a Storybook build step).
- Structural changes (imports crossing domains): `npm run deps:validate`, dependency-cruiser against the known-violations baseline (`deps:validate:strict` shows everything; re-baseline only deliberately with `deps:baseline`). `npm run deps:check` is the other half of the ratchet: it fails when a baseline entry no longer reproduces, so fixing a violation means re-baselining.
- Visual work: `npm run test:visual` (Playwright, chromium). Update snapshots deliberately with `test:visual:update`; prune orphans with `test:visual:prune`.
- If local jest runs out of memory, `npm run test:ci` exists for that (4GB Node heap).

## Layout

`src/` is domain-driven:

- `app/` — Next.js routes (App Router).
- `components/` — React components, organized by domain.
- `state/` — Zustand stores (the source of truth for app data): world, character, narrative, lore, inventory, npc, journal, goal, navigation, session, plus `persistence.ts` (IndexedDB).
- `lib/` — non-UI logic: `ai/`, `api/`, `theme/` (design tokens), `generators/`, `devtools/`, feature flags.
- `services/`, `hooks/`, `utils/`, `types/`, `styles/`, `stories/` (Storybook).

## Conventions

- **Target the `develop` branch** for PRs, not `main`. `main` is release-only; `develop` is the rolling integration branch.
- KISS by default, in implementation and in tests — MVP-level tests, not exhaustive coverage. Never rig a test to pass.
- Style with design tokens, not hardcoded values. Stylelint enforces it: no hex, no named colors, no rgb/rgba in product CSS (theme files have scoped overrides). Avoid `!important`.
- Put an identifying class attribute on components.
- Look for an existing pattern/utility before adding a new one. One canon version per file — no `simple`/`enhanced` variants.
- One design system: DS3 ("Mechanical Manuscript"). ADR-013 (PR #1526) collapsed the old three-system setup into DS3 and supersedes ADR-011 — the design system isn't switchable anymore, only light/dark is. Storybook (`npm run storybook`) is still the single canon surface (ADR-012, unaffected — it just renders the one theme now); the old `/dev/design-system*` living style guide stays retired. DESIGN.md is the map, though its type-scale numbers are still DS1's, pending the bolder-DS3 rewrite in #1543.
- State: CRUD-style store methods; cross-store events via `storeEvents`/`StoreEventTypes`; static imports only (`eval(require())` was eradicated in #1206). Wizard step state goes through sessionStorage (`generated-world-data`); theme prefs through localStorage.
- Current house style: no wrapper services (ExportService was removed on purpose), use `clsx` directly, extract hooks/helpers before things get clever.
- Issue work runs the standard global pipeline: analyze-issue, then tdd-implement, then post-merge.

## Local skills and agents — use them

Committed under `.claude/` and shipped with the repo:

- `narraitor-architecture` skill — invoke BEFORE writing new components, stores, API routes, or planning a feature. Domain boundaries, naming, state patterns, AI integration conventions.
- `narraitor-pattern-alignment-skill` — run AFTER any code change touching src/, before committing.
- `style-port` skill — the only sanctioned way to port reference/demo inline styles into production CSS (rigid 6-phase process, token-based, no `!important`).
- `review` skill — PR review flow: fetch the latest remote diff, run lint + tests, verdict.
- Agents: design-system-enforcer, format-check, issue-prioritizer, pr-merge-issue-updater, test-fix.

## Running in Claude Code cloud

Cloud sessions clone this repo fresh, so the `SessionStart` hook in `.claude/settings.json` runs `scripts/install_pkgs.sh` to `npm ci` on startup. Unit tests, type-check, lint, and build all work on the Linux cloud VM.

**Don't run the visual-regression or E2E suites in cloud** (`test:visual`, `test:e2e:*`) — the Playwright baselines are macOS-only and will fail on pixel diffs against a Linux runner. Those belong on a local Mac or the macOS CI job.

## Automation directives

Slash commands in this repo may carry directives at the top of the file:

```
# AUTO-APPROVE: ALL
# AUTO-ACCEPT-EDITS: ALL
```

For truly automatic execution, select "Yes, and don't ask again this session" on the first prompt. Helper scripts are pre-approved in `.claude/settings.local.json` (machine-local, not committed).

## Known failure modes

- Port 3000 taken → an orphan `next dev` or rcv-simulator-va's main checkout.
- Stylelint color failures → a raw color landed outside a theme file; route it through tokens.
- deps:validate failures → fix the boundary violation, or (rarely, deliberately) re-baseline.
- deps:check failures → a violation got fixed but its baseline entry is still there; run `deps:baseline` and commit the smaller file.

## Pointers

- README.md — product overview.
- DESIGN.md, ADR-013 (PR #1526, supersedes ADR-011), and ADR-012 (#1484) — the single-design-system decision and the Storybook-as-canon surface.
