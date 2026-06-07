# Narraitor

Narraitor is an AI-driven narrative RPG framework. You build a world (its theme, attributes, skills, and tone), create characters in it, and play through a generated, choice-driven story with a tracked inventory and journal. It's a single-player web app — there's no backend database; player data lives in the browser (IndexedDB via Zustand persistence), and AI generation runs through the player's own provider key.

## Stack

- **Next.js 15** (App Router) + **React 19**, TypeScript.
- **Zustand 5** for state — one store per domain under `src/state/` (`characterStore`, `inventoryStore`, `journalStore`, `worldStore`, etc.), persisted to IndexedDB.
- **Plain CSS + design tokens** for styling: `var(--token)` values plus `clsx` for conditional classes. There is **no Tailwind** (it was removed) — don't add utility classes or reintroduce `cva`/`cn()`.
- AI generation goes through `src/lib/ai/` (Google Gemini via `@google/genai`), keyed by the player's own provider key rather than a server-held key.

## Layout

`src/` is domain-driven:
- `app/` — Next.js routes (App Router).
- `components/` — React components.
- `state/` — Zustand stores (the source of truth for app data).
- `lib/` — non-UI logic: `ai/`, `api/`, `design-tokens/`, `generators/`, `devtools/`, feature flags.
- `services/`, `hooks/`, `utils/`, `types/`, `styles/`, `stories/` (Storybook).

## Commands

- `npm run dev` — dev server on **port 3000** (per-worktree port auto-selected outside the main checkout). Check whether one's already running before starting it.
- `npm test` — Jest unit/integration suite.
- `npm run type-check` — `tsc --noEmit`.
- `npm run lint` — ESLint (Next + test/script globs).
- `npm run lint:css` — Stylelint over `**/*.css`. Run this after any `.css` edit; CI runs it separately and it'll fail the build if skipped.
- `npm run build` — production build (includes a Storybook build step).

## Conventions

- **Target the `develop` branch** for PRs, not `main`. `main` is release-only; `develop` is the rolling integration branch.
- KISS by default, in implementation and in tests — MVP-level tests, not exhaustive coverage. Never rig a test to pass.
- Style with design tokens, not hardcoded values. Avoid `!important` unless there's truly no alternative.
- Put an identifying class attribute on components.
- Look for an existing pattern/utility before adding a new one. One canon version per file — no `simple`/`enhanced` variants.

## Running in Claude Code cloud

Cloud sessions clone this repo fresh, so the `SessionStart` hook in `.claude/settings.json` runs `scripts/install_pkgs.sh` to `npm ci` on startup. Unit tests, type-check, lint, and build all work on the Linux cloud VM.

**Don't run the visual-regression or E2E suites in cloud** (`test:visual`, `test:e2e:*`) — the Playwright baselines are macOS-only and will fail on pixel diffs against a Linux runner. Those belong on a local Mac or the macOS CI job.
